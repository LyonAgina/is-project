'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function CheckEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';

  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

  const handleResend = async () => {
    if (!email) return;
    setResendStatus('sending');
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setResendStatus('sent');
      setTimeout(() => setResendStatus('idle'), 4000);
    } catch {
      setResendStatus('idle');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <main className="w-full max-w-md rounded-xl border border-[var(--color-line)] p-8 text-center">
        <div className="w-14 h-14 rounded-full bg-[var(--color-paper)] border border-[var(--color-line)] flex items-center justify-center mx-auto mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <polyline points="22,6 12,13 2,6"/>
          </svg>
        </div>
        <h1 className="text-xl font-bold mb-2">Check your email</h1>
        <p className="text-sm text-[var(--color-muted)]">
          We sent a verification link to{' '}
          {email ? <strong>{email}</strong> : 'your email address'}. Click it to activate your account.
        </p>

        <div className="mt-5 text-sm text-[var(--color-muted)]">
          Didn't get it?{' '}
          <button
            onClick={handleResend}
            disabled={resendStatus !== 'idle' || !email}
            className="font-medium text-[var(--color-ink)] hover:underline disabled:opacity-50"
          >
            {resendStatus === 'sending' ? 'Sending…' : resendStatus === 'sent' ? 'Sent!' : 'Resend link'}
          </button>
        </div>

        <p className="mt-4 text-sm text-[var(--color-muted)]">
          <Link href="/login" className="hover:underline">Back to login</Link>
        </p>
      </main>
    </div>
  );
}

export default function CheckEmailPage() {
  return (
    <Suspense>
      <CheckEmailContent />
    </Suspense>
  );
}