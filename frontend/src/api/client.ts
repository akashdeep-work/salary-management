const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ? JSON.stringify(body.error) : `Request failed: ${res.status}`);
  }
  return res.json();
}

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
  current_base_salary: number | null;
  current_bonus: number | null;
  current_currency: string | null;
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

export interface PagedResult<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
}

export interface GroupStat {
  key: string;
  headcount: number;
  avgAnnualUsd: number;
  medianAnnualUsd: number;
}

export interface Summary {
  headcount: number;
  avgAnnualUsd: number;
  medianAnnualUsd: number;
  minAnnualUsd: number;
  maxAnnualUsd: number;
}

export const api = {
  listEmployees: (params: Record<string, string | number | undefined>) => {
    const query = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== '') as [string, string][]
    ).toString();
    return request<PagedResult<Employee>>(`/employees?${query}`);
  },
  createEmployee: (data: Record<string, unknown>) =>
    request<Employee>('/employees', { method: 'POST', body: JSON.stringify(data) }),
  getEmployee: (id: number) => request<Employee>(`/employees/${id}`),
  updateEmployee: (id: number, data: Partial<Employee>) =>
    request<Employee>(`/employees/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  getSalaryHistory: (id: number) => request<SalaryRecord[]>(`/employees/${id}/salary-history`),
  addSalaryRecord: (id: number, data: Partial<SalaryRecord>) =>
    request<SalaryRecord>(`/employees/${id}/salary`, { method: 'POST', body: JSON.stringify(data) }),
  getSummary: () => request<Summary>('/analytics/summary'),
  getByDepartment: () => request<GroupStat[]>('/analytics/by-department'),
  getByCountry: () => request<GroupStat[]>('/analytics/by-country'),
  getByGender: () => request<GroupStat[]>('/analytics/by-gender'),
  getSalaryBands: () => request<{ label: string; count: number }[]>('/analytics/salary-bands'),
};