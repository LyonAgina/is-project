// @ts-nocheck
'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

const links = [
  { href: '/dashboard/student', label: 'Home' },
  { href: '/dashboard/student/opportunities', label: 'Opportunities' },
  { href: '/dashboard/student/recommendations', label: 'Recommendations' },
  { href: '/dashboard/student/applications', label: 'Applications' },
  { href: '/dashboard/student/inbox', label: 'Inbox' },
  { href: '/dashboard/student/profile', label: 'Profile' },
];

export default function StudentLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const role = localStorage.getItem('role');
    if (role !== 'student') {
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
          <span className="text-sm text-[var(--color-muted)]">Student dashboard</span>
        </header>
        <main className="flex-1 p-8">{children}</main>
        <footer className="border-t border-[var(--color-line)] px-8 py-4 text-xs text-[var(--color-muted)]">
          Fursa — find opportunities that fit
        </footer>
      </div>
    </div>
  );
}