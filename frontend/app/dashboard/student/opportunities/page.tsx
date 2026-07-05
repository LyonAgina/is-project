// @ts-nocheck
'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';

const CATEGORY_COLORS = {
  job: { bg: '#eff6ff', fg: '#1d4ed8', border: '#bfdbfe' },
  internship: { bg: '#faf5ff', fg: '#7e22ce', border: '#e9d5ff' },
  scholarship: { bg: '#fffbeb', fg: '#92400e', border: '#fde68a' },
};
const DEFAULT_CATEGORY = { bg: '#f3f4f6', fg: '#4b5563', border: '#e5e7eb' };

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
      <rect x="3" y="3" width="18" height="18" rx="2" />
    </svg>
  ),
};

export default function StudentOpportunities() {
  const [opps, setOpps] = useState([]);
  const [appliedIds, setAppliedIds] = useState(new Set());
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('');

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setError('');
    try {
      const oppsRes = await apiFetch('/api/student/opportunities');
      const oppsData = await oppsRes.json();
      if (!oppsRes.ok || !Array.isArray(oppsData)) {
        throw new Error(oppsData.error || 'Failed to load opportunities');
      }
      setOpps(oppsData);

      const appsRes = await apiFetch('/api/student/applications');
      const appsData = await appsRes.json();
      if (appsRes.ok && Array.isArray(appsData)) {
        setAppliedIds(new Set(appsData.map((a) => a.opportunity_id).filter(Boolean)));
      }
    } catch (err) {
      setError(err.message);
      setOpps([]);
    }
  };

  const filteredOpps = useMemo(() => {
    return opps.filter((o) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        o.title?.toLowerCase().includes(q) ||
        o.organization_name?.toLowerCase().includes(q) ||
        o.description?.toLowerCase().includes(q) ||
        o.location?.toLowerCase().includes(q);
      const matchesCategory = categoryFilter === 'all' || o.category === categoryFilter;
      const matchesLocation = !locationFilter || o.location?.toLowerCase().includes(locationFilter.toLowerCase());
      return matchesSearch && matchesCategory && matchesLocation;
    });
  }, [opps, search, categoryFilter, locationFilter]);

  const apply = async (opportunityId) => {
    try {
      const res = await apiFetch('/api/student/applications', {
        method: 'POST',
        body: JSON.stringify({ opportunityId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to apply');
      setAppliedIds((prev) => new Set([...prev, opportunityId]));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold mb-1">Opportunities</h1>
        <p className="text-sm" style={{ color: '#6b7280' }}>Browse jobs, internships, and scholarships open right now.</p>
      </div>

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
            placeholder="Search by title, organisation, location…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: 34 }}
            className="w-full pr-3 py-2 rounded-lg text-sm focus:outline-none"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-lg px-3 py-2 text-sm focus:outline-none"
          style={{ background: '#fafafa', border: 'none' }}
        >
          <option value="all">All categories</option>
          <option value="job">Job</option>
          <option value="internship">Internship</option>
          <option value="scholarship">Scholarship</option>
        </select>
        <input
          type="text"
          placeholder="Location…"
          value={locationFilter}
          onChange={(e) => setLocationFilter(e.target.value)}
          className="rounded-lg px-3 py-2 text-sm focus:outline-none sm:w-40"
          style={{ background: '#fafafa', border: 'none' }}
        />
      </div>

      {error && (
        <div className="rounded-lg text-sm px-4 py-3 mb-6" style={{ border: '1px solid #fecaca', background: '#fef2f2', color: '#b91c1c' }}>
          {error}
        </div>
      )}

      {!error && filteredOpps.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl" style={{ border: '1px dashed #e5e7eb' }}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ background: '#f3f4f6' }}>
            {CATEGORY_ICONS.default('#9ca3af')}
          </div>
          <p className="font-medium text-sm">
            {opps.length === 0 ? 'No active opportunities right now' : 'No opportunities match your search'}
          </p>
          <p className="text-xs mt-1" style={{ color: '#6b7280' }}>
            {opps.length === 0 ? 'Check back soon.' : 'Try adjusting your filters.'}
          </p>
        </div>
      )}

      <div className="space-y-4">
        {filteredOpps.map((o) => {
          const detailHref = '/dashboard/student/opportunities/' + o.id;
          const c = CATEGORY_COLORS[o.category] || DEFAULT_CATEGORY;
          const iconFn = CATEGORY_ICONS[o.category] || CATEGORY_ICONS.default;
          const isApplied = appliedIds.has(o.id);
          const preview = o.description
            ? o.description.length > 140
              ? o.description.slice(0, 140) + '…'
              : o.description
            : null;

          return (
            <div
              key={o.id}
              className="rounded-xl p-5 flex gap-4 items-start"
              style={{ border: '1px solid #e5e7eb', background: '#ffffff' }}
            >
              {/* Category icon badge */}
              <div
                className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: c.bg }}
              >
                {iconFn(c.fg)}
              </div>

              <div className="flex-1 min-w-0 flex justify-between items-start gap-4">
                <div className="min-w-0 flex-1">
                  <Link href={detailHref}>
                    <h2 className="font-semibold text-sm hover:underline cursor-pointer">{o.title}</h2>
                  </Link>
                  <p className="text-xs mt-1" style={{ color: '#6b7280' }}>
                    {o.organization_name} <span className="mx-1">·</span> {o.location || 'Location not set'}
                  </p>
                  {preview && (
                    <p className="text-sm mt-2" style={{ color: '#6b7280' }}>{preview}</p>
                  )}
                  {o.deadline && (
                    <p className="text-xs mt-3 pt-3" style={{ color: '#6b7280', borderTop: '1px solid #f3f4f6' }}>
                      Deadline: {new Date(o.deadline).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  )}
                </div>

                <div className="shrink-0 flex flex-col items-end gap-2">
                  <span
                    className="text-xs px-2.5 py-1 rounded-full capitalize whitespace-nowrap font-medium"
                    style={{ background: c.bg, color: c.fg, border: `1px solid ${c.border}` }}
                  >
                    {o.category}
                  </span>
                  <button
                    onClick={() => apply(o.id)}
                    disabled={isApplied}
                    className="px-3 py-1.5 rounded-md text-sm text-white disabled:opacity-40"
                    style={{ background: '#111827' }}
                  >
                    {isApplied ? 'Applied' : 'Apply'}
                  </button>
                  <Link href={detailHref} className="text-xs hover:underline" style={{ color: '#6b7280' }}>
                    View details
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}