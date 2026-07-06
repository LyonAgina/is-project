// @ts-nocheck
'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';

const CATEGORY_COLORS = {
  job: { bg: '#eff6ff', fg: '#1e3a8a', border: '#bfdbfe' }, // Navy theme applied
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
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  ),
};

export default function SavedOpportunities() {
  const [saved, setSaved] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch('/api/student/saved');
      const data = await res.json();
      if (!res.ok || !Array.isArray(data)) throw new Error(data.error || 'Failed to load saved opportunities');
      setSaved(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const unsave = async (opportunityId: number) => {
    await apiFetch('/api/student/saved', { method: 'POST', body: JSON.stringify({ opportunityId }) });
    setSaved((prev) => prev.filter((s) => s.id !== opportunityId));
  };

  return (
    <div style={{ maxWidth: '900px' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: 'var(--color-ink)', margin: '0 0 8px 0' }}>Saved opportunities</h1>
        <p style={{ margin: 0, color: 'var(--color-muted)' }}>Opportunities you've bookmarked to revisit later.</p>
      </div>

      {/* States */}
      {error && (
        <div style={{ padding: '16px', borderRadius: '12px', border: '1px solid #fecaca', backgroundColor: '#fef2f2', color: '#b91c1c', marginBottom: '24px', fontSize: '14px' }}>
          {error}
        </div>
      )}

      {loading && (
        <div style={{ padding: '48px', textAlign: 'center', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid var(--color-line)' }}>
          <p style={{ fontSize: '15px', color: 'var(--color-muted)', fontWeight: '500', margin: 0 }}>Loading your saved items…</p>
        </div>
      )}

      {!loading && !error && saved.length === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 24px', textAlign: 'center', borderRadius: '16px', border: '2px dashed var(--color-line)' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
            {CATEGORY_ICONS.default('#9ca3af')}
          </div>
          <p style={{ fontWeight: '600', fontSize: '16px', color: 'var(--color-ink)', margin: '0 0 4px 0' }}>No saved opportunities yet</p>
          <p style={{ fontSize: '14px', color: 'var(--color-muted)', margin: 0 }}>
            Bookmark opportunities from the{' '}
            <Link href="/dashboard/student/opportunities" style={{ color: '#1e3a8a', fontWeight: '500', textDecoration: 'underline' }}>
              Opportunities page
            </Link> to see them here.
          </p>
        </div>
      )}

      {/* Saved Items List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {saved.map((o) => {
          const detailHref = '/dashboard/student/opportunities/' + o.id;
          const c = CATEGORY_COLORS[o.category] || DEFAULT_CATEGORY;
          const iconFn = CATEGORY_ICONS[o.category] || CATEGORY_ICONS.default;

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
                      onClick={() => unsave(o.id)}
                      title="Remove from saved"
                      style={{ 
                        width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                        backgroundColor: '#f1f5f9', border: '1px solid var(--color-line)', cursor: 'pointer', transition: 'all 0.2s' 
                      }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#fee2e2'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                    >
                      {/* Filled bookmark icon to indicate it is currently saved */}
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="#1e3a8a" stroke="#1e3a8a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                      </svg>
                    </button>
                  </div>
                  
                  <Link 
                    href={detailHref} 
                    style={{ 
                      padding: '10px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', 
                      backgroundColor: '#1e3a8a', color: '#ffffff', textDecoration: 'none', 
                      transition: 'background-color 0.2s', display: 'inline-block'
                    }}
                  >
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