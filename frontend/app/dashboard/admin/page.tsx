// @ts-nocheck
'use client';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Polished Chart Colors (Using System Blues)
const CHART_COLORS = ['#1e3a8a', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'];

function ChartCard({ title, children }) {
  return (
    <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--color-line)', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column' }}>
      <p style={{ fontFamily: 'var(--font-body-text), sans-serif', fontSize: '11px', fontWeight: '700', letterSpacing: '0.05em', color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: '20px' }}>{title}</p>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}

function Empty() {
  return <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p style={{ fontSize: '14px', color: 'var(--color-muted)', fontWeight: '500' }}>No data available.</p></div>;
}

export default function AdminHome() {
  const [stats, setStats] = useState(null);
  const [reports, setReports] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      apiFetch('/api/admin/stats').then(res => res.json()),
      apiFetch('/api/admin/reports').then(res => res.json())
    ]).then(([statsData, reportsData]) => {
      if (statsData.error) throw new Error(statsData.error);
      if (reportsData.error) throw new Error(reportsData.error);
      setStats(statsData);
      setReports(reportsData);
    }).catch(err => setError(err.message || 'Failed to load dashboard data'));
  }, []);

  if (error) return <p style={{ color: '#dc2626', fontWeight: '600' }}>{error}</p>;
  if (!stats || !reports) return <p style={{ color: 'var(--color-muted)', fontWeight: '500' }}>Loading system analytics…</p>;

  // Process data for charts
  const monthMap: Record<string, { month: string; students: number; organizations: number }> = {};
  for (const row of reports.monthlyRegistrations) {
    if (!monthMap[row.month]) monthMap[row.month] = { month: row.month, students: 0, organizations: 0 };
    if (row.role === 'student') monthMap[row.month].students = Number(row.count);
    if (row.role === 'organization') monthMap[row.month].organizations = Number(row.count);
  }
  const monthlyRegData = Object.values(monthMap);
  const monthlyAppData = reports.monthlyApplications.map((r) => ({ month: r.month, applications: Number(r.count) }));
  
  const oppCategoryData = reports.opportunitiesByCategory.map((r) => ({ name: r.category.charAt(0).toUpperCase() + r.category.slice(1), value: Number(r.count) }));
  const oppStatusData = reports.opportunitiesByStatus.map((r) => ({ name: r.label.charAt(0).toUpperCase() + r.label.slice(1), value: Number(r.count) }));
  const orgVerifData = reports.orgVerification.map((r) => ({ name: r.label.charAt(0).toUpperCase() + r.label.slice(1), value: Number(r.count) }));

  const topStats = [
    { label: 'Total Students', value: stats.total_students, dot: '#1e3a8a' },
    { label: 'Total Organizations', value: stats.total_organizations, dot: '#3b82f6' },
    { label: 'Pending Orgs', value: stats.pending_organizations, dot: '#f59e0b' },
    { label: 'Active Opportunities', value: stats.active_opportunities, dot: '#10b981' },
    { label: 'Total Applications', value: stats.total_applications, dot: '#6366f1' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', paddingBottom: '40px' }}>
      
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: 'var(--color-ink)', margin: '0 0 8px 0' }}>Platform Overview</h1>
        <p style={{ margin: 0, color: 'var(--color-muted)', fontWeight: '500', fontSize: '15px' }}>System overview and analytics dashboard.</p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }} className="stats-grid">
        {topStats.map((c) => (
          <div key={c.label} style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px', border: '1px solid var(--color-line)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '130px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: c.dot }} />
              <p style={{ margin: 0, fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-muted)' }}>{c.label}</p>
            </div>
            <p style={{ fontFamily: 'var(--font-mono), monospace', margin: 0, fontSize: '36px', fontWeight: '700', color: 'var(--color-ink)', letterSpacing: '-0.03em' }}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Main Trend Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '32px' }} className="responsive-grid-2 chart-row">
        
        {/* Registrations Bar Chart */}
        <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--color-line)', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
          <h2 style={{ fontFamily: 'var(--font-disp), sans-serif', fontSize: '18px', fontWeight: '700', marginBottom: '24px', color: 'var(--color-ink)' }}>User Registration</h2>
          {monthlyRegData.length === 0 ? <Empty /> : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthlyRegData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-line)" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--color-muted)', fontFamily: 'var(--font-body-text)' }} axisLine={false} tickLine={false} dy={10} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: 'var(--color-muted)', fontFamily: 'var(--font-body-text)' }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: 'var(--color-paper)' }} contentStyle={{ borderRadius: '12px', border: '1px solid var(--color-line)', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontFamily: 'var(--font-body-text)' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '13px', fontWeight: '500', color: 'var(--color-ink)', paddingTop: '10px', fontFamily: 'var(--font-body-text)' }} />
                <Bar dataKey="students" name="Students" fill="#1e3a8a" radius={[4, 4, 0, 0]} barSize={32} />
                <Bar dataKey="organizations" name="Organizations" fill="#60a5fa" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Applications Line Chart */}
        <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--color-line)', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
          <h2 style={{ fontFamily: 'var(--font-disp), sans-serif', fontSize: '18px', fontWeight: '700', marginBottom: '24px', color: 'var(--color-ink)' }}>Application Submission Trends</h2>
          {monthlyAppData.length === 0 ? <Empty /> : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={monthlyAppData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-line)" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--color-muted)', fontFamily: 'var(--font-body-text)' }} axisLine={false} tickLine={false} dy={10} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: 'var(--color-muted)', fontFamily: 'var(--font-body-text)' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid var(--color-line)', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontFamily: 'var(--font-body-text)' }} />
                <Line type="monotone" dataKey="applications" name="Applications" stroke="#1e3a8a" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#ffffff' }} activeDot={{ r: 6, fill: '#1e3a8a' }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Breakdowns Row (Pie Charts) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }} className="responsive-grid-2">
        <ChartCard title="Opportunity Categories">
          {oppCategoryData.length === 0 ? <Empty /> : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={oppCategoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2}>
                  {oppCategoryData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} stroke="transparent" />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid var(--color-line)', fontFamily: 'var(--font-body-text)' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: '500', fontFamily: 'var(--font-body-text)' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Opportunity Status">
          {oppStatusData.length === 0 ? <Empty /> : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={oppStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2}>
                  {oppStatusData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} stroke="transparent" />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid var(--color-line)', fontFamily: 'var(--font-body-text)' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: '500', fontFamily: 'var(--font-body-text)' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Organization Verification">
          {orgVerifData.length === 0 ? <Empty /> : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={orgVerifData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2}>
                  {orgVerifData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} stroke="transparent" />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid var(--color-line)', fontFamily: 'var(--font-body-text)' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: '500', fontFamily: 'var(--font-body-text)' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

    </div>
  );
}