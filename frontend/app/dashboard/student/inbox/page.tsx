// @ts-nocheck
'use client';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

export default function StudentInbox() {
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    load();
  }, []);

  const load = () => {
    apiFetch('/api/student/notifications').then((r) => r.json()).then(setNotes).catch(() => {});
  };

  const markRead = async (id) => {
    await apiFetch(`/api/student/notifications/${id}/read`, { method: 'PUT' });
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n)));
  };

  return (
    <div>
      <h1 className="font-display text-2xl font-bold mb-6">Inbox</h1>
      {notes.length === 0 && <p className="text-[var(--color-muted)]">No notifications yet.</p>}
      <div className="space-y-2">
        {notes.map((n) => (
          <div
            key={n.id}
            onClick={() => !n.is_read && markRead(n.id)}
            className={`border border-[var(--color-line)] rounded-xl p-4 cursor-pointer ${!n.is_read ? 'bg-[var(--color-paper)]' : ''}`}
          >
            <p className="text-sm">{n.message}</p>
            <p className="text-xs text-[var(--color-muted)] mt-1">{new Date(n.sent_at).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}