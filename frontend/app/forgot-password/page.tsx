'use client';

import { useState } from 'react';
import Link from 'next/link';

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

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <main className="w-full max-w-md rounded-xl border border-[var(--color-line)] p-8">
        <h1 className="text-xl font-bold mb-2 text-center">Forgot your password?</h1>

        {status === 'sent' ? (
          <p className="text-sm text-[var(--color-muted)] text-center">
            If an account exists for <strong>{email}</strong>, we've sent a password reset link to it.
          </p>
        ) : (
          <>
            <p className="text-sm text-[var(--color-muted)] text-center mb-6">
              Enter your email and we'll send you a link to reset your password.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded border border-[var(--color-line)] bg-transparent p-2"
              />
              {error && <p className="text-red-600 text-sm">{error}</p>}
              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full bg-black text-white p-2 rounded disabled:opacity-60"
              >
                {status === 'loading' ? 'Sending…' : 'Send reset link'}
              </button>
            </form>
          </>
        )}

        <p className="mt-4 text-center text-sm text-[var(--color-muted)]">
          <Link href="/login" className="hover:underline">Back to login</Link>
        </p>
      </main>
    </div>
  );
}