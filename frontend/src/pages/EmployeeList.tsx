import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type Employee } from '../api/client';

const DEPARTMENTS = ['Engineering', 'Sales', 'Marketing', 'Finance', 'HR', 'Operations', 'Product', 'Customer Support', 'Legal', 'IT'];
const COUNTRIES = ['US', 'UK', 'India', 'Germany', 'Canada', 'Australia', 'Singapore', 'Brazil'];

export function EmployeeList() {
  const [data, setData] = useState<Employee[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [country, setCountry] = useState('');
  const pageSize = 20;

  useEffect(() => {
    api.listEmployees({ search, department, country, page, pageSize }).then((res) => {
      setData(res.data);
      setTotal(res.total);
    });
  }, [search, department, country, page]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(e) => { setPage(1); setSearch(e.target.value); }}
          placeholder="Search by name, email, or code"
          className="w-64 rounded-md border px-3 py-2 text-sm"
        />
        <select value={department} onChange={(e) => { setPage(1); setDepartment(e.target.value); }} className="rounded-md border px-3 py-2 text-sm">
          <option value="">All Departments</option>
          {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={country} onChange={(e) => { setPage(1); setCountry(e.target.value); }} className="rounded-md border px-3 py-2 text-sm">
          <option value="">All Countries</option>
          {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-left text-slate-600">
            <tr>
              <th className="px-4 py-2">Code</th>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Department</th>
              <th className="px-4 py-2">Country</th>
              <th className="px-4 py-2">Title</th>
              <th className="px-4 py-2">Current Salary</th>
            </tr>
          </thead>
          <tbody>
            {data.map((e) => (
              <tr key={e.id} className="border-t hover:bg-slate-50">
                <td className="px-4 py-2">{e.employee_code}</td>
                <td className="px-4 py-2">
                  <Link to={`/employees/${e.id}`} className="text-blue-600 hover:underline">
                    {e.first_name} {e.last_name}
                  </Link>
                </td>
                <td className="px-4 py-2">{e.department}</td>
                <td className="px-4 py-2">{e.country}</td>
                <td className="px-4 py-2">{e.job_title}</td>
                <td className="px-4 py-2">
                  {e.current_base_salary ? `${e.current_base_salary.toLocaleString()} ${e.current_currency}` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>{total.toLocaleString()} employees</span>
        <div className="flex items-center gap-2">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-md border px-3 py-1 disabled:opacity-40">Prev</button>
          <span>Page {page} of {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-md border px-3 py-1 disabled:opacity-40">Next</button>
        </div>
      </div>
    </div>
  );
}