// @ts-nocheck
'use client';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

export default function AdminOverview() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch('/api/admin/stats')
      .then((res) => res.json())
      .then(setStats)
      .catch(() => setError('Failed to load stats'));
  }, []);

  const cards = stats
    ? [
        { label: 'Students', value: stats.total_students },
        { label: 'Organizations', value: stats.total_organizations },
        { label: 'Pending verification', value: stats.pending_organizations },
        { label: 'Total opportunities', value: stats.total_opportunities },
        { label: 'Active opportunities', value: stats.active_opportunities },
        { label: 'Expired opportunities', value: stats.expired_opportunities },
        { label: 'Applications submitted', value: stats.total_applications },
      ]
    : [];

  return (
    <div>
      <h1 className="font-display text-2xl font-bold mb-6">Overview</h1>
      {error && <p className="text-red-600">{error}</p>}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="border border-[var(--color-line)] rounded-xl p-5">
            <p className="text-xs uppercase tracking-wide text-[var(--color-muted)] mb-2">{c.label}</p>
            <p className="font-mono text-3xl font-semibold">{c.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}