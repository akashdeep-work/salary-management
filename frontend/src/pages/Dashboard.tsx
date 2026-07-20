import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { api, type GroupStat, type Summary } from '../api/client';
import { StatCard } from '../components/StatCard';

const usd = (n: number) => `$${Math.round(n).toLocaleString()}`;

export function Dashboard() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [byDept, setByDept] = useState<GroupStat[]>([]);
  const [byCountry, setByCountry] = useState<GroupStat[]>([]);
  const [byGender, setByGender] = useState<GroupStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getSummary(), api.getByDepartment(), api.getByCountry(), api.getByGender()])
      .then(([s, d, c, g]) => {
        setSummary(s);
        setByDept(d);
        setByCountry(c);
        setByGender(g);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-slate-500">Loading dashboard…</div>;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Active Employees" value={String(summary?.headcount ?? 0)} />
        <StatCard label="Average Pay (USD)" value={usd(summary?.avgAnnualUsd ?? 0)} />
        <StatCard label="Median Pay (USD)" value={usd(summary?.medianAnnualUsd ?? 0)} />
        <StatCard label="Pay Range (USD)" value={`${usd(summary?.minAnnualUsd ?? 0)} - ${usd(summary?.maxAnnualUsd ?? 0)}`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-700">Average Pay by Department (USD)</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={byDept}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="key" tick={{ fontSize: 11 }} interval={0} angle={-30} textAnchor="end" height={70} />
              <YAxis tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
              <Tooltip formatter={(v: number) => usd(v)} />
              <Bar dataKey="avgAnnualUsd" fill="#0f172a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-700">Average Pay by Country (USD)</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={byCountry}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="key" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
              <Tooltip formatter={(v: number) => usd(v)} />
              <Bar dataKey="avgAnnualUsd" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-slate-700">Pay by Gender (USD)</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-slate-500">
              <th className="py-2">Gender</th>
              <th className="py-2">Headcount</th>
              <th className="py-2">Average</th>
              <th className="py-2">Median</th>
            </tr>
          </thead>
          <tbody>
            {byGender.map((g) => (
              <tr key={g.key} className="border-b last:border-0">
                <td className="py-2 capitalize">{g.key.replace('_', ' ')}</td>
                <td className="py-2">{g.headcount}</td>
                <td className="py-2">{usd(g.avgAnnualUsd)}</td>
                <td className="py-2">{usd(g.medianAnnualUsd)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}