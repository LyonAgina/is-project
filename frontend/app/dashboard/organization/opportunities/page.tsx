// @ts-nocheck
'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';

const STATUS_STYLES = {
  active: 'bg-green-50 text-green-700 border-green-200',
  draft: 'bg-gray-50 text-gray-600 border-[var(--color-line)]',
  closed: 'bg-red-50 text-red-700 border-red-200',
};

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
    await apiFetch('/api/organization/opportunities/' + id + '/status', { method: 'PUT', body: JSON.stringify({ status }) });
    load();
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this opportunity? This cannot be undone.')) return;
    await apiFetch('/api/organization/opportunities/' + id, { method: 'DELETE' });
    load();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-display text-2xl font-bold">My opportunities</h1>
        <Link href="/dashboard/organization/create" className="bg-[var(--color-ink)] text-white px-4 py-2 rounded-md text-sm">
          + New opportunity
        </Link>
      </div>

      {error && <p className="text-red-600 mb-4">{error}</p>}
      {!error && opps.length === 0 && (
        <p className="text-[var(--color-muted)]">You haven't posted any opportunities yet.</p>
      )}

      <div className="space-y-4">
        {opps.map((o) => {
          const statusClass = STATUS_STYLES[o.status] || STATUS_STYLES.draft;
          const applicantsHref = '/dashboard/organization/opportunities/' + o.id + '/applicants';
          return (
            <div key={o.id} className="border border-[var(--color-line)] rounded-xl p-5">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="font-semibold text-lg">{o.title}</h2>
                  <p className="text-sm text-[var(--color-muted)] capitalize mt-1">
                    {o.category} · {o.location || 'Location not set'}
                  </p>
                  {o.deadline && (
                    <p className="text-xs text-[var(--color-muted)] mt-1">
                      Deadline: {new Date(o.deadline).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <span className={'text-xs px-2 py-1 rounded-full border capitalize whitespace-nowrap ' + statusClass}>
                  {o.status}
                </span>
              </div>

              <div className="flex gap-2 items-center pt-3 border-t border-[var(--color-line)]">
                <select
                  value={o.status}
                  onChange={(e) => updateStatus(o.id, e.target.value)}
                  className="text-sm border border-[var(--color-line)] rounded-md p-1.5"
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="closed">Closed</option>
                </select>
                <Link href={applicantsHref} className="text-sm border border-[var(--color-line)] px-3 py-1.5 rounded-md hover:border-[var(--color-ink)] transition-colors">
                  View applicants
                </Link>
                <button onClick={() => remove(o.id)} className="text-sm text-red-600 ml-auto px-2">
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