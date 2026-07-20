import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';

const DEPARTMENTS = ['Engineering', 'Sales', 'Marketing', 'Finance', 'HR', 'Operations', 'Product', 'Customer Support', 'Legal', 'IT'];
const COUNTRIES: Record<string, string> = {
  US: 'USD', UK: 'GBP', India: 'INR', Germany: 'EUR', Canada: 'CAD', Australia: 'AUD', Singapore: 'SGD', Brazil: 'BRL',
};

const initialForm = {
  employee_code: '',
  first_name: '',
  last_name: '',
  email: '',
  gender: '',
  department: 'Engineering',
  job_title: '',
  level: '',
  country: 'US',
  employment_type: 'full_time',
  date_of_joining: '',
  starting_salary: '',
};

export function AddEmployee() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const employee: any = await api.createEmployee({
        ...form,
        currency: COUNTRIES[form.country],
        starting_salary: Number(form.starting_salary),
      });
      navigate(`/employees/${employee.id}`);
    } catch (err) {
      setError((err as Error).message || 'Failed to create employee');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-xl font-semibold text-slate-900">Add Employee</h1>

      {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <form onSubmit={handleSubmit} className="grid gap-3 rounded-lg border bg-white p-4 shadow-sm sm:grid-cols-2">
        <input required placeholder="Employee code (e.g. EMP10001)" value={form.employee_code}
          onChange={(e) => update('employee_code', e.target.value)} className="rounded-md border px-3 py-2 text-sm" />
        <input required placeholder="Email" type="email" value={form.email}
          onChange={(e) => update('email', e.target.value)} className="rounded-md border px-3 py-2 text-sm" />
        <input required placeholder="First name" value={form.first_name}
          onChange={(e) => update('first_name', e.target.value)} className="rounded-md border px-3 py-2 text-sm" />
        <input required placeholder="Last name" value={form.last_name}
          onChange={(e) => update('last_name', e.target.value)} className="rounded-md border px-3 py-2 text-sm" />
        <select value={form.gender} onChange={(e) => update('gender', e.target.value)} className="rounded-md border px-3 py-2 text-sm">
          <option value="">Gender (optional)</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="non_binary">Non-binary</option>
        </select>
        <select value={form.department} onChange={(e) => update('department', e.target.value)} className="rounded-md border px-3 py-2 text-sm">
          {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <input required placeholder="Job title" value={form.job_title}
          onChange={(e) => update('job_title', e.target.value)} className="rounded-md border px-3 py-2 text-sm" />
        <input placeholder="Level (e.g. Senior)" value={form.level}
          onChange={(e) => update('level', e.target.value)} className="rounded-md border px-3 py-2 text-sm" />
        <select value={form.country} onChange={(e) => update('country', e.target.value)} className="rounded-md border px-3 py-2 text-sm">
          {Object.keys(COUNTRIES).map((c) => <option key={c} value={c}>{c} ({COUNTRIES[c]})</option>)}
        </select>
        <select value={form.employment_type} onChange={(e) => update('employment_type', e.target.value)} className="rounded-md border px-3 py-2 text-sm">
          <option value="full_time">Full-time</option>
          <option value="contract">Contract</option>
        </select>
        <input required type="date" value={form.date_of_joining}
          onChange={(e) => update('date_of_joining', e.target.value)} className="rounded-md border px-3 py-2 text-sm" />
        <input required type="number" placeholder="Starting salary" value={form.starting_salary}
          onChange={(e) => update('starting_salary', e.target.value)} className="rounded-md border px-3 py-2 text-sm" />

        <button type="submit" disabled={submitting} className="w-fit rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 sm:col-span-2">
          {submitting ? 'Creating…' : 'Create Employee'}
        </button>
      </form>
    </div>
  );
}