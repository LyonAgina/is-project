// @ts-nocheck
'use client';
import { useEffect, useState, useMemo } from 'react';
import { apiFetch } from '@/lib/api';

// Upgraded to our premium structural colors
const STATUS_COLORS = {
  submitted: { bg: '#f8fafc', fg: 'var(--color-ink)', border: '#e2e8f0', dot: 'var(--color-muted)' },
  under_review: { bg: '#dbeafe', fg: '#1e40af', border: '#bfdbfe', dot: '#3b82f6' }, // Sky Blue
  accepted: { bg: '#d1fae5', fg: '#065f46', border: '#a7f3d0', dot: '#10b981' }, // Green
  rejected: { bg: '#fee2e2', fg: '#991b1b', border: '#fecaca', dot: '#ef4444' }, // Red
};

const CATEGORY_COLORS = {
  job: { bg: '#eff6ff', fg: '#1e3a8a', border: '#bfdbfe' }, // Navy Blue theme
  internship: { bg: '#faf5ff', fg: '#7e22ce', border: '#e9d5ff' },
  scholarship: { bg: '#fffbeb', fg: '#92400e', border: '#fde68a' },
};
const DEFAULT_CATEGORY = { bg: '#f3f4f6', fg: '#4b5563', border: '#e5e7eb' };

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
    <div style={{ maxWidth: '900px' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: 'var(--color-ink)', margin: '0 0 8px 0' }}>Application history</h1>
        <p style={{ margin: 0, color: 'var(--color-muted)' }}>Track the status of everything you've applied to.</p>
      </div>

      {/* Interactive Summary Stats (Acts as filters) */}
      {apps.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
          {(['submitted', 'under_review', 'accepted', 'rejected'] as const).map((s) => {
            const active = statusFilter === s;
            const c = STATUS_COLORS[s];
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(active ? 'all' : s)}
                style={{
                  backgroundColor: active ? c.bg : '#ffffff',
                  borderRadius: '16px',
                  padding: '24px',
                  border: active ? `2px solid ${c.dot}` : '1px solid var(--color-line)',
                  textAlign: 'left',
                  cursor: 'pointer',
                  boxShadow: active ? `0 4px 12px -2px ${c.dot}30` : '0 4px 6px -1px rgba(0, 0, 0, 0.02)',
                  transition: 'all 0.2s',
                  outline: 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: c.dot }} />
                  <p style={{ margin: 0, fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', color: active ? c.fg : 'var(--color-muted)' }}>
                    {STATUS_LABELS[s]}
                  </p>
                </div>
                <p style={{ margin: 0, fontSize: '36px', fontWeight: '700', color: active ? c.fg : 'var(--color-ink)' }}>
                  {counts[s] || 0}
                </p>
              </button>
            );
          })}
        </div>
      )}

      {/* Cleaned Search Toolbar (Removed redundant dropdown) */}
      <div style={{ 
        display: 'flex', backgroundColor: '#ffffff', padding: '16px', 
        borderRadius: '16px', border: '1px solid var(--color-line)', 
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', marginBottom: '32px' 
      }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <svg
            style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
            width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search your applications by title or organization…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ 
              width: '100%', padding: '12px 16px 12px 42px', borderRadius: '10px', 
              border: '1px solid var(--color-line)', backgroundColor: '#f8fafc', 
              fontSize: '14px', outline: 'none', transition: 'border-color 0.2s',
              boxSizing: 'border-box'
            }}
            onFocus={(e) => e.target.style.borderColor = '#1e3a8a'}
            onBlur={(e) => e.target.style.borderColor = 'var(--color-line)'}
          />
        </div>
      </div>

      {/* Warnings & States */}
      {error && (
        <div style={{ padding: '16px', borderRadius: '12px', border: '1px solid #fecaca', backgroundColor: '#fef2f2', color: '#b91c1c', marginBottom: '24px', fontSize: '14px' }}>
          {error}
        </div>
      )}

      {!error && apps.length === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 24px', textAlign: 'center', borderRadius: '16px', border: '2px dashed var(--color-line)' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
            {CATEGORY_ICONS.default('#9ca3af')}
          </div>
          <p style={{ fontWeight: '600', fontSize: '16px', color: 'var(--color-ink)', margin: '0 0 4px 0' }}>You haven't applied to anything yet</p>
          <p style={{ fontSize: '14px', color: 'var(--color-muted)', margin: 0 }}>Applications you submit will show up here.</p>
        </div>
      )}

      {!error && apps.length > 0 && filtered.length === 0 && (
        <div style={{ padding: '48px', textAlign: 'center', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid var(--color-line)' }}>
          <p style={{ fontSize: '15px', color: 'var(--color-muted)', fontWeight: '500', margin: 0 }}>No applications match your current search or filter.</p>
        </div>
      )}

      {/* Application List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {filtered.map((a) => {
          const c = STATUS_COLORS[a.status] || STATUS_COLORS.submitted;
          const catColor = CATEGORY_COLORS[a.category] || DEFAULT_CATEGORY;
          const iconFn = CATEGORY_ICONS[a.category] || CATEGORY_ICONS.default;
          
          return (
            <div
              key={a.id}
              style={{ 
                display: 'flex', gap: '20px', padding: '24px', borderRadius: '16px', 
                backgroundColor: '#ffffff', border: '1px solid var(--color-line)', 
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)' 
              }}
            >
              {/* Category icon badge */}
              <div style={{ flexShrink: 0, width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: catColor.bg, border: `1px solid ${catColor.border}` }}>
                {iconFn(catColor.fg)}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap', marginBottom: '16px' }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--color-ink)', margin: '0 0 6px 0', lineHeight: '1.3' }}>{a.title}</h2>
                    <p style={{ fontSize: '14px', color: 'var(--color-muted)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: '500' }}>{a.organization_name}</span>
                      <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'var(--color-line)' }}></span>
                      <span style={{ textTransform: 'capitalize' }}>{a.category}</span>
                    </p>
                  </div>
                  
                  {/* Status Badge */}
                  <div style={{ flexShrink: 0 }}>
                    <span style={{ 
                      display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', 
                      padding: '6px 14px', borderRadius: '999px', backgroundColor: c.bg, color: c.fg, border: `1px solid ${c.border}`, whiteSpace: 'nowrap' 
                    }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: c.dot }}></span>
                      {STATUS_LABELS[a.status] || a.status}
                    </span>
                  </div>
                </div>
                
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px', paddingTop: '16px', borderTop: '1px solid var(--color-line)', fontSize: '13px', color: 'var(--color-muted)' }}>
                  <span><strong style={{ color: 'var(--color-ink)' }}>Applied:</strong> {new Date(a.applied_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  {a.deadline && <span><strong style={{ color: 'var(--color-ink)' }}>Deadline:</strong> {new Date(a.deadline).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
                </div>
                
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}