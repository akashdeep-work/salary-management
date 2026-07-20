# Salary Management System — Requirements

## Goal
Enable ACME's HR Manager to manage salary data for ~10,000 employees across multiple countries through a web application, replacing spreadsheets, and to answer compensation questions (averages, distribution, equity) without manual analysis.

## Primary User
HR Manager — needs to look up/edit employee records, record salary changes with a history, and get quick answers about how the org pays people.

## In Scope
- Employee directory: search, filter (department/country/status), paginated list, detail view.
- Salary management: current salary per employee, full revision history (raises, promotions) with effective dates and reasons — append-only, never overwritten.
- Compensation analytics: headcount, average/median/min/max pay (normalized to USD), breakdown by department, country, and gender, and a salary-band distribution.
- Seed data: 10,000 realistic employees across 10 departments, 8 countries/currencies, and a manager hierarchy.
- REST API + React UI, automated tests for core services.

## Deliberately Out of Scope (and why)
- **Auth/RBAC/audit trails** — a real HR tool needs this, but it's a project of its own; a single trusted HR Manager persona doesn't require it to prove the core problem. First follow-up item.
- **Payroll/tax/statutory deductions** — this is a system of record for compensation decisions, not a payroll run engine.
- **Live FX rates** — analytics normalize to USD via a static rate table instead of a live FX API, keeping the system dependency-free and deterministic for tests.
- **Employee self-service / approval workflows** — no employee login, no approval chain; HR Manager is the sole actor per the given persona.
- **Org chart visualization** — `manager_id` is modeled for future use but not rendered, to keep UI scope tight.
- **Bulk CSV import UI** — seeding covers the "10k employees" requirement; import UI is a natural next feature, not required to prove the core loop.

## Success Criteria
HR Manager can find any employee in seconds, append salary history without losing prior data, and get department/country/gender pay breakdowns without opening Excel.