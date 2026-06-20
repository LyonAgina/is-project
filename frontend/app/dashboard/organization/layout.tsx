// @ts-nocheck
'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';

const links = [
  { href: '/dashboard/organization', label: 'Home' },
  { href: '/dashboard/organization/create', label: 'Create opportunity' },
  { href: '/dashboard/organization/opportunities', label: 'My opportunities' },
  { href: '/dashboard/organization/profile', label: 'Profile' },
];

export default function OrganizationLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    const role = localStorage.getItem('role');
    if (role !== 'organization') {
      router.push('/login');
      return;
    }
    setReady(true);
    apiFetch('/api/organization/profile').then((r) => r.json()).then((d) => setStatus(d.verification_status)).catch(() => {});
  }, []);

  const logout = () => {
    localStorage.clear();
    router.push('/login');
  };

  if (!ready) return null;

  return (
    <div className="min-h-screen flex">
      <aside className="w-56 border-r border-[var(--color-line)] p-6 flex flex-col">
        <span className="font-display text-lg font-bold mb-8">Fursa</span>
        <nav className="flex flex-col gap-1 flex-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`text-sm px-3 py-2 rounded-md ${
                pathname === l.href ? 'bg-[var(--color-ink)] text-white' : 'text-[var(--color-muted)] hover:bg-[var(--color-paper)]'
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <button onClick={logout} className="text-sm text-left text-[var(--color-muted)] hover:text-[var(--color-ink)]">
          Log out
        </button>
      </aside>
      <div className="flex-1 flex flex-col">
        <header className="border-b border-[var(--color-line)] px-8 py-4">
          <span className="text-sm text-[var(--color-muted)]">Organization dashboard</span>
        </header>
        {status && status !== 'verified' && (
          <div className={`px-8 py-3 text-sm ${status === 'pending' ? 'bg-amber-50 text-amber-800' : 'bg-red-50 text-red-700'}`}>
            {status === 'pending'
              ? 'Your organization is awaiting admin verification. You can browse the dashboard, but cannot post opportunities yet.'
              : 'Your organization was not approved. Contact the admin for details.'}
          </div>
        )}
        <main className="flex-1 p-8">{children}</main>
        <footer className="border-t border-[var(--color-line)] px-8 py-4 text-xs text-[var(--color-muted)]">
          Fursa — for organizations &amp; universities
        </footer>
      </div>
    </div>
  );
}