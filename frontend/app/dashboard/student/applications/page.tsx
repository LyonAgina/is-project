// @ts-nocheck
'use client';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

const STATUS_STYLES = {
  submitted: 'bg-gray-50 text-gray-600 border-[var(--color-line)]',
  under_review: 'bg-amber-50 text-amber-800 border-amber-200',
  accepted: 'bg-green-50 text-green-700 border-green-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
};

const STATUS_LABELS = {
  submitted: 'Submitted',
  under_review: 'Under review',
  accepted: 'Accepted',
  rejected: 'Rejected',
};

export default function StudentApplications() {
  const [apps, setApps] = useState([]);
  const [error, setError] = useState('');

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

  return (
    <div>
      <h1 className="font-display text-2xl font-bold mb-6">Your applications</h1>
      {error && <p className="text-red-600 mb-4">{error}</p>}
      {!error && apps.length === 0 && (
        <p className="text-[var(--color-muted)]">You haven't applied to anything yet.</p>
      )}

      <div className="space-y-4">
        {apps.map((a) => {
          const statusClass = STATUS_STYLES[a.status] || STATUS_STYLES.submitted;
          return (
            <div key={a.id} className="border border-[var(--color-line)] rounded-xl p-5">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h2 className="font-semibold">{a.title}</h2>
                  <p className="text-sm text-[var(--color-muted)] capitalize mt-1">
                    {a.organization_name} · {a.category}
                  </p>
                </div>
                <span className={'text-xs px-2 py-1 rounded-full border whitespace-nowrap ' + statusClass}>
                  {STATUS_LABELS[a.status] || a.status}
                </span>
              </div>

              <div className="flex justify-between items-center text-xs text-[var(--color-muted)] pt-3 border-t border-[var(--color-line)] mt-3">
                <span>Applied {new Date(a.applied_at).toLocaleDateString()}</span>
                {a.deadline && <span>Deadline {new Date(a.deadline).toLocaleDateString()}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}