# Architecture & Trade-offs

## Data Model
`employees` holds identity/org fields. `salary_records` is an append-only ledger keyed by `employee_id` + `effective_date`; "current salary" is the latest record with `effective_date <= today`. This preserves full compensation history and supports "salary as of X" queries later without a schema change.

## Backend
Express + better-sqlite3 (synchronous, no pooling complexity) is sufficient at 10k rows. Hand-written parameterized SQL was chosen over an ORM for transparency and query control. Business logic lives in `services/`; routes only validate (Zod) and map to HTTP.

## Analytics
USD normalization uses a static rate table instead of a live FX API — deterministic, no external dependency. Aggregation happens in JS after one SQL fetch of current salaries (10k rows) — simpler to read/maintain than nested SQL, still sub-50ms.

## Frontend
Tailwind instead of a full component library — a data-dense internal tool benefits from precise table/form control; recharts covers the two charts needed.

## Testing
Vitest against an in-memory SQLite DB (`DB_PATH=':memory:'`) — same schema/query paths as production, no DB mocking, fast and deterministic.

## Known Simplifications
No auth, no payroll/tax logic, no live FX, no bulk import UI — see REQUIREMENTS.md.