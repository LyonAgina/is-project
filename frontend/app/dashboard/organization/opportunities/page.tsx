// @ts-nocheck
'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';

const STATUS_STYLES = {
  active: { bg: '#f0fdf4', fg: '#15803d', border: '#bbf7d0' },
  draft: { bg: 'var(--color-paper)', fg: 'var(--color-muted)', border: 'var(--color-line)' },
  closed: { bg: '#fef2f2', fg: '#b91c1c', border: '#fecaca' },
};

export default function MyOpportunities() {
  const [opps, setOpps] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    setError('');
    try {
      const res = await apiFetch('/api/organization/opportunities');
      const data = await res.json();
      if (!res.ok || !Array.isArray(data)) throw new Error(data.error || 'Failed to load opportunities');
      setOpps(data);
    } catch (err) {
      setError(err.message);
      setOpps([]);
    }
  };

  const updateStatus = async (id, status) => {
    await apiFetch('/api/organization/opportunities/' + id + '/status', { method: 'PUT', body: JSON.stringify({ status }) });
    load();
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this opportunity? This cannot be undone.')) return;
    await apiFetch('/api/organization/opportunities/' + id, { method: 'DELETE' });
    load();
  };

  const btnStyle = { padding: '8px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: '600', textDecoration: 'none', border: '1px solid var(--color-line)', color: 'var(--color-ink)', backgroundColor: '#ffffff', transition: 'background-color 0.2s', cursor: 'pointer' };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: 'var(--color-ink)', margin: '0 0 8px 0' }}>My opportunities</h1>
        <Link href="/dashboard/organization/create" style={{ backgroundColor: '#1e3a8a', color: '#ffffff', padding: '10px 20px', borderRadius: '10px', fontSize: '14px', fontWeight: '600', textDecoration: 'none', boxShadow: '0 4px 6px -1px rgba(30, 58, 138, 0.2)' }}>
          + New opportunity
        </Link>
      </div>

      {error && <p style={{ color: '#dc2626', fontWeight: '600', padding: '16px', backgroundColor: 'rgba(220,38,38,0.05)', borderRadius: '12px' }}>{error}</p>}
      
      {!error && opps.length === 0 && (
        <div style={{ textAlign: 'center', padding: '64px 24px', backgroundColor: '#ffffff', border: '1px solid var(--color-line)', borderRadius: '16px' }}>
          <p style={{ color: 'var(--color-muted)', fontWeight: '500', marginBottom: '16px' }}>You haven't posted any opportunities yet.</p>
          <Link href="/dashboard/organization/create" style={{ color: '#1e3a8a', fontWeight: '700', textDecoration: 'none' }}>Create your first post</Link>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {opps.map((o) => {
          const s = STATUS_STYLES[o.status] || STATUS_STYLES.draft;
          return (
            <div key={o.id} style={{ backgroundColor: '#ffffff', border: '1px solid var(--color-line)', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--color-ink)', marginBottom: '8px' }}>{o.title}</h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--color-muted)', fontWeight: '500', textTransform: 'capitalize' }}>
                    <span>{o.category}</span>
                    <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'var(--color-line)' }}></span>
                    <span>{o.location || 'Location not set'}</span>
                    {o.deadline && (
                      <>
                        <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'var(--color-line)' }}></span>
                        <span>Due: {new Date(o.deadline).toLocaleDateString()}</span>
                      </>
                    )}
                  </div>
                </div>
                <span style={{ fontSize: '11px', fontWeight: '700', padding: '4px 10px', borderRadius: '6px', textTransform: 'uppercase', letterSpacing: '0.05em', backgroundColor: s.bg, color: s.fg, border: `1px solid ${s.border}` }}>
                  {o.status}
                </span>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', paddingTop: '20px', borderTop: '1px solid var(--color-line)' }}>
                <select
                  value={o.status}
                  onChange={(e) => updateStatus(o.id, e.target.value)}
                  style={{ ...btnStyle, backgroundColor: 'var(--color-paper)', border: '1px solid var(--color-line)' }}
                >
                  <option value="draft">Status: Draft</option>
                  <option value="active">Status: Active</option>
                  <option value="closed">Status: Closed</option>
                </select>
                
                <Link href={`/dashboard/organization/opportunities/${o.id}/applicants`} style={btnStyle}>
                  View applicants
                </Link>
                
                <Link href={`/dashboard/organization/opportunities/${o.id}/compare`} style={btnStyle}>
                  Compare applicants
                </Link>
                
                <button onClick={() => remove(o.id)} style={{ ...btnStyle, marginLeft: 'auto', border: 'none', color: '#dc2626' }}>
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}