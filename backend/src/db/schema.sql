CREATE TABLE IF NOT EXISTS employees (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_code TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  gender TEXT,
  department TEXT NOT NULL,
  job_title TEXT NOT NULL,
  level TEXT,
  country TEXT NOT NULL,
  currency TEXT NOT NULL,
  employment_type TEXT NOT NULL DEFAULT 'full_time',
  manager_id INTEGER REFERENCES employees(id),
  date_of_joining TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS salary_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL REFERENCES employees(id),
  base_salary REAL NOT NULL,
  bonus REAL NOT NULL DEFAULT 0,
  currency TEXT NOT NULL,
  pay_frequency TEXT NOT NULL DEFAULT 'annual',
  effective_date TEXT NOT NULL,
  reason TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department);
CREATE INDEX IF NOT EXISTS idx_employees_country ON employees(country);
CREATE INDEX IF NOT EXISTS idx_salary_employee ON salary_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_salary_effective_date ON salary_records(employee_id, effective_date DESC);