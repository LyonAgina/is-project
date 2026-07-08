// @ts-nocheck
'use client';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

export default function AdminOrganizations() {
  const [orgs, setOrgs] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const res = await apiFetch('/api/admin/organizations/pending');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load');
      setOrgs(data);
    } catch (err) { setError(err.message); }
  };

  const handleDecision = async (id, decision) => {
    try {
      const res = await apiFetch(`/api/admin/organizations/${id}/verify`, {
        method: 'PUT',
        body: JSON.stringify({ decision }),
      });
      if (!res.ok) throw new Error('Failed to update');
      setOrgs((prev) => prev.filter((o) => o.id !== id));
    } catch (err) { setError(err.message); }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', fontFamily: 'var(--font-body-text), sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: 'var(--color-ink)', margin: '0 0 8px 0' }}>Pending Organizations</h1>
        <span style={{ backgroundColor: '#f59e0b', color: '#ffffff', fontSize: '12px', fontWeight: '700', padding: '6px 12px', borderRadius: '8px' }}>{orgs.length} Pending</span>
      </div>

      {error && <p style={{ color: '#dc2626', fontWeight: '600', padding: '16px', backgroundColor: 'rgba(220,38,38,0.05)', borderRadius: '12px', marginBottom: '16px' }}>{error}</p>}
      
      {orgs.length === 0 && (
        <div style={{ textAlign: 'center', padding: '64px 24px', backgroundColor: '#ffffff', border: '1px solid var(--color-line)', borderRadius: '16px' }}>
          <p style={{ color: 'var(--color-muted)', fontWeight: '500' }}>No organizations awaiting verification right now.</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {orgs.map((org) => {
          const initials = (org.name || '?').substring(0, 2).toUpperCase();
          return (
            <div key={org.id} style={{ backgroundColor: '#ffffff', border: '1px solid var(--color-line)', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'var(--color-paper)', border: '1px solid var(--color-line)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: '700', color: '#1e3a8a', flexShrink: 0 }}>
                  {initials}
                </div>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--color-ink)', margin: '0 0 4px 0' }}>{org.name}</h2>
                  <p style={{ fontSize: '14px', color: 'var(--color-muted)', fontWeight: '500', margin: '0 0 12px 0' }}>{org.email} <span style={{ padding: '0 6px' }}>&middot;</span> <span style={{ textTransform: 'capitalize' }}>{org.type}</span> <span style={{ padding: '0 6px' }}>&middot;</span> {org.location || 'No location set'}</p>
                  {org.description && (
                    <div style={{ backgroundColor: 'var(--color-paper)', padding: '12px', borderRadius: '8px', fontSize: '13.5px', color: 'var(--color-ink)', lineHeight: '1.5' }}>
                      {org.description}
                    </div>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', flexShrink: 0, marginLeft: '24px' }}>
                <button onClick={() => handleDecision(org.id, 'rejected')} style={{ padding: '8px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: '600', backgroundColor: '#ffffff', border: '1px solid var(--color-line)', color: '#dc2626', cursor: 'pointer', fontFamily: 'inherit' }}>
                  Reject
                </button>
                <button onClick={() => handleDecision(org.id, 'verified')} style={{ padding: '8px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: '600', backgroundColor: '#10b981', border: 'none', color: '#ffffff', cursor: 'pointer', boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)', fontFamily: 'inherit' }}>
                  Approve Org
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}