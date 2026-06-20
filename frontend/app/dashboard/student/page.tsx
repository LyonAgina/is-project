// @ts-nocheck
'use client';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

export default function StudentHome() {
  const [profile, setProfile] = useState(null);
  const [appCount, setAppCount] = useState(0);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    apiFetch('/api/student/profile').then((r) => r.json()).then(setProfile).catch(() => {});
    apiFetch('/api/student/applications').then((r) => r.json()).then((d) => setAppCount(d.length)).catch(() => {});
    apiFetch('/api/student/notifications').then((r) => r.json()).then((d) => setUnread(d.filter((n) => !n.is_read).length)).catch(() => {});
  }, []);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold mb-2">
        Welcome{profile?.full_name ? `, ${profile.full_name}` : ''}
      </h1>
      <p className="text-[var(--color-muted)] mb-8">Here's where things stand right now.</p>
      <div className="grid grid-cols-2 gap-4 max-w-md">
        <div className="border border-[var(--color-line)] rounded-xl p-5">
          <p className="text-xs uppercase tracking-wide text-[var(--color-muted)] mb-2">Applications</p>
          <p className="font-mono text-3xl font-semibold">{appCount}</p>
        </div>
        <div className="border border-[var(--color-line)] rounded-xl p-5">
          <p className="text-xs uppercase tracking-wide text-[var(--color-muted)] mb-2">Unread</p>
          <p className="font-mono text-3xl font-semibold">{unread}</p>
        </div>
      </div>
    </div>
  );
}