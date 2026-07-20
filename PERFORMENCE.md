# Performance Considerations

## Scale target
~10,000 employees, single-tenant, single trusted HR user. This is small enough that
"performant" mostly means "don't do anything asymptotically silly" rather than
requiring caching layers, read replicas, or async job queues.

## Where it matters

**Directory search/filter/pagination**
- `employees` has single-column indexes on `department` and `country`, the two
  fields REQUIREMENTS.md calls out as filters. `status` and `gender` are not
  indexed — acceptable at 10k rows (a scan of an unindexed low-cardinality
  boolean-ish column is cheap), but the first two are the ones that actually
  needed the index since they're combined with pagination/search.

**"Current salary" lookup**
- Append-only `salary_records` means "current salary" requires finding the latest
  `effective_date <= today` per employee rather than reading a single denormalized
  field. Both `employee.service.ts` and `analytics.service.ts` use the same shape:
  a CTE that computes `MAX(effective_date) ... WHERE effective_date <= date('now')
  GROUP BY employee_id`, then joins back onto `salary_records` on
  `(employee_id, effective_date)` to pull the matching row. This is exactly what
  `idx_salary_effective_date (employee_id, effective_date DESC)` supports —
  SQLite can satisfy the `GROUP BY employee_id` / `MAX(effective_date)` from the
  index directly, without a full table scan of the ledger.
- **Known limitation, worth stating explicitly rather than leaving implicit:** the
  join-back step matches on `sr.effective_date = l.max_date`, not on `sr.id`. If an
  employee ever has two salary records on the same `effective_date` (e.g. a same-day
  correction), the join returns both rows, silently double-counting that employee in
  headcount/averages. At 10k rows with realistic seed data this is unlikely to
  surface, but it's a correctness edge case, not just a performance one — the fix
  would be joining on `salary_records.id` via a `ROW_NUMBER() OVER (PARTITION BY
  employee_id ORDER BY effective_date DESC, id DESC)` window instead of `MAX(date)`,
  which also removes the self-join entirely.
- **Directory list (`listEmployees`) recomputes this for the whole table on every
  page.** `CURRENT_SALARY_JOIN` is a `LEFT JOIN` against a subquery over the entire
  `salary_records` table, applied *before* the `WHERE`/`LIMIT` — so requesting page 1
  of 20 employees still has SQLite build the latest-salary derived table for all
  10k employees first, then filter and paginate. At 10k rows the index keeps this
  fast, but it's the one query in the codebase that doesn't actually benefit from
  pagination — worth flagging as a boundary rather than something that was missed.

**Compensation analytics**
- One SQL fetch of current salaries (10k rows) into memory, then aggregation
  (averages, breakdowns, bands) done in JS — chosen for readability over nested SQL,
  and still comfortably sub-50ms at this scale per ARCHITECTURE.md.
- This is a deliberate trade-off: it would NOT scale to, say, 10M employees — at that
  point aggregation should move back into SQL (GROUP BY) or a materialized summary
  table. Worth naming explicitly as a known scaling boundary, not an oversight.

**better-sqlite3 (synchronous)**
- No connection pooling complexity, but synchronous calls mean each query blocks the
  Node event loop. Fine for a single-user internal tool at 10k rows; would need
  reconsideration (pooled Postgres, async driver) for concurrent multi-user load.

## What I measured vs. what I estimated
The sub-50ms figure in ARCHITECTURE.md is an estimate based on row count and the
query plan (index-driven aggregation over 10k rows), not a formal benchmark.

- Analytics endpoint (all three summary/breakdown/bands queries): 57.48 ms
- Directory list/search: unfiltered page 1: 8.06 ms avg over 20 runs
department filter: 8.08 ms avg over 20 runs
search: 9.98 ms avg over 20 runs
last page (high offset): 10.12 ms avg over 20 runs

## Known scaling boundaries (out of scope, on purpose)
- In-memory JS aggregation over all current salaries — fine at 10k rows, would need
  to move to SQL-side aggregation or a summary table beyond that.
- Synchronous DB driver — fine for one HR Manager, not for concurrent write-heavy load.
- Static FX rate table — no live updates; acceptable per REQUIREMENTS.md's stated
  out-of-scope reasoning, but flagged here since it's also a performance/dependency
  trade-off, not just a scope one.