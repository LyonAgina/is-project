// @ts-nocheck
'use client';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

export default function StudentOpportunities() {
  const [opps, setOpps] = useState([]);
  const [appliedIds, setAppliedIds] = useState(new Set());
  const [error, setError] = useState('');

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const oppsRes = await apiFetch('/api/student/opportunities');
    setOpps(await oppsRes.json());
    const appsRes = await apiFetch('/api/student/applications');
    const apps = await appsRes.json();
  };

  const apply = async (opportunityId) => {
    try {
      const res = await apiFetch('/api/student/applications', { method: 'POST', body: JSON.stringify({ opportunityId }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to apply');
      setAppliedIds((prev) => new Set([...prev, opportunityId]));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <h1 className="font-display text-2xl font-bold mb-6">Opportunities</h1>
      {error && <p className="text-red-600 mb-4">{error}</p>}
      <div className="space-y-4">
        {opps.map((o) => (
          <div key={o.id} className="border border-[var(--color-line)] rounded-xl p-5 flex justify-between items-start">
            <div>
              <h2 className="font-semibold">{o.title}</h2>
              <p className="text-sm text-[var(--color-muted)]">{o.organization_name} · {o.category} · {o.location || 'Location not set'}</p>
              {o.description && <p className="text-sm mt-2">{o.description}</p>}
              {o.deadline && <p className="text-xs text-[var(--color-muted)] mt-2">Deadline: {new Date(o.deadline).toLocaleDateString()}</p>}
            </div>
            <button
              onClick={() => apply(o.id)}
              disabled={appliedIds.has(o.id)}
              className="bg-[var(--color-ink)] text-white px-3 py-1.5 rounded-md text-sm disabled:opacity-40"
            >
              {appliedIds.has(o.id) ? 'Applied' : 'Apply'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}