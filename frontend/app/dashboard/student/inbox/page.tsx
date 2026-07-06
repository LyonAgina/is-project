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
  match: { label: 'New match', bg: '#eff6ff', fg: '#1e3a8a', border: '#bfdbfe' }, 
  application: { label: 'Application update', bg: '#faf5ff', fg: '#7e22ce', border: '#e9d5ff' },
  org_message: { label: 'Message', bg: '#f0fdf4', fg: '#15803d', border: '#bbf7d0' },
  admin: { label: 'System', bg: '#f8fafc', fg: '#475569', border: '#e2e8f0' },
};

const DEFAULT_TYPE = { label: 'Notification', bg: '#f8fafc', fg: '#475569', border: '#e2e8f0' };

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
    <div style={{ maxWidth: '900px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '32px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: '700', color: 'var(--color-ink)', margin: '0 0 8px 0' }}>Inbox</h1>
            {unreadCount > 0 && (
              <span style={{ backgroundColor: '#ef4444', color: '#ffffff', fontSize: '13px', fontWeight: '700', padding: '2px 10px', borderRadius: '999px', display: 'inline-block', marginBottom: '8px' }}>
                {unreadCount} New
              </span>
            )}
          </div>
          <p style={{ margin: 0, color: 'var(--color-muted)' }}>Stay updated on your matches and applications.</p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            style={{ 
              padding: '8px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', 
              backgroundColor: '#ffffff', color: '#1e3a8a', border: '1px solid var(--color-line)', 
              cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Empty state */}
      {notes.length === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 24px', textAlign: 'center', borderRadius: '16px', border: '2px dashed var(--color-line)' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
            {ICONS.default('#9ca3af')}
          </div>
          <p style={{ fontWeight: '600', fontSize: '16px', color: 'var(--color-ink)', margin: '0 0 4px 0' }}>No notifications yet</p>
          <p style={{ fontSize: '14px', color: 'var(--color-muted)', margin: 0 }}>You'll be notified when something needs your attention.</p>
        </div>
      )}

      {/* Notification list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {notes.map((n) => {
          const isUnread = !n.is_read;
          const typeInfo = TYPE_CONFIG[n.type] || DEFAULT_TYPE;
          const iconFn = ICONS[n.type] || ICONS.default;
          const senderLabel = n.type === 'org_message' ? n.sent_by_org_name : null;

          return (
            <div
              key={n.id}
              style={{ 
                display: 'flex', gap: '20px', padding: '24px', borderRadius: '16px', 
                backgroundColor: isUnread ? '#f8fafc' : '#ffffff', 
                border: '1px solid var(--color-line)', 
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)',
                position: 'relative',
                overflow: 'hidden',
                transition: 'background-color 0.3s ease'
              }}
            >
              {/* Unread Left Border Highlight */}
              {isUnread && (
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', backgroundColor: '#1e3a8a' }} />
              )}

              {/* Type icon badge */}
              <div style={{ flexShrink: 0, width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: typeInfo.bg, border: `1px solid ${typeInfo.border}` }}>
                {iconFn(typeInfo.fg)}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '12px', fontWeight: '600', padding: '4px 12px', borderRadius: '999px', backgroundColor: typeInfo.bg, color: typeInfo.fg, border: `1px solid ${typeInfo.border}` }}>
                    {typeInfo.label}
                  </span>
                  
                  {senderLabel && (
                    <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-ink)' }}>{senderLabel}</span>
                  )}
                </div>

                <p style={{ margin: '0 0 16px 0', fontSize: '15px', lineHeight: '1.6', color: isUnread ? 'var(--color-ink)' : '#475569', fontWeight: isUnread ? '600' : '400' }}>
                  {n.message}
                </p>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingTop: '16px', borderTop: '1px solid var(--color-line)' }}>
                  <p style={{ margin: 0, fontSize: '13px', color: '#64748b', fontWeight: '500' }}>{relativeTime(n.sent_at)}</p>
                  <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'var(--color-line)' }}></span>
                  
                  {isUnread ? (
                    <button
                      onClick={() => markRead(n.id)}
                      style={{ background: 'none', border: 'none', padding: 0, fontSize: '13px', fontWeight: '600', color: '#1e3a8a', cursor: 'pointer' }}
                      onMouseOver={(e) => e.target.style.textDecoration = 'underline'}
                      onMouseOut={(e) => e.target.style.textDecoration = 'none'}
                    >
                      Mark as read
                    </button>
                  ) : (
                    <button
                      onClick={() => markUnread(n.id)}
                      style={{ background: 'none', border: 'none', padding: 0, fontSize: '13px', fontWeight: '500', color: '#64748b', cursor: 'pointer' }}
                      onMouseOver={(e) => e.target.style.textDecoration = 'underline'}
                      onMouseOut={(e) => e.target.style.textDecoration = 'none'}
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