import { db } from '../db/index.js';
import { toUsd } from '../utils/currency.js';

interface CurrentSalaryRow {
  employee_id: number;
  department: string;
  country: string;
  gender: string | null;
  base_salary: number;
  bonus: number;
  currency: string;
}

const CURRENT_SALARY_QUERY = `
  WITH latest AS (
    SELECT employee_id, MAX(effective_date) AS max_date
    FROM salary_records
    WHERE effective_date <= date('now')
    GROUP BY employee_id
  )
  SELECT e.id AS employee_id, e.department, e.country, e.gender,
         sr.base_salary, sr.bonus, sr.currency
  FROM employees e
  JOIN latest l ON l.employee_id = e.id
  JOIN salary_records sr ON sr.employee_id = l.employee_id AND sr.effective_date = l.max_date
  WHERE e.status = 'active'
`;

function getCurrentSalaries(): CurrentSalaryRow[] {
  return db.prepare(CURRENT_SALARY_QUERY).all() as CurrentSalaryRow[];
}

function annualUsd(row: CurrentSalaryRow) {
  return toUsd(row.base_salary + row.bonus, row.currency);
}

function median(nums: number[]) {
  if (!nums.length) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

export function getSummary() {
  const rows = getCurrentSalaries();
  const totals = rows.map(annualUsd);
  return {
    headcount: rows.length,
    avgAnnualUsd: totals.length ? totals.reduce((a, b) => a + b, 0) / totals.length : 0,
    medianAnnualUsd: median(totals),
    minAnnualUsd: totals.length ? Math.min(...totals) : 0,
    maxAnnualUsd: totals.length ? Math.max(...totals) : 0,
  };
}

function groupBy(rows: CurrentSalaryRow[], key: 'department' | 'country' | 'gender') {
  const groups = new Map<string, number[]>();
  for (const row of rows) {
    const k = (row[key] || 'Unknown') as string;
    const usd = annualUsd(row);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(usd);
  }
  return Array.from(groups.entries())
    .map(([key, values]) => ({
      key,
      headcount: values.length,
      avgAnnualUsd: values.reduce((a, b) => a + b, 0) / values.length,
      medianAnnualUsd: median(values),
    }))
    .sort((a, b) => b.avgAnnualUsd - a.avgAnnualUsd);
}

export function getByDepartment() {
  return groupBy(getCurrentSalaries(), 'department');
}

export function getByCountry() {
  return groupBy(getCurrentSalaries(), 'country');
}

export function getByGender() {
  return groupBy(getCurrentSalaries(), 'gender');
}

export function getSalaryBands() {
  const rows = getCurrentSalaries();
  const bands = [0, 30000, 60000, 100000, 150000, 250000, Infinity];
  const labels = ['<30k', '30k-60k', '60k-100k', '100k-150k', '150k-250k', '250k+'];
  const counts = new Array(labels.length).fill(0);
  for (const row of rows) {
    const usd = annualUsd(row);
    for (let i = 0; i < bands.length - 1; i++) {
      if (usd >= bands[i] && usd < bands[i + 1]) {
        counts[i]++;
        break;
      }
    }
  }
  return labels.map((label, i) => ({ label, count: counts[i] }));
}