'use client';
// @ts-nocheck
import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AuthLayout from '@/components/AuthLayout';

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
    <AuthLayout title="Check your email">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center', textAlign: 'center' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '16px', backgroundColor: 'rgba(30, 58, 138, 0.05)', border: '1px solid var(--color-line)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1e3a8a' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <polyline points="22,6 12,13 2,6"/>
          </svg>
        </div>

        <p style={{ fontSize: '14.5px', color: 'var(--color-muted)', lineHeight: '1.6', margin: 0, fontWeight: '500' }}>
          We sent a verification link to{' '}
          {email ? <strong style={{ color: 'var(--color-ink)', fontWeight: '700' }}>{email}</strong> : 'your email address'}. <br />Click it to activate your system profile.
        </p>

        <div style={{ width: '100%', backgroundColor: 'var(--color-paper)', border: '1px solid var(--color-line)', borderRadius: '12px', padding: '16px', fontSize: '14px', color: 'var(--color-muted)', fontWeight: '500', boxSizing: 'border-box' }}>
          Didn't get it?{' '}
          <button
            onClick={handleResend}
            disabled={resendStatus !== 'idle' || !email}
            style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', cursor: 'pointer', fontWeight: '700', color: '#1e3a8a', textDecoration: 'underline' }}
          >
            {resendStatus === 'sending' ? 'Sending…' : resendStatus === 'sent' ? 'Sent!' : 'Resend link'}
          </button>
        </div>

        <div style={{ pt: '4px' }}>
          <Link href="/login" style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-muted)', textDecoration: 'none' }}>
            Back to login
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}

export default function CheckEmailPage() {
  return (
    <Suspense>
      <CheckEmailContent />
    </Suspense>
  );
}