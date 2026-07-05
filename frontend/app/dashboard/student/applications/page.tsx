// @ts-nocheck
'use client';
import { useEffect, useState, useMemo } from 'react';
import { apiFetch } from '@/lib/api';

const STATUS_COLORS = {
  submitted: { bg: '#f3f4f6', fg: '#4b5563', border: '#e5e7eb', dot: '#9ca3af' },
  under_review: { bg: '#fffbeb', fg: '#92400e', border: '#fde68a', dot: '#f59e0b' },
  accepted: { bg: '#f0fdf4', fg: '#15803d', border: '#bbf7d0', dot: '#22c55e' },
  rejected: { bg: '#fef2f2', fg: '#b91c1c', border: '#fecaca', dot: '#ef4444' },
};

const CATEGORY_COLORS = {
  job: { bg: '#eff6ff', fg: '#1d4ed8' },
  internship: { bg: '#faf5ff', fg: '#7e22ce' },
  scholarship: { bg: '#fffbeb', fg: '#92400e' },
};
const DEFAULT_CATEGORY = { bg: '#f3f4f6', fg: '#4b5563' };

const STATUS_LABELS = {
  submitted: 'Submitted',
  under_review: 'Under review',
  accepted: 'Accepted',
  rejected: 'Rejected',
};

const CATEGORY_ICONS = {
  job: (color) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  ),
  internship: (color) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c3.3 2 8.7 2 12 0v-5" />
    </svg>
  ),
  scholarship: (color) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="6" />
      <path d="M15.5 13.5 17 22l-5-3-5 3 1.5-8.5" />
    </svg>
  ),
  default: (color) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  ),
};

export default function StudentApplications() {
  const [apps, setApps] = useState([]);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setError('');
    try {
      const res = await apiFetch('/api/student/applications');
      const data = await res.json();
      if (!res.ok || !Array.isArray(data)) throw new Error(data.error || 'Failed to load applications');
      setApps(data);
    } catch (err) {
      setError(err.message);
      setApps([]);
    }
  };

  const filtered = useMemo(() => {
    return apps.filter((a) => {
      const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        a.title?.toLowerCase().includes(q) ||
        a.organization_name?.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [apps, statusFilter, search]);

  const counts = useMemo(() => {
    return apps.reduce((acc, a) => {
      acc[a.status] = (acc[a.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [apps]);

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold mb-1">Application history</h1>
        <p className="text-sm" style={{ color: '#6b7280' }}>Track the status of everything you've applied to.</p>
      </div>

      {/* Summary stats */}
      {apps.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {(['submitted', 'under_review', 'accepted', 'rejected'] as const).map((s) => {
            const active = statusFilter === s;
            const c = STATUS_COLORS[s];
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(active ? 'all' : s)}
                className="rounded-xl p-5 text-left transition-all"
                style={{
                  border: active ? `1px solid ${c.dot}` : '1px solid #e5e7eb',
                  background: active ? c.bg : '#ffffff',
                }}
              >
                <div className="flex items-center gap-2 mb-2.5">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: c.dot }} />
                  <p className="text-xs font-medium" style={{ color: active ? c.fg : '#6b7280' }}>
                    {STATUS_LABELS[s]}
                  </p>
                </div>
                <p className="text-2xl font-bold" style={{ color: active ? c.fg : '#111827' }}>
                  {counts[s] || 0}
                </p>
              </button>
            );
          })}
        </div>
      )}

      {/* Search + filter toolbar */}
      <div className="rounded-xl p-3 mb-6 flex flex-col sm:flex-row gap-2" style={{ border: '1px solid #e5e7eb', background: '#ffffff' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <svg
            style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search by title or organization…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: 34 }}
            className="w-full pr-3 py-2 rounded-lg text-sm focus:outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg px-3 py-2 text-sm focus:outline-none"
          style={{ background: '#fafafa', border: 'none' }}
        >
          <option value="all">All statuses</option>
          <option value="submitted">Submitted</option>
          <option value="under_review">Under review</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {error && (
        <div className="rounded-lg text-sm px-4 py-3 mb-6" style={{ border: '1px solid #fecaca', background: '#fef2f2', color: '#b91c1c' }}>
          {error}
        </div>
      )}

      {!error && apps.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl" style={{ border: '1px dashed #e5e7eb' }}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ background: '#f3f4f6' }}>
            {CATEGORY_ICONS.default('#9ca3af')}
          </div>
          <p className="font-medium text-sm">You haven't applied to anything yet</p>
          <p className="text-xs mt-1" style={{ color: '#6b7280' }}>Applications you submit will show up here.</p>
        </div>
      )}

      {!error && apps.length > 0 && filtered.length === 0 && (
        <p className="text-sm py-8 text-center" style={{ color: '#6b7280' }}>No applications match your filters.</p>
      )}

      {/* List */}
      <div className="space-y-4">
        {filtered.map((a) => {
          const c = STATUS_COLORS[a.status] || STATUS_COLORS.submitted;
          const catColor = CATEGORY_COLORS[a.category] || DEFAULT_CATEGORY;
          const iconFn = CATEGORY_ICONS[a.category] || CATEGORY_ICONS.default;
          return (
            <div
              key={a.id}
              className="rounded-xl p-5 flex gap-4 items-start"
              style={{ border: '1px solid #e5e7eb', background: '#ffffff' }}
            >
              {/* Category icon badge */}
              <div
                className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: catColor.bg }}
              >
                {iconFn(catColor.fg)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-3 mb-2">
                  <div className="min-w-0">
                    <h2 className="font-semibold text-sm leading-snug">{a.title}</h2>
                    <p className="text-xs mt-1" style={{ color: '#6b7280' }}>
                      {a.organization_name} <span className="mx-1">·</span> <span className="capitalize">{a.category}</span>
                    </p>
                  </div>
                  <span
                    className="shrink-0 text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap"
                    style={{ background: c.bg, color: c.fg, border: `1px solid ${c.border}` }}
                  >
                    {STATUS_LABELS[a.status] || a.status}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs pt-3 mt-2" style={{ color: '#6b7280', borderTop: '1px solid #f3f4f6' }}>
                  <span>Applied {new Date(a.applied_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  {a.deadline && <span>Deadline {new Date(a.deadline).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}