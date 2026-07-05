// @ts-nocheck
'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';

const links = [
  { href: '/dashboard/student', label: 'Home' },
  { href: '/dashboard/student/opportunities', label: 'Opportunities' },
  { href: '/dashboard/student/recommendations', label: 'Recommendations' },
  { href: '/dashboard/student/applications', label: 'Applications' },
  { href: '/dashboard/student/inbox', label: 'Inbox' },
];

export default function StudentLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [name, setName] = useState('');

  useEffect(() => {
    const role = localStorage.getItem('role');
    if (role !== 'student') {
      router.push('/login');
      return;
    }
    setReady(true);
    fetchUnread();
    apiFetch('/api/student/profile').then(r => r.json()).then(d => setName(d.full_name || '')).catch(() => {});
    const interval = setInterval(fetchUnread, 60_000);
    return () => clearInterval(interval);
  }, []);

  const fetchUnread = async () => {
    try {
      const res = await apiFetch('/api/student/notifications');
      const data = await res.json();
      if (Array.isArray(data)) setUnreadCount(data.filter((n) => !n.is_read).length);
    } catch { /* silently ignore */ }
  };

  const logout = () => {
    localStorage.clear();
    router.push('/login');
  };

  if (!ready) return null;

  return (
    <div className="min-h-screen flex bg-[var(--color-paper)]">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-[var(--color-line)] p-5 flex flex-col">
        <span className="font-display text-base font-bold mb-8 px-2 text-[var(--color-ink)]">Opportunity Hub</span>
        <nav className="flex flex-col gap-0.5 flex-1">
          {links.map((l) => {
            const isInbox = l.href === '/dashboard/student/inbox';
            const active = pathname === l.href || (l.href !== '/dashboard/student' && pathname.startsWith(l.href));
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`text-sm px-3 py-2 rounded-lg flex items-center justify-between transition-colors ${
                  active
                    ? 'bg-[var(--color-ink)] text-white font-medium'
                    : 'text-[var(--color-muted)] hover:bg-[var(--color-paper)] hover:text-[var(--color-ink)]'
                }`}
              >
                <span>{l.label}</span>
                {isInbox && unreadCount > 0 && (
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center ${active ? 'bg-white text-[var(--color-ink)]' : 'bg-[var(--color-ink)] text-white'}`}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-[var(--color-line)] px-8 py-3 flex items-center justify-between">
          <span className="text-sm text-[var(--color-muted)]">
            {name ? `Hello, ${name.split(' ')[0]}` : 'Student dashboard'}
          </span>
          <div className="flex items-center gap-4">
            {/* Notification bell */}
            <Link href="/dashboard/student/inbox" className="relative">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--color-muted)] hover:text-[var(--color-ink)] transition-colors">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 text-[10px] font-bold bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
            {/* Profile */}
            <Link
              href="/dashboard/student/profile"
              className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${
                pathname.startsWith('/dashboard/student/profile')
                  ? 'bg-[var(--color-ink)] text-white border-[var(--color-ink)]'
                  : 'border-[var(--color-line)] text-[var(--color-muted)] hover:text-[var(--color-ink)]'
              }`}
            >
              Profile
            </Link>
            {/* Logout */}
            <button
              onClick={logout}
              className="text-sm text-[var(--color-muted)] hover:text-red-600 transition-colors"
            >
              Log out
            </button>
          </div>
        </header>

        <main className="flex-1 p-8">{children}</main>

        <footer className="bg-white border-t border-[var(--color-line)] px-8 py-3 text-xs text-[var(--color-muted)]">
          Find opportunities that fit
        </footer>
      </div>
    </div>
  );
}