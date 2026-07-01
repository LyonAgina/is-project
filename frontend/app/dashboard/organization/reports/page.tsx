// @ts-nocheck
'use client';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const COLORS = ['#1a1a1a', '#555555', '#888888', '#aaaaaa', '#cccccc'];

function ChartCard({ title, children }) {
  return (
    <div className="border border-[var(--color-line)] rounded-xl p-5">
      <p className="text-xs uppercase tracking-wide text-[var(--color-muted)] mb-4">{title}</p>
      {children}
    </div>
  );
}

function Empty() {
  return <p className="text-sm text-[var(--color-muted)]">No data yet.</p>;
}

export default function OrgReports() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch('/api/organization/reports')
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setData(d);
      })
      .catch((err) => setError(err.message || 'Failed to load report data'));
  }, []);

  if (error) return <p className="text-red-600">{error}</p>;
  if (!data) return <p className="text-[var(--color-muted)]">Loading reports…</p>;

  const oppStatusData = data.oppsByStatus.map((r) => ({
    name: r.label.charAt(0).toUpperCase() + r.label.slice(1),
    value: Number(r.count),
  }));

  const oppCategoryData = data.oppsByCategory.map((r) => ({
    name: r.label.charAt(0).toUpperCase() + r.label.slice(1),
    value: Number(r.count),
  }));

  const appStatusData = data.appsByStatus.map((r) => ({
    name: r.label.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    value: Number(r.count),
  }));

  const monthlyAppData = data.monthlyApplications.map((r) => ({
    month: r.month,
    applications: Number(r.count),
  }));

  const topOppsData = data.topOpportunities.map((r) => ({
    title: r.title.length > 22 ? r.title.slice(0, 22) + '…' : r.title,
    applicants: Number(r.applicants),
  }));

  // summary counts
  const totalOpps = oppStatusData.reduce((s, r) => s + r.value, 0);
  const totalApps = appStatusData.reduce((s, r) => s + r.value, 0);
  const activeOpps = data.oppsByStatus.find((r) => r.label === 'active');

  return (
    <div>
      <h1 className="font-display text-2xl font-bold mb-8">Reports</h1>

      {/* Summary stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
        {[
          { label: 'Opportunities posted', value: totalOpps },
          { label: 'Active opportunities', value: activeOpps ? Number(activeOpps.count) : 0 },
          { label: 'Total applications', value: totalApps },
        ].map((c) => (
          <div key={c.label} className="border border-[var(--color-line)] rounded-xl p-5">
            <p className="text-xs uppercase tracking-wide text-[var(--color-muted)] mb-2">{c.label}</p>
            <p className="font-mono text-3xl font-semibold">{c.value}</p>
          </div>
        ))}
      </div>

      {/* Monthly applications line chart */}
      <section className="mb-10">
        <h2 className="font-display text-base font-semibold mb-4">Applications received — last 6 months</h2>
        <div className="border border-[var(--color-line)] rounded-xl p-5">
          {monthlyAppData.length === 0 ? <Empty /> : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={monthlyAppData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line)" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="applications"
                  stroke="#1a1a1a"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      {/* Top opportunities bar chart */}
      <section className="mb-10">
        <h2 className="font-display text-base font-semibold mb-4">Top opportunities by applicants</h2>
        <div className="border border-[var(--color-line)] rounded-xl p-5">
          {topOppsData.length === 0 ? <Empty /> : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={topOppsData} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line)" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="title" tick={{ fontSize: 11 }} width={140} />
                <Tooltip />
                <Bar dataKey="applicants" fill="#1a1a1a" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      {/* Pie charts row */}
      <section className="mb-10">
        <h2 className="font-display text-base font-semibold mb-4">Breakdowns</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ChartCard title="Opportunity status">
            {oppStatusData.length === 0 ? <Empty /> : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={oppStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                    {oppStatusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title="Opportunity category">
            {oppCategoryData.length === 0 ? <Empty /> : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={oppCategoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                    {oppCategoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title="Application status">
            {appStatusData.length === 0 ? <Empty /> : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={appStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                    {appStatusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>
      </section>
    </div>
  );
}
