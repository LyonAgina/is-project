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

const ICONS = {
  match: (color) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1" />
    </svg>
  ),
  application: (color) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <path d="M9 15l2 2 4-4" />
    </svg>
  ),
  org_message: (color) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  ),
  admin: (color) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  default: (color) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),
};

const TYPE_CONFIG = {
  match: { label: 'New match', bg: '#eff6ff', fg: '#1d4ed8' },
  application: { label: 'Application update', bg: '#faf5ff', fg: '#7e22ce' },
  org_message: { label: 'Message', bg: '#f0fdf4', fg: '#15803d' },
  admin: { label: 'System', bg: '#f3f4f6', fg: '#4b5563' },
};

const DEFAULT_TYPE = { label: 'Notification', bg: '#f3f4f6', fg: '#4b5563' };

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

  const markUnread = async (id: number) => {
    await apiFetch(`/api/student/notifications/${id}/unread`, { method: 'PUT' });
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: 0 } : n)));
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
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-2xl font-bold">Inbox</h1>
          {unreadCount > 0 && (
            <span className="text-xs font-semibold text-white px-2 py-0.5 rounded-full" style={{ background: '#dc2626' }}>
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="text-sm transition-colors"
            style={{ color: '#6b7280' }}
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Empty state */}
      {notes.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl" style={{ border: '1px dashed #e5e7eb' }}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ background: '#f3f4f6' }}>
            {ICONS.default('#9ca3af')}
          </div>
          <p className="font-medium text-sm">No notifications yet</p>
          <p className="text-xs mt-1" style={{ color: '#6b7280' }}>You'll be notified when something needs your attention.</p>
        </div>
      )}

      {/* Notification list */}
      <div className="space-y-4">
        {notes.map((n) => {
          const isUnread = !n.is_read;
          const typeInfo = TYPE_CONFIG[n.type] || DEFAULT_TYPE;
          const iconFn = ICONS[n.type] || ICONS.default;
          const senderLabel = n.type === 'org_message' ? n.sent_by_org_name : null;

          return (
            <div
              key={n.id}
              className="rounded-xl p-5 flex gap-4 items-start"
              style={{ border: '1px solid #e5e7eb', background: '#ffffff' }}
            >
              {/* Type icon badge */}
              <div
                className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: typeInfo.bg }}
              >
                {iconFn(typeInfo.fg)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span
                    className="text-[11px] font-medium px-2.5 py-1 rounded-full"
                    style={{ background: typeInfo.bg, color: typeInfo.fg }}
                  >
                    {typeInfo.label}
                  </span>
                  {senderLabel && (
                    <span className="text-xs font-medium" style={{ color: '#111827' }}>{senderLabel}</span>
                  )}
                  {isUnread && (
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#111827' }} />
                  )}
                </div>

                <p className="text-sm leading-relaxed" style={{ color: isUnread ? '#111827' : '#6b7280', fontWeight: isUnread ? 500 : 400 }}>
                  {n.message}
                </p>
                <div className="flex items-center gap-3 mt-2">
                  <p className="text-xs" style={{ color: '#9ca3af' }}>{relativeTime(n.sent_at)}</p>
                  <span style={{ color: '#d1d5db' }}>·</span>
                  {isUnread ? (
                    <button
                      onClick={() => markRead(n.id)}
                      className="text-xs font-medium hover:underline"
                      style={{ color: '#6b7280' }}
                    >
                      Mark as read
                    </button>
                  ) : (
                    <button
                      onClick={() => markUnread(n.id)}
                      className="text-xs font-medium hover:underline"
                      style={{ color: '#6b7280' }}
                    >
                      Mark as unread
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}