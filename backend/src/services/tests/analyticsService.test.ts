import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '../../db/index.js';
import { createEmployee } from '../employeeService.js';
import { getSummary, getByDepartment, getByCountry, getSalaryBands } from '../analyticsService.js';

beforeEach(() => {
  db.exec('DELETE FROM salary_records; DELETE FROM employees;');
});

function seed() {
  createEmployee({
    employee_code: 'A1', first_name: 'A', last_name: 'One', email: 'a1@x.com',
    department: 'Engineering', job_title: 'Engineer', country: 'US', currency: 'USD',
    date_of_joining: '2023-01-01', starting_salary: 100000, gender: 'female',
  });
  createEmployee({
    employee_code: 'A2', first_name: 'A', last_name: 'Two', email: 'a2@x.com',
    department: 'Sales', job_title: 'Rep', country: 'UK', currency: 'GBP',
    date_of_joining: '2023-01-01', starting_salary: 50000, gender: 'male',
  });
}

describe('getSummary', () => {
  it('computes headcount and average salary in USD', () => {
    seed();
    const summary = getSummary();
    expect(summary.headcount).toBe(2);
    expect(summary.avgAnnualUsd).toBeGreaterThan(0);
  });
});

describe('getByDepartment', () => {
  it('groups current salaries by department', () => {
    seed();
    const rows = getByDepartment();
    expect(rows.map((r) => r.key).sort()).toEqual(['Engineering', 'Sales']);
  });
});

describe('getByCountry', () => {
  it('groups current salaries by country', () => {
    seed();
    expect(getByCountry()).toHaveLength(2);
  });
});

describe('getSalaryBands', () => {
  it('buckets employees into salary bands summing to total headcount', () => {
    seed();
    const bands = getSalaryBands();
    const total = bands.reduce((sum, b) => sum + b.count, 0);
    expect(total).toBe(2);
  });
});