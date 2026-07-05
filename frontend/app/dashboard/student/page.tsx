// @ts-nocheck
'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';

const STATUS_COLORS = {
  submitted: { fg: '#4b5563', dot: '#9ca3af' },
  under_review: { fg: '#92400e', dot: '#f59e0b' },
  accepted: { fg: '#15803d', dot: '#22c55e' },
  rejected: { fg: '#b91c1c', dot: '#ef4444' },
};

const STATUS_LABELS = {
  submitted: 'Submitted',
  under_review: 'Under review',
  accepted: 'Accepted',
  rejected: 'Rejected',
};

const AVATAR_PALETTE = [
  { bg: '#eff6ff', fg: '#1d4ed8' },
  { bg: '#faf5ff', fg: '#7e22ce' },
  { bg: '#f0fdf4', fg: '#15803d' },
  { bg: '#fffbeb', fg: '#92400e' },
  { bg: '#fdf2f8', fg: '#be185d' },
];

function avatarColor(name) {
  const str = name || '?';
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}

export default function StudentHome() {
  const [profile, setProfile] = useState(null);
  const [apps, setApps] = useState([]);
  const [unread, setUnread] = useState(0);
  const [opps, setOpps] = useState([]);

  useEffect(() => {
    apiFetch('/api/student/profile').then(r => r.json()).then(setProfile).catch(() => {});
    apiFetch('/api/student/applications').then(r => r.json()).then(d => setApps(Array.isArray(d) ? d : [])).catch(() => {});
    apiFetch('/api/student/notifications').then(r => r.json()).then(d => setUnread(Array.isArray(d) ? d.filter(n => !n.is_read).length : 0)).catch(() => {});
    apiFetch('/api/student/opportunities').then(r => r.json()).then(d => setOpps(Array.isArray(d) ? d.slice(0, 3) : [])).catch(() => {});
  }, []);

  const accepted = apps.filter(a => a.status === 'accepted').length;
  const underReview = apps.filter(a => a.status === 'under_review').length;
  const recent = apps.slice(0, 4);

  return (
    <div className="max-w-4xl">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold">
          Welcome back{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}
        </h1>
        <p className="mt-1" style={{ color: '#6b7280' }}>Here's a summary of your activity.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Applications', value: apps.length, href: '/dashboard/student/applications', dot: '#9ca3af', color: '#111827' },
          { label: 'Under review', value: underReview, href: '/dashboard/student/applications', dot: '#f59e0b', color: '#92400e' },
          { label: 'Accepted', value: accepted, href: '/dashboard/student/applications', dot: '#22c55e', color: '#15803d' },
          { label: 'Unread', value: unread, href: '/dashboard/student/inbox', dot: '#ef4444', color: '#b91c1c' },
        ].map(s => (
          <Link
            key={s.label}
            href={s.href}
            className="rounded-xl p-5 transition-all hover:shadow-sm"
            style={{ border: '1px solid #e5e7eb', background: '#ffffff' }}
          >
            <div className="flex items-center gap-2 mb-2.5">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: s.dot }} />
              <p className="text-xs font-medium uppercase tracking-wide" style={{ color: '#6b7280' }}>{s.label}</p>
            </div>
            <p className="text-3xl font-bold" style={{ color: s.color }}>{s.value}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent applications */}
        <div className="rounded-xl p-5" style={{ border: '1px solid #e5e7eb', background: '#ffffff' }}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-sm">Recent applications</h2>
            <Link href="/dashboard/student/applications" className="text-xs font-medium hover:underline" style={{ color: '#6b7280' }}>View all →</Link>
          </div>
          {recent.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm" style={{ color: '#6b7280' }}>No applications yet.</p>
              <Link href="/dashboard/student/opportunities" className="text-sm font-medium hover:underline mt-2 inline-block" style={{ color: '#111827' }}>Browse opportunities →</Link>
            </div>
          ) : (
            <div className="space-y-1">
              {recent.map((a, i) => {
                const c = STATUS_COLORS[a.status] || STATUS_COLORS.submitted;
                return (
                  <div
                    key={a.id}
                    className="flex items-center gap-3 py-2.5"
                    style={{ borderTop: i > 0 ? '1px solid #f3f4f6' : 'none' }}
                  >
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: c.dot }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{a.title}</p>
                      <p className="text-xs truncate" style={{ color: '#6b7280' }}>{a.organization_name}</p>
                    </div>
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap"
                      style={{ background: `${c.dot}15`, color: c.fg }}
                    >
                      {STATUS_LABELS[a.status]}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Latest opportunities */}
        <div className="rounded-xl p-5" style={{ border: '1px solid #e5e7eb', background: '#ffffff' }}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-sm">New opportunities</h2>
            <Link href="/dashboard/student/opportunities" className="text-xs font-medium hover:underline" style={{ color: '#6b7280' }}>View all →</Link>
          </div>
          {opps.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: '#6b7280' }}>No opportunities available right now.</p>
          ) : (
            <div className="space-y-1">
              {opps.map((o, i) => {
                const av = avatarColor(o.organization_name);
                return (
                  <Link
                    key={o.id}
                    href={`/dashboard/student/opportunities/${o.id}`}
                    className="flex items-center gap-3 py-2.5 group"
                    style={{ borderTop: i > 0 ? '1px solid #f3f4f6' : 'none' }}
                  >
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-xs font-bold uppercase"
                      style={{ background: av.bg, color: av.fg }}
                    >
                      {(o.organization_name || '?')[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium group-hover:underline truncate">{o.title}</p>
                      <p className="text-xs truncate" style={{ color: '#6b7280' }}>{o.organization_name} · {o.location || 'Remote'}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}