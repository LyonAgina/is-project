// @ts-nocheck
'use client';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

// System blue gradients for pie charts
const CHART_COLORS = ['#1e3a8a', '#3b82f6', '#60a5fa', '#93c5fd', '#dbeafe'];

function ChartCard({ title, children }) {
  return (
    <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--color-line)', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
      <p style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.05em', color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: '20px' }}>{title}</p>
      {children}
    </div>
  );
}

function Empty() {
  return <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p style={{ fontSize: '14px', color: 'var(--color-muted)', fontWeight: '500' }}>No data available yet.</p></div>;
}

export default function OrganizationHome() {
  const [profile, setProfile] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch('/api/organization/profile').then((r) => r.json()).then(setProfile).catch(() => {});
    apiFetch('/api/organization/reports')
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setReportData(d);
      })
      .catch((err) => setError(err.message || 'Failed to load report data'));
  }, []);

  if (error) return <p style={{ color: '#dc2626', fontWeight: '600' }}>{error}</p>;
  if (!reportData) return <p style={{ color: 'var(--color-muted)', fontWeight: '500' }}>Loading analytics dashboard…</p>;

  // Process data for charts
  const oppStatusData = reportData.oppsByStatus.map((r) => ({ name: r.label.charAt(0).toUpperCase() + r.label.slice(1), value: Number(r.count) }));
  const oppCategoryData = reportData.oppsByCategory.map((r) => ({ name: r.label.charAt(0).toUpperCase() + r.label.slice(1), value: Number(r.count) }));
  const appStatusData = reportData.appsByStatus.map((r) => ({ name: r.label.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()), value: Number(r.count) }));
  const monthlyAppData = reportData.monthlyApplications.map((r) => ({ month: r.month, applications: Number(r.count) }));
  const topOppsData = reportData.topOpportunities.map((r) => ({ title: r.title.length > 20 ? r.title.slice(0, 20) + '…' : r.title, applicants: Number(r.applicants) }));

  const totalOpps = oppStatusData.reduce((s, r) => s + r.value, 0);
  const totalApps = appStatusData.reduce((s, r) => s + r.value, 0);
  const activeOpps = reportData.oppsByStatus.find((r) => r.label === 'active');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', paddingBottom: '40px' }}>
      {/* Welcome Section */}
      <div>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: 'var(--color-ink)', margin: '0 0 8px 0' }}>
          {profile?.name || 'Overview Analytics'}
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <p style={{ margin: 0, color: 'var(--color-muted)', fontWeight: '500', fontSize: '15px' }}>Account Status</p>
          <span style={{ 
            fontSize: '12px', fontWeight: '700', padding: '4px 10px', borderRadius: '6px', textTransform: 'capitalize',
            backgroundColor: profile?.verification_status === 'verified' ? '#f0fdf4' : '#fffbeb',
            color: profile?.verification_status === 'verified' ? '#15803d' : '#b45309',
            border: `1px solid ${profile?.verification_status === 'verified' ? '#bbf7d0' : '#fde68a'}`
          }}>
            {profile?.verification_status || 'Pending'}
          </span>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
        {[
          { label: 'Opportunities posted', value: totalOpps, dot: '#1e3a8a' },
          { label: 'Active opportunities', value: activeOpps ? Number(activeOpps.count) : 0, dot: '#10b981' },
          { label: 'Total applications', value: totalApps, dot: '#f59e0b' },
        ].map((c) => (
          <div key={c.label} style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px', border: '1px solid var(--color-line)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: c.dot }} />
              <p style={{ margin: 0, fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-muted)' }}>{c.label}</p>
            </div>
            <p style={{ fontFamily: 'var(--font-mono)', margin: 0, fontSize: '40px', fontWeight: '700', color: 'var(--color-ink)', letterSpacing: '-0.03em' }}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Main Charts Area */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px' }}>
        {/* Line Chart */}
        <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--color-line)', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
          <h2 style={{ fontFamily: 'var(--font-disp)', fontSize: '18px', fontWeight: '700', marginBottom: '24px', color: 'var(--color-ink)' }}>Applications over 6 Months</h2>
          {monthlyAppData.length === 0 ? <Empty /> : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyAppData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-line)" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--color-muted)' }} axisLine={false} tickLine={false} dy={10} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: 'var(--color-muted)' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid var(--color-line)', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                <Line type="monotone" dataKey="applications" stroke="#1e3a8a" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#ffffff' }} activeDot={{ r: 6, fill: '#1e3a8a' }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Bar & Pie Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '32px' }}>
          {/* Bar Chart */}
          <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--color-line)', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
            <h2 style={{ fontFamily: 'var(--font-disp)', fontSize: '18px', fontWeight: '700', marginBottom: '24px', color: 'var(--color-ink)' }}>Total Opportunities </h2>
            {topOppsData.length === 0 ? <Empty /> : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={topOppsData} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-line)" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: 'var(--color-muted)' }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="title" tick={{ fontSize: 12, fill: 'var(--color-ink)', fontWeight: 500 }} width={160} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: 'var(--color-paper)' }} contentStyle={{ borderRadius: '12px', border: '1px solid var(--color-line)' }} />
                  <Bar dataKey="applicants" fill="#1e3a8a" radius={[0, 4, 4, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Core Pie Chart */}
          <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--color-line)', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column' }}>
             <h2 style={{ fontFamily: 'var(--font-disp)', fontSize: '18px', fontWeight: '700', marginBottom: '24px', color: 'var(--color-ink)' }}>Application Status Breakdown</h2>
             <div style={{ flex: 1, minHeight: '260px' }}>
              {appStatusData.length === 0 ? <Empty /> : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={appStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2}>
                      {appStatusData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} stroke="transparent" />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid var(--color-line)' }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '13px', fontWeight: '500', color: 'var(--color-ink)' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}