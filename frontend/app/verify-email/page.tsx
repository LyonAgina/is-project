'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token found in the link.');
      return;
    }

    const verify = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/auth/verify-email?token=${token}`
        );
        const data = await res.json();

        if (!res.ok) {
          setStatus('error');
          setMessage(data.error || 'Verification failed.');
          return;
        }

        setStatus('success');
        setMessage(data.message);
        setTimeout(() => router.push('/login'), 2000);
      } catch {
        setStatus('error');
        setMessage('Network error. Please try again.');
      }
    };

    verify();
  }, [token, router]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <main className="w-full max-w-md rounded-xl border border-[var(--color-line)] p-8 text-center">
        {status === 'verifying' && (
          <p className="text-sm text-[var(--color-muted)]">Verifying your email…</p>
        )}

        {status === 'success' && (
          <>
            <div className="w-14 h-14 rounded-full bg-green-50 border border-green-200 flex items-center justify-center mx-auto mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h1 className="text-xl font-bold mb-2">Email verified!</h1>
            <p className="text-sm text-[var(--color-muted)]">{message}</p>
            <p className="text-xs text-[var(--color-muted)] mt-3">Redirecting you to login…</p>
          </>
        )}

        {status === 'error' && (
          <>
            <h1 className="text-xl font-bold mb-2">Verification failed</h1>
            <p className="text-sm text-red-600 mb-4">{message}</p>
            <Link href="/login" className="text-sm font-medium text-[var(--color-ink)] hover:underline">
              Back to login
            </Link>
          </>
        )}
      </main>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}