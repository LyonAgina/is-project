// @ts-nocheck
'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';

export default function MyOpportunities() {
  const [opps, setOpps] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    load();
  }, []);

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
    await apiFetch(`/api/organization/opportunities/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) });
    load();
  };

  const remove = async (id) => {
    await apiFetch(`/api/organization/opportunities/${id}`, { method: 'DELETE' });
    load();
  };

  return (
    <div>
      <h1 className="font-display text-2xl font-bold mb-6">My opportunities</h1>
      {error && <p className="text-red-600 mb-4">{error}</p>}
      {!error && opps.length === 0 && <p className="text-[var(--color-muted)]">You haven't posted any opportunities yet.</p>}
      <div className="space-y-3">
        {opps.map((o) => (
          <div key={o.id} className="border border-[var(--color-line)] rounded-xl p-4 flex justify-between items-center">
            <div>
              <p className="font-medium">{o.title}</p>
              <p className="text-sm text-[var(--color-muted)] capitalize">{o.category} · {o.status}</p>
            </div>
            <div className="flex gap-2 items-center">
              <select value={o.status} onChange={(e) => updateStatus(o.id, e.target.value)} className="text-sm border border-[var(--color-line)] rounded-md p-1">
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="closed">Closed</option>
              </select>
              <Link href={`/dashboard/organization/opportunities/${o.id}/applicants`} className="text-sm border border-[var(--color-line)] px-3 py-1.5 rounded-md">
                Applicants
              </Link>
              <button onClick={() => remove(o.id)} className="text-sm text-red-600">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}