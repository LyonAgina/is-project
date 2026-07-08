// @ts-nocheck
'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';

function HamburgerIcon({ open }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {open ? (
        <>
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </>
      ) : (
        <>
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </>
      )}
    </svg>
  );
}

const links = [
  { href: '/dashboard/student', label: 'Home' },
  { href: '/dashboard/student/opportunities', label: 'Opportunities' },
  { href: '/dashboard/student/recommendations', label: 'Recommendations' },
  { href: '/dashboard/student/saved', label: 'Saved' },
  { href: '/dashboard/student/applications', label: 'Applications' },
  { href: '/dashboard/student/inbox', label: 'Inbox' },
];

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function StudentLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const role = localStorage.getItem('role');
    if (role !== 'student') {
      router.push('/login');
      return;
    }
    setReady(true);
    fetchUnread();
    apiFetch('/api/student/profile').then(r => r.json()).then(d => {
      setName(d.full_name || '');
      setAvatarUrl(d.profile_picture_url || '');
    }).catch(() => {});
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

  // Close sidebar when navigating
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  if (!ready) return null;

  const initials = (name || '?').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--color-paper)', color: 'var(--color-ink)', fontFamily: 'inherit' }}>
      
      {/* Mobile overlay */}
      <div className={`mobile-overlay${sidebarOpen ? ' open' : ''}`} onClick={() => setSidebarOpen(false)} />

      {/* Sidebar */}
      <aside className={`dashboard-sidebar${sidebarOpen ? ' open' : ''}`} style={{ width: '260px', backgroundColor: '#ffffff', borderRight: '1px solid var(--color-line)', padding: '24px', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, bottom: 0, left: 0, zIndex: 30 }}>
        
        {/* Logo Section */}
        <div style={{ padding: '0 16px', marginBottom: '40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '18px', fontWeight: '700', letterSpacing: '-0.01em', color: 'var(--color-ink)' }}>Opportunity Hub</span>
          <button className="hamburger-btn" onClick={() => setSidebarOpen(false)} aria-label="Close menu" style={{ marginRight: '-8px' }}>
            <HamburgerIcon open={true} />
          </button>
        </div>
        {/* Navigation */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          {links.map((l) => {
            const isInbox = l.href === '/dashboard/student/inbox';
            const active = pathname === l.href || (l.href !== '/dashboard/student' && pathname.startsWith(l.href));
            return (
              <Link
                key={l.href}
                href={l.href}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 16px', borderRadius: '12px', fontSize: '14px', textDecoration: 'none',
                  backgroundColor: active ? '#1e3a8a' : 'transparent',
                  color: active ? '#ffffff' : 'var(--color-muted)',
                  fontWeight: active ? '600' : '500',
                  boxShadow: active ? '0 4px 6px -1px rgba(30, 58, 138, 0.2)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                <span>{l.label}</span>
                {isInbox && unreadCount > 0 && (
                  <span style={{
                    backgroundColor: active ? '#3b82f6' : '#1e3a8a',
                    color: '#ffffff', fontSize: '12px', fontWeight: '700',
                    padding: '2px 8px', borderRadius: '999px', minWidth: '24px', textAlign: 'center'
                  }}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="dashboard-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', marginLeft: '260px', minWidth: 0 }}>
        
        {/* Sticky Header */}
        <header className="dashboard-header" style={{ 
          position: 'sticky', top: 0, zIndex: 10, backgroundColor: 'rgba(243, 245, 247, 0.9)', 
          backdropFilter: 'blur(8px)', borderBottom: '1px solid var(--color-line)', 
          padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' 
        }}>
          {/* Hamburger – visible on mobile only */}
          <button className="hamburger-btn" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
            <HamburgerIcon open={false} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginLeft: 'auto' }}>
            
            {/* Profile Avatar */}
            <Link href="/dashboard/student/profile" style={{ display: 'block', textDecoration: 'none' }}>
              {avatarUrl ? (
                <img
                  src={API_URL + avatarUrl}
                  alt={name || 'Profile'}
                  style={{ width: '44px', height: '44px', borderRadius: '999px', objectFit: 'cover', border: '2px solid #ffffff', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                />
              ) : (
                <div style={{ 
                  width: '44px', height: '44px', borderRadius: '999px', backgroundColor: '#ffffff', 
                  color: '#1e3a8a', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  fontSize: '14px', fontWeight: '700', border: '1px solid var(--color-line)', boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                }}>
                  {initials}
                </div>
              )}
            </Link>
            
            <div style={{ height: '24px', width: '1px', backgroundColor: 'var(--color-line)' }}></div>
            
            {/* Logout */}
            <button
              onClick={logout}
              style={{ 
                background: 'none', border: 'none', padding: 0, cursor: 'pointer', 
                fontSize: '14px', fontWeight: '500', color: 'var(--color-muted)' 
              }}
              onMouseOver={(e) => e.target.style.color = '#dc2626'}
              onMouseOut={(e) => e.target.style.color = 'var(--color-muted)'}
            >
              Log out
            </button>
          </div>
        </header>

        {/* Constrained Main Canvas */}
        <main className="dashboard-main" style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}