// @ts-nocheck
'use client';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

export default function AdminOrganizations() {
  const [orgs, setOrgs] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const res = await apiFetch('/api/admin/organizations/pending');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load');
      setOrgs(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDecision = async (id, decision) => {
    try {
      const res = await apiFetch(`/api/admin/organizations/${id}/verify`, {
        method: 'PUT',
        body: JSON.stringify({ decision }),
      });
      if (!res.ok) throw new Error('Failed to update');
      setOrgs((prev) => prev.filter((o) => o.id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <h1 className="font-display text-2xl font-bold mb-6">Pending organizations</h1>
      {error && <p className="text-red-600 mb-4">{error}</p>}
      {orgs.length === 0 && <p className="text-[var(--color-muted)]">No organizations awaiting verification.</p>}
      <div className="space-y-4">
        {orgs.map((org) => (
          <div key={org.id} className="border border-[var(--color-line)] rounded-xl p-5 flex justify-between items-start">
            <div>
              <h2 className="font-semibold">{org.name}</h2>
              <p className="text-sm text-[var(--color-muted)]">{org.email} · {org.type} · {org.location || 'No location set'}</p>
              {org.description && <p className="text-sm mt-2">{org.description}</p>}
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleDecision(org.id, 'verified')} className="bg-[var(--color-ink)] text-white px-3 py-1.5 rounded-md text-sm">
                Approve
              </button>
              <button onClick={() => handleDecision(org.id, 'rejected')} className="border border-[var(--color-line)] px-3 py-1.5 rounded-md text-sm">
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}