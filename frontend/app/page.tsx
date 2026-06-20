'use client';
import { useEffect, useState } from 'react';

export default function Home() {
  const [status, setStatus] = useState('Loading...');

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/health`)
      .then((res) => res.json())
      .then((data) => setStatus(JSON.stringify(data)))
      .catch((err) => setStatus('Error: ' + err.message));
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center">
      <p className="text-xl">Backend says: {status}</p>
    </main>
  );
}