'use client';
// @ts-nocheck
import { useState } from 'react';
import Link from 'next/link';
import AuthLayout from '@/components/AuthLayout';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent'>('idle');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setStatus('loading');

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');

      setStatus('sent');
    } catch (err: any) {
      setError(err.message);
      setStatus('idle');
    }
  };

  const inputStyle = {
    width: '100%',
    borderRadius: '12px',
    border: '1px solid var(--color-line)',
    backgroundColor: '#ffffff',
    color: 'var(--color-ink)',
    padding: '12px 16px',
    fontSize: '14px',
    fontWeight: '500',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit'
  };

  return (
    <AuthLayout title="Reset Password">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {status === 'sent' ? (
          <div style={{ padding: '16px', backgroundColor: 'rgba(31, 111, 92, 0.05)', border: '1px solid var(--color-line)', borderRadius: '12px', textAlign: 'center' }}>
            <p style={{ fontSize: '14px', lineHeight: '1.5', color: 'var(--color-accent-2)', fontWeight: '500', margin: 0 }}>
              If an account exists for <strong style={{ color: 'var(--color-ink)', fontWeight: '700' }}>{email}</strong>, we've sent a password reset link to it. Check your inbox.
            </p>
          </div>
        ) : (
          <>
            <p style={{ fontSize: '14px', color: 'var(--color-muted)', textAlign: 'center', lineHeight: '1.5', fontWeight: '500', margin: '0 0 8px 0' }}>
              Enter your email and we'll send you a link to reset your password safely.
            </p>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '10px', fontWeight: '700', color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>Email Address</label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={inputStyle}
                />
              </div>
              
              {error && (
                <div style={{ padding: '12px', backgroundColor: 'rgba(220, 38, 38, 0.05)', border: '1px solid rgba(220, 38, 38, 0.2)', borderRadius: '12px', textAlign: 'center' }}>
                  <p style={{ fontSize: '13px', fontWeight: '600', color: '#dc2626', margin: 0 }}>{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={status === 'loading'}
                style={{ width: '100%', backgroundColor: '#1e3a8a', color: '#ffffff', fontWeight: '600', padding: '14px', borderRadius: '12px', border: 'none', fontSize: '14px', cursor: 'pointer', transition: 'opacity 0.2s', opacity: status === 'loading' ? 0.6 : 1, boxShadow: '0 4px 6px -1px rgba(30, 58, 138, 0.2)' }}
              >
                {status === 'loading' ? 'Sending…' : 'Send reset link'}
              </button>
            </form>
          </>
        )}

        <div style={{ textAlign: 'center', marginTop: '12px' }}>
          <Link href="/login" style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-muted)', textDecoration: 'none' }}>
            Back to login
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}