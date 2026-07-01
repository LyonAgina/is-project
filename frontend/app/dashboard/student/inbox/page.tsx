// @ts-nocheck
'use client';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function StudentInbox() {
  const [notes, setNotes] = useState([]);

  useEffect(() => { load(); }, []);

  const load = () => {
    apiFetch('/api/student/notifications').then((r) => r.json()).then(setNotes).catch(() => {});
  };

  const markRead = async (id: number) => {
    await apiFetch(`/api/student/notifications/${id}/read`, { method: 'PUT' });
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n)));
  };

  const markAllRead = async () => {
    const unread = notes.filter((n) => !n.is_read);
    await Promise.all(unread.map((n) => apiFetch(`/api/student/notifications/${n.id}/read`, { method: 'PUT' })));
    setNotes((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
  };

  const unreadCount = notes.filter((n) => !n.is_read).length;

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-2xl font-bold">Inbox</h1>
          {unreadCount > 0 && (
            <span className="text-xs font-semibold bg-[var(--color-ink)] text-white px-2 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="text-sm text-[var(--color-muted)] hover:text-[var(--color-ink)] transition-colors"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Empty state */}
      {notes.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 rounded-full bg-[var(--color-paper)] border border-[var(--color-line)] flex items-center justify-center mb-4">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--color-muted)]">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </div>
          <p className="font-medium text-sm">No notifications yet</p>
          <p className="text-xs text-[var(--color-muted)] mt-1">You'll be notified when something needs your attention.</p>
        </div>
      )}

      {/* Notification list */}
      <div className="space-y-2">
        {notes.map((n) => {
          const isUnread = !n.is_read;
          return (
            <div
              key={n.id}
              onClick={() => isUnread && markRead(n.id)}
              className={`border rounded-xl p-4 flex gap-3 items-start transition-colors ${
                isUnread
                  ? 'border-[var(--color-ink)] bg-[var(--color-paper)] cursor-pointer hover:bg-[var(--color-line)]'
                  : 'border-[var(--color-line)] cursor-default opacity-70'
              }`}
            >
              {/* Unread dot */}
              <div className="pt-1 shrink-0">
                <span className={`block w-2 h-2 rounded-full mt-0.5 ${isUnread ? 'bg-[var(--color-ink)]' : 'bg-transparent'}`} />
              </div>

              <div className="flex-1 min-w-0">
                <p className={`text-sm leading-relaxed ${isUnread ? 'font-medium' : ''}`}>{n.message}</p>
                <p className="text-xs text-[var(--color-muted)] mt-1.5">{relativeTime(n.sent_at)}</p>
              </div>

              {isUnread && (
                <button
                  onClick={(e) => { e.stopPropagation(); markRead(n.id); }}
                  title="Mark as read"
                  className="shrink-0 text-[var(--color-muted)] hover:text-[var(--color-ink)] transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
