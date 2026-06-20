// @ts-nocheck
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function StudentDashboard() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const role = localStorage.getItem('role');
    if (role !== 'student') {
      router.push('/login');
    } else {
      setReady(true);
    }
  }, []);

  if (!ready) return null;
  return <main className="p-8"><h1 className="text-2xl font-bold">Student Dashboard</h1></main>;
}
