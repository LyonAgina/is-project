// @ts-nocheck
'use client';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

export default function OrganizationHome() {
  const [profile, setProfile] = useState(null);
  const [oppCount, setOppCount] = useState(0);

  useEffect(() => {
    apiFetch('/api/organization/profile').then((r) => r.json()).then(setProfile).catch(() => {});
    apiFetch('/api/organization/opportunities').then((r) => r.json()).then((d) => setOppCount(d.length)).catch(() => {});
  }, []);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold mb-2">{profile?.name || 'Welcome'}</h1>
      <p className="text-[var(--color-muted)] mb-8">Status: <span className="capitalize">{profile?.verification_status}</span></p>
      <div className="border border-[var(--color-line)] rounded-xl p-5 max-w-xs">
        <p className="text-xs uppercase tracking-wide text-[var(--color-muted)] mb-2">Opportunities posted</p>
        <p className="font-mono text-3xl font-semibold">{oppCount}</p>
      </div>
    </div>
  );
}