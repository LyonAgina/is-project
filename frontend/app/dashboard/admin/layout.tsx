// @ts-nocheck
'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

const links = [
  { href: '/dashboard/admin', label: 'Home' },
  { href: '/dashboard/admin/organizations', label: 'Organizations' },
  { href: '/dashboard/admin/users', label: 'User Management' },
  { href: '/dashboard/admin/opportunities', label: 'Opportunities' },
];

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const role = localStorage.getItem('role');
    if (role !== 'admin') {
      router.push('/login');
      return;
    }
    setReady(true);
  }, []);

  const logout = () => {
    localStorage.clear();
    router.push('/login');
  };

  if (!ready) return null;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--color-paper)', color: 'var(--color-ink)', fontFamily: 'var(--font-body-text), system-ui, sans-serif' }}>
      
      {/* Sidebar */}
      <aside style={{ width: '260px', backgroundColor: '#ffffff', borderRight: '1px solid var(--color-line)', padding: '24px', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, bottom: 0, left: 0, zIndex: 20 }}>
        
        {/* Logo Section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' }}>
          <div style={{ backgroundColor: '#1e3a8a', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(30, 58, 138, 0.2)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '20px', height: '20px' }}>
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <span style={{ fontSize: '18px', fontWeight: '700', color: 'var(--color-ink)' }}>Admin Control</span>
        </div>
        
        {/* Navigation */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          {links.map((l) => {
            const active = pathname === l.href || (l.href !== '/dashboard/admin' && pathname.startsWith(l.href));
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
                  transition: 'all 0.2s ease',
                  fontFamily: 'var(--font-body-text), sans-serif'
                }}
              >
                <span>{l.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginLeft: '260px', minWidth: 0 }}>
        
        {/* Sticky Header */}
        <header style={{ 
          position: 'sticky', top: 0, zIndex: 10, backgroundColor: 'rgba(243, 245, 247, 0.9)', 
          backdropFilter: 'blur(8px)', borderBottom: '1px solid var(--color-line)', 
          padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' 
        }}>
          <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-muted)' }}>System Administrator</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div style={{ 
              width: '40px', height: '40px', borderRadius: '12px', backgroundColor: '#ffffff', 
              color: '#1e3a8a', display: 'flex', alignItems: 'center', justifyContent: 'center', 
              fontSize: '14px', fontWeight: '800', border: '1px solid var(--color-line)', boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}>
              AD
            </div>
            
            <div style={{ height: '24px', width: '1px', backgroundColor: 'var(--color-line)' }}></div>
            
            {/* Logout */}
            <button
              onClick={logout}
              style={{ 
                background: 'none', border: 'none', padding: 0, cursor: 'pointer', 
                fontSize: '14px', fontWeight: '600', color: 'var(--color-muted)', transition: 'color 0.2s',
                fontFamily: 'var(--font-body-text), sans-serif'
              }}
              onMouseOver={(e) => e.target.style.color = '#dc2626'}
              onMouseOut={(e) => e.target.style.color = 'var(--color-muted)'}
            >
              Log out
            </button>
          </div>
        </header>

        {/* Constrained Main Canvas */}
        <main style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}