import { db } from '../db/index.js';

export interface Employee {
  id: number;
  employee_code: string;
  first_name: string;
  last_name: string;
  email: string;
  gender: string | null;
  department: string;
  job_title: string;
  level: string | null;
  country: string;
  currency: string;
  employment_type: string;
  manager_id: number | null;
  date_of_joining: string;
  status: string;
}

export interface SalaryRecord {
  id: number;
  employee_id: number;
  base_salary: number;
  bonus: number;
  currency: string;
  pay_frequency: string;
  effective_date: string;
  reason: string | null;
}

export interface ListParams {
  search?: string;
  department?: string;
  country?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

const CURRENT_SALARY_JOIN = `
  LEFT JOIN (
    SELECT sr.*
    FROM salary_records sr
    JOIN (
      SELECT employee_id, MAX(effective_date) AS max_date
      FROM salary_records
      WHERE effective_date <= date('now')
      GROUP BY employee_id
    ) latest ON latest.employee_id = sr.employee_id AND latest.max_date = sr.effective_date
  ) cs ON cs.employee_id = e.id
`;

export function listEmployees(params: ListParams) {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20));
  const offset = (page - 1) * pageSize;

  const where: string[] = [];
  const args: Record<string, unknown> = {};

  if (params.search) {
    where.push(`(e.first_name LIKE @search OR e.last_name LIKE @search OR e.email LIKE @search OR e.employee_code LIKE @search)`);
    args.search = `%${params.search}%`;
  }
  if (params.department) {
    where.push(`e.department = @department`);
    args.department = params.department;
  }
  if (params.country) {
    where.push(`e.country = @country`);
    args.country = params.country;
  }
  if (params.status) {
    where.push(`e.status = @status`);
    args.status = params.status;
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const rows = db.prepare(`
    SELECT e.*, cs.base_salary AS current_base_salary, cs.bonus AS current_bonus, cs.currency AS current_currency
    FROM employees e
    ${CURRENT_SALARY_JOIN}
    ${whereSql}
    ORDER BY e.id
    LIMIT @pageSize OFFSET @offset
  `).all({ ...args, pageSize, offset });

  const total = (db.prepare(`SELECT COUNT(*) AS count FROM employees e ${whereSql}`).get(args) as { count: number }).count;

  return { data: rows, page, pageSize, total };
}

export function getEmployeeById(id: number) {
  return db.prepare(`
    SELECT e.*, cs.base_salary AS current_base_salary, cs.bonus AS current_bonus, cs.currency AS current_currency
    FROM employees e
    ${CURRENT_SALARY_JOIN}
    WHERE e.id = ?
  `).get(id);
}

export interface CreateEmployeeInput {
  employee_code: string;
  first_name: string;
  last_name: string;
  email: string;
  gender?: string | null;
  department: string;
  job_title: string;
  level?: string | null;
  country: string;
  currency: string;
  employment_type?: string;
  manager_id?: number | null;
  date_of_joining: string;
  starting_salary: number;
  starting_bonus?: number;
}

export function createEmployee(input: CreateEmployeeInput) {
  const insertEmployee = db.prepare(`
    INSERT INTO employees (employee_code, first_name, last_name, email, gender, department, job_title, level, country, currency, employment_type, manager_id, date_of_joining)
    VALUES (@employee_code, @first_name, @last_name, @email, @gender, @department, @job_title, @level, @country, @currency, @employment_type, @manager_id, @date_of_joining)
  `);
  const insertSalary = db.prepare(`
    INSERT INTO salary_records (employee_id, base_salary, bonus, currency, effective_date, reason)
    VALUES (@employee_id, @base_salary, @bonus, @currency, @effective_date, 'Initial salary')
  `);

  const tx = db.transaction((data: CreateEmployeeInput) => {
    const result = insertEmployee.run({
      employee_code: data.employee_code,
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email,
      gender: data.gender ?? null,
      department: data.department,
      job_title: data.job_title,
      level: data.level ?? null,
      country: data.country,
      currency: data.currency,
      employment_type: data.employment_type ?? 'full_time',
      manager_id: data.manager_id ?? null,
      date_of_joining: data.date_of_joining,
    });
    const employeeId = result.lastInsertRowid as number;
    insertSalary.run({
      employee_id: employeeId,
      base_salary: data.starting_salary,
      bonus: data.starting_bonus ?? 0,
      currency: data.currency,
      effective_date: data.date_of_joining,
    });
    return employeeId;
  });

  const id = tx(input);
  return getEmployeeById(id);
}

export interface UpdateEmployeeInput {
  first_name?: string;
  last_name?: string;
  email?: string;
  department?: string;
  job_title?: string;
  level?: string;
  country?: string;
  employment_type?: string;
  manager_id?: number | null;
  status?: string;
}

export function updateEmployee(id: number, input: UpdateEmployeeInput) {
  const fields = Object.keys(input);
  if (!fields.length) return getEmployeeById(id);
  const setSql = fields.map((f) => `${f} = @${f}`).join(', ');
  db.prepare(`UPDATE employees SET ${setSql}, updated_at = datetime('now') WHERE id = @id`).run({ ...input, id });
  return getEmployeeById(id);
}

export interface AddSalaryRecordInput {
  base_salary: number;
  bonus?: number;
  currency: string;
  effective_date: string;
  pay_frequency?: string;
  reason?: string;
}

export function addSalaryRecord(employeeId: number, input: AddSalaryRecordInput) {
  const result = db.prepare(`
    INSERT INTO salary_records (employee_id, base_salary, bonus, currency, pay_frequency, effective_date, reason)
    VALUES (@employee_id, @base_salary, @bonus, @currency, @pay_frequency, @effective_date, @reason)
  `).run({
    employee_id: employeeId,
    base_salary: input.base_salary,
    bonus: input.bonus ?? 0,
    currency: input.currency,
    pay_frequency: input.pay_frequency ?? 'annual',
    effective_date: input.effective_date,
    reason: input.reason ?? null,
  });
  return db.prepare('SELECT * FROM salary_records WHERE id = ?').get(result.lastInsertRowid);
}

export function getSalaryHistory(employeeId: number) {
  return db.prepare(`
    SELECT * FROM salary_records WHERE employee_id = ? ORDER BY effective_date DESC, id DESC
  `).all(employeeId);
}

export function employeeExists(id: number) {
  return !!db.prepare('SELECT 1 FROM employees WHERE id = ?').get(id);
}