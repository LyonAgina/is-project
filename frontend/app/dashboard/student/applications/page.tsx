// @ts-nocheck
'use client';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

export default function StudentApplications() {
  const [apps, setApps] = useState([]);

  useEffect(() => {
    apiFetch('/api/student/applications').then((r) => r.json()).then(setApps).catch(() => {});
  }, []);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold mb-6">Your applications</h1>
      {apps.length === 0 && <p className="text-[var(--color-muted)]">You haven't applied to anything yet.</p>}
      <div className="space-y-3">
        {apps.map((a) => (
          <div key={a.id} className="border border-[var(--color-line)] rounded-xl p-4 flex justify-between items-center">
            <div>
              <p className="font-medium">{a.title}</p>
              <p className="text-sm text-[var(--color-muted)]">{a.organization_name} · applied {new Date(a.applied_at).toLocaleDateString()}</p>
            </div>
            <span className="text-xs uppercase px-2 py-1 rounded-full border border-[var(--color-line)]">{a.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}