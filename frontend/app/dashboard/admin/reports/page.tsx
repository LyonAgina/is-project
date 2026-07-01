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

const COLORS = ['#1a1a1a', '#555555', '#999999', '#cccccc', '#e5e5e5'];

function SectionHeading({ children }) {
  return (
    <h2 className="font-display text-base font-semibold mb-4 text-[var(--color-ink)]">
      {children}
    </h2>
  );
}

function ChartCard({ title, children }) {
  return (
    <div className="border border-[var(--color-line)] rounded-xl p-5">
      <p className="text-xs uppercase tracking-wide text-[var(--color-muted)] mb-4">{title}</p>
      {children}
    </div>
  );
}

export default function AdminReports() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch('/api/admin/reports')
      .then((res) => res.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setData(d);
      })
      .catch((err) => setError(err.message || 'Failed to load report data'));
  }, []);

  if (error) return <p className="text-red-600">{error}</p>;
  if (!data) return <p className="text-[var(--color-muted)]">Loading reports…</p>;

  // --- shape monthly registrations into a single array keyed by month ---
  const monthMap: Record<string, { month: string; students: number; organizations: number }> = {};
  for (const row of data.monthlyRegistrations) {
    if (!monthMap[row.month]) monthMap[row.month] = { month: row.month, students: 0, organizations: 0 };
    if (row.role === 'student') monthMap[row.month].students = Number(row.count);
    if (row.role === 'organization') monthMap[row.month].organizations = Number(row.count);
  }
  const monthlyRegData = Object.values(monthMap);

  const oppCategoryData = data.opportunitiesByCategory.map((r) => ({
    name: r.category.charAt(0).toUpperCase() + r.category.slice(1),
    value: Number(r.count),
  }));

  const oppStatusData = data.opportunitiesByStatus.map((r) => ({
    name: r.label.charAt(0).toUpperCase() + r.label.slice(1),
    value: Number(r.count),
  }));

  const orgVerifData = data.orgVerification.map((r) => ({
    name: r.label.charAt(0).toUpperCase() + r.label.slice(1),
    value: Number(r.count),
  }));

  const appStatusData = data.applicationsByStatus.map((r) => ({
    name: r.label.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    value: Number(r.count),
  }));

  const monthlyAppData = data.monthlyApplications.map((r) => ({
    month: r.month,
    applications: Number(r.count),
  }));

  return (
    <div>
      <h1 className="font-display text-2xl font-bold mb-8">Reports</h1>

      {/* --- User Growth --- */}
      <section className="mb-10">
        <SectionHeading>User registrations — last 6 months</SectionHeading>
        <div className="border border-[var(--color-line)] rounded-xl p-5">
          {monthlyRegData.length === 0 ? (
            <p className="text-sm text-[var(--color-muted)]">No registration data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={monthlyRegData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line)" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="students" fill="#1a1a1a" radius={[4, 4, 0, 0]} />
                <Bar dataKey="organizations" fill="#888888" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      {/* --- Applications over time --- */}
      <section className="mb-10">
        <SectionHeading>Applications submitted — last 6 months</SectionHeading>
        <div className="border border-[var(--color-line)] rounded-xl p-5">
          {monthlyAppData.length === 0 ? (
            <p className="text-sm text-[var(--color-muted)]">No application data yet.</p>
          ) : (
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

      {/* --- Pie charts row --- */}
      <section className="mb-10">
        <SectionHeading>Breakdowns</SectionHeading>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <ChartCard title="Opportunities by category">
            {oppCategoryData.length === 0 ? (
              <p className="text-sm text-[var(--color-muted)]">No data.</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={oppCategoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                    {oppCategoryData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title="Opportunity status">
            {oppStatusData.length === 0 ? (
              <p className="text-sm text-[var(--color-muted)]">No data.</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={oppStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                    {oppStatusData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title="Organisation verification">
            {orgVerifData.length === 0 ? (
              <p className="text-sm text-[var(--color-muted)]">No data.</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={orgVerifData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                    {orgVerifData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title="Application status">
            {appStatusData.length === 0 ? (
              <p className="text-sm text-[var(--color-muted)]">No data.</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={appStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                    {appStatusData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
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
