'use client';
// @ts-nocheck
import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import AuthLayout from '@/components/AuthLayout';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Missing reset token. Please use the link from your email.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setStatus('loading');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reset password');

      setStatus('success');
      setTimeout(() => router.push('/login'), 2000);
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

  const labelStyle = {
    fontSize: '10px',
    fontWeight: '700',
    color: 'var(--color-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    display: 'block',
    marginBottom: '6px'
  };

  if (status === 'success') {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--color-paper)', alignItems: 'center', justifyContent: 'center', padding: '16px', fontFamily: 'var(--font-body-text), system-ui, sans-serif' }}>
        <main style={{ width: '100%', maxWidth: '440px', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid var(--color-line)', padding: '40px', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.01)' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '999px', backgroundColor: 'rgba(31, 111, 92, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto', color: 'var(--color-accent-2)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--color-ink)', margin: '0 0 4px 0' }}>Password reset!</h1>
          <p style={{ fontSize: '14px', color: 'var(--color-muted)', margin: 0, fontWeight: '500' }}>Redirecting you securely back to login context framework…</p>
        </main>
      </div>
    );
  }

  return (
    <AuthLayout title="Reset password" subtitle="Create a unique system access key">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={labelStyle}>New Password</label>
          <input
            type="password"
            placeholder="Minimum 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>Confirm New Password</label>
          <input
            type="password"
            placeholder="Re-enter password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
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
          style={{ width: '100%', backgroundColor: '#1e3a8a', color: '#ffffff', fontWeight: '600', padding: '14px', borderRadius: '12px', border: 'none', fontSize: '14px', cursor: 'pointer', transition: 'opacity 0.2s', marginTop: '8px', opacity: status === 'loading' ? 0.6 : 1, boxShadow: '0 4px 6px -1px rgba(30, 58, 138, 0.2)' }}
        >
          {status === 'loading' ? 'Resetting…' : 'Reset password'}
        </button>
      </form>
    </AuthLayout>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordContent />
    </Suspense>
  );
}