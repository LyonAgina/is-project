// @ts-nocheck
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function OrganizationDashboard() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const role = localStorage.getItem('role');
    if (role !== 'organization') {
      router.push('/login');
    } else {
      setReady(true);
    }
  }, []);

  if (!ready) return null;
  return <main className="p-8"><h1 className="text-2xl font-bold">Organization Dashboard</h1></main>;
}
