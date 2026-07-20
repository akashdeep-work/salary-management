import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '../../db/index.js';
import {
  createEmployee, getEmployeeById, listEmployees, updateEmployee,
  addSalaryRecord, getSalaryHistory,
} from '../employeeService.js';

beforeEach(() => {
  db.exec('DELETE FROM salary_records; DELETE FROM employees;');
});

function makeEmployee(overrides: Record<string, unknown> = {}) {
  return createEmployee({
    employee_code: 'EMP0001',
    first_name: 'Jane',
    last_name: 'Doe',
    email: 'jane@example.com',
    department: 'Engineering',
    job_title: 'Software Engineer',
    country: 'US',
    currency: 'USD',
    date_of_joining: '2023-01-15',
    starting_salary: 100000,
    ...overrides,
  } as any);
}

describe('createEmployee', () => {
  it('creates an employee with an initial salary record', () => {
    const employee: any = makeEmployee();
    expect(employee.id).toBeDefined();
    expect(employee.current_base_salary).toBe(100000);
    expect(getSalaryHistory(employee.id)).toHaveLength(1);
  });
});

describe('getEmployeeById', () => {
  it('returns undefined for a non-existent employee', () => {
    expect(getEmployeeById(9999)).toBeUndefined();
  });
});

describe('listEmployees', () => {
  it('filters by department', () => {
    makeEmployee({ employee_code: 'EMP0001', email: 'a@example.com', department: 'Engineering' });
    makeEmployee({ employee_code: 'EMP0002', email: 'b@example.com', department: 'Sales' });
    const result = listEmployees({ department: 'Engineering' });
    expect(result.total).toBe(1);
    expect(result.data).toHaveLength(1);
  });

  it('searches by name', () => {
    makeEmployee({ employee_code: 'EMP0003', email: 'c@example.com', first_name: 'Zara' });
    const result = listEmployees({ search: 'Zara' });
    expect(result.total).toBe(1);
  });
});

describe('updateEmployee', () => {
  it('updates allowed fields only', () => {
    const employee: any = makeEmployee({ employee_code: 'EMP0004', email: 'd@example.com' });
    const updated: any = updateEmployee(employee.id, { job_title: 'Senior Software Engineer' });
    expect(updated.job_title).toBe('Senior Software Engineer');
  });
});

describe('addSalaryRecord', () => {
  it('appends a new revision and updates the current salary', () => {
    const employee: any = makeEmployee({ employee_code: 'EMP0005', email: 'e@example.com' });
    addSalaryRecord(employee.id, {
      base_salary: 120000,
      currency: 'USD',
      effective_date: '2024-06-01',
      reason: 'Promotion',
    });
    expect(getSalaryHistory(employee.id)).toHaveLength(2);
    const updated: any = getEmployeeById(employee.id);
    expect(updated.current_base_salary).toBe(120000);
  });
});