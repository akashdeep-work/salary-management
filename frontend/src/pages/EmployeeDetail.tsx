import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api, type Employee, type SalaryRecord } from '../api/client';

export function EmployeeDetail() {
  const { id } = useParams();
  const employeeId = Number(id);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [history, setHistory] = useState<SalaryRecord[]>([]);
  const [jobTitle, setJobTitle] = useState('');
  const [status, setStatus] = useState('active');
  const [newSalary, setNewSalary] = useState({ base_salary: '', currency: 'USD', effective_date: '', reason: '' });
  const [message, setMessage] = useState('');

  const load = useCallback(() =>{
    api.getEmployee(employeeId).then((e) => {
      setEmployee(e);
      setJobTitle(e.job_title);
      setStatus(e.status);
      setNewSalary((s) => ({ ...s, currency: e.currency }));
    });
    api.getSalaryHistory(employeeId).then(setHistory);
  },[employeeId])

  useEffect(() => { load(); }, [employeeId, load]);

  async function saveProfile() {
    await api.updateEmployee(employeeId, { job_title: jobTitle, status });
    setMessage('Profile updated');
    load();
  }

  async function submitSalary(e: React.FormEvent) {
    e.preventDefault();
    await api.addSalaryRecord(employeeId, {
      base_salary: Number(newSalary.base_salary),
      currency: newSalary.currency,
      effective_date: newSalary.effective_date,
      reason: newSalary.reason,
    });
    setNewSalary({ base_salary: '', currency: employee?.currency ?? 'USD', effective_date: '', reason: '' });
    setMessage('Salary revision added');
    load();
  }

  if (!employee) return <div className="text-slate-500">Loading…</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">{employee.first_name} {employee.last_name}</h1>
        <p className="text-sm text-slate-500">{employee.employee_code} · {employee.department} · {employee.country}</p>
      </div>

      {message && <div className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">{message}</div>}

      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Profile</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm text-slate-600">
            Job Title
            <input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2" />
          </label>
          <label className="text-sm text-slate-600">
            Status
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>
        </div>
        <button onClick={saveProfile} className="mt-4 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white">
          Save Profile
        </button>
      </div>

      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Add Salary Revision</h2>
        <form onSubmit={submitSalary} className="grid gap-3 sm:grid-cols-4">
          <input required type="number" placeholder="Base salary" value={newSalary.base_salary}
            onChange={(e) => setNewSalary({ ...newSalary, base_salary: e.target.value })}
            className="rounded-md border px-3 py-2 text-sm" />
          <input required placeholder="Currency" value={newSalary.currency}
            onChange={(e) => setNewSalary({ ...newSalary, currency: e.target.value })}
            className="rounded-md border px-3 py-2 text-sm" />
          <input required type="date" value={newSalary.effective_date}
            onChange={(e) => setNewSalary({ ...newSalary, effective_date: e.target.value })}
            className="rounded-md border px-3 py-2 text-sm" />
          <input placeholder="Reason" value={newSalary.reason}
            onChange={(e) => setNewSalary({ ...newSalary, reason: e.target.value })}
            className="rounded-md border px-3 py-2 text-sm" />
          <button type="submit" className="w-fit rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white sm:col-span-4">
            Add Revision
          </button>
        </form>
      </div>

      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Salary History</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-slate-500">
              <th className="py-2">Effective Date</th>
              <th className="py-2">Base Salary</th>
              <th className="py-2">Bonus</th>
              <th className="py-2">Reason</th>
            </tr>
          </thead>
          <tbody>
            {history.map((h) => (
              <tr key={h.id} className="border-b last:border-0">
                <td className="py-2">{h.effective_date}</td>
                <td className="py-2">{h.base_salary.toLocaleString()} {h.currency}</td>
                <td className="py-2">{h.bonus.toLocaleString()}</td>
                <td className="py-2">{h.reason ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}