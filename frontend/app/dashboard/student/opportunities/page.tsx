// @ts-nocheck
'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';

const CATEGORY_COLORS = {
  job: { bg: '#eff6ff', fg: '#1e3a8a', border: '#bfdbfe' }, // Navy theme
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
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());
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

      const savedRes = await apiFetch('/api/student/saved');
      const savedData = await savedRes.json();
      if (savedRes.ok && Array.isArray(savedData)) {
        setSavedIds(new Set(savedData.map((s: any) => s.id)));
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

  const toggleSave = async (opportunityId: number) => {
    const res = await apiFetch('/api/student/saved', { method: 'POST', body: JSON.stringify({ opportunityId }) });
    const data = await res.json();
    setSavedIds((prev) => {
      const next = new Set(prev);
      data.saved ? next.add(opportunityId) : next.delete(opportunityId);
      return next;
    });
  };

  return (
    <div style={{ maxWidth: '900px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: 'var(--color-ink)', margin: '0 0 8px 0' }}>Opportunities</h1>
        <p style={{ margin: 0, color: 'var(--color-muted)' }}>Browse jobs, internships, and scholarships open right now.</p>
      </div>

      {/* Sleek Search + Filter Toolbar */}
      <div style={{ 
        display: 'flex', gap: '12px', flexWrap: 'wrap', backgroundColor: '#ffffff', 
        padding: '16px', borderRadius: '16px', border: '1px solid var(--color-line)', 
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', marginBottom: '32px' 
      }}>
        <div style={{ position: 'relative', flex: '1 1 300px' }}>
          <svg
            style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
            width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search by title, organisation, location…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ 
              width: '100%', padding: '12px 16px 12px 42px', borderRadius: '10px', 
              border: '1px solid var(--color-line)', backgroundColor: '#f8fafc', 
              fontSize: '14px', outline: 'none', transition: 'border-color 0.2s' 
            }}
            onFocus={(e) => e.target.style.borderColor = '#1e3a8a'}
            onBlur={(e) => e.target.style.borderColor = 'var(--color-line)'}
          />
        </div>
        
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          style={{ 
            padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--color-line)', 
            backgroundColor: '#f8fafc', fontSize: '14px', outline: 'none', cursor: 'pointer', flex: '1 1 150px' 
          }}
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
          style={{ 
            padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--color-line)', 
            backgroundColor: '#f8fafc', fontSize: '14px', outline: 'none', flex: '1 1 150px' 
          }}
        />
      </div>

      {error && (
        <div style={{ padding: '16px', borderRadius: '12px', border: '1px solid #fecaca', backgroundColor: '#fef2f2', color: '#b91c1c', marginBottom: '24px', fontSize: '14px' }}>
          {error}
        </div>
      )}

      {!error && filteredOpps.length === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 24px', textAlign: 'center', borderRadius: '16px', border: '2px dashed var(--color-line)' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
            {CATEGORY_ICONS.default('#9ca3af')}
          </div>
          <p style={{ fontWeight: '600', fontSize: '16px', color: 'var(--color-ink)', margin: '0 0 4px 0' }}>
            {opps.length === 0 ? 'No active opportunities right now' : 'No opportunities match your search'}
          </p>
          <p style={{ fontSize: '14px', color: 'var(--color-muted)', margin: 0 }}>
            {opps.length === 0 ? 'Check back soon.' : 'Try adjusting your filters.'}
          </p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {filteredOpps.map((o) => {
          const detailHref = '/dashboard/student/opportunities/' + o.id;
          const c = CATEGORY_COLORS[o.category] || DEFAULT_CATEGORY;
          const iconFn = CATEGORY_ICONS[o.category] || CATEGORY_ICONS.default;
          const isApplied = appliedIds.has(o.id);
          const isSaved = savedIds.has(o.id);
          const preview = o.description
            ? o.description.length > 180
              ? o.description.slice(0, 180) + '…'
              : o.description
            : null;

          return (
            <div
              key={o.id}
              style={{ 
                display: 'flex', gap: '20px', padding: '24px', borderRadius: '16px', 
                backgroundColor: '#ffffff', border: '1px solid var(--color-line)', 
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)' 
              }}
            >
              {/* Category icon badge */}
              <div style={{ flexShrink: 0, width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: c.bg, border: `1px solid ${c.border}` }}>
                {iconFn(c.fg)}
              </div>

              <div style={{ flex: 1, minWidth: 0, display: 'flex', justifyContent: 'space-between', gap: '24px', flexWrap: 'wrap' }}>
                <div style={{ minWidth: 0, flex: '1 1 300px' }}>
                  <Link href={detailHref} style={{ textDecoration: 'none' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--color-ink)', margin: '0 0 6px 0' }} onMouseOver={(e) => e.target.style.textDecoration = 'underline'} onMouseOut={(e) => e.target.style.textDecoration = 'none'}>
                      {o.title}
                    </h2>
                  </Link>
                  <p style={{ fontSize: '14px', color: 'var(--color-muted)', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: '500' }}>{o.organization_name}</span>
                    <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'var(--color-line)' }}></span>
                    <span>{o.location || 'Location not set'}</span>
                  </p>
                  
                  {preview && (
                    <p style={{ fontSize: '14px', color: '#475569', lineHeight: '1.6', margin: 0 }}>{preview}</p>
                  )}
                  
                  {o.deadline && (
                    <p style={{ fontSize: '13px', color: 'var(--color-muted)', margin: '16px 0 0 0', paddingTop: '16px', borderTop: '1px solid var(--color-line)' }}>
                      Deadline: {new Date(o.deadline).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  )}
                </div>

                {/* Actions Column */}
                <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '600', padding: '4px 12px', borderRadius: '999px', textTransform: 'capitalize', backgroundColor: c.bg, color: c.fg, border: `1px solid ${c.border}` }}>
                      {o.category}
                    </span>
                    <button
                      onClick={() => toggleSave(o.id)}
                      style={{ 
                        width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                        backgroundColor: isSaved ? '#f1f5f9' : 'transparent', border: '1px solid var(--color-line)', cursor: 'pointer', transition: 'all 0.2s' 
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill={isSaved ? '#1e3a8a' : 'none'} stroke={isSaved ? '#1e3a8a' : 'var(--color-muted)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                      </svg>
                    </button>
                  </div>
                  
                  <button
                    onClick={() => apply(o.id)}
                    disabled={isApplied}
                    style={{ 
                      padding: '10px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', 
                      backgroundColor: isApplied ? '#e2e8f0' : '#1e3a8a', 
                      color: isApplied ? '#64748b' : '#ffffff', 
                      border: 'none', cursor: isApplied ? 'not-allowed' : 'pointer', transition: 'background-color 0.2s'
                    }}
                  >
                    {isApplied ? 'Applied' : 'Apply Now'}
                  </button>
                  
                  <Link href={detailHref} style={{ fontSize: '13px', fontWeight: '500', color: '#1e3a8a', textDecoration: 'none' }}>
                    View details &rarr;
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