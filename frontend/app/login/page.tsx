'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.role);
      localStorage.setItem('userId', data.userId);

      router.push(`/dashboard/${data.role}`);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <main className="w-full max-w-md rounded-xl border border-[var(--color-line)] p-6">
        <h1 className="mb-6 text-center text-2xl font-bold">Login</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="email"
            type="email"
            placeholder="Email"
            onChange={handleChange}
            className="w-full rounded border border-[var(--color-line)] bg-transparent p-2"
            required
          />

          <div>
            <input
              name="password"
              type="password"
              placeholder="Password"
              onChange={handleChange}
              className="w-full rounded border border-[var(--color-line)] bg-transparent p-2"
              required
            />
            <div className="mt-1 text-right">
              <Link
                href="/forgot-password"
                className="text-xs text-[var(--color-muted)] hover:underline"
              >
                Forgot password?
              </Link>
            </div>
          </div>

          <button type="submit" className="w-full bg-black text-white p-2 rounded">Login</button>

          {error && (
            <p className="text-sm text-red-600 text-center">
              {error}
              {error.toLowerCase().includes('verify') && (
                <>
                  {' '}
                  <Link href="/check-email" className="underline">
                    Resend verification
                  </Link>
                </>
              )}
            </p>
          )}
        </form>

        <p className="mt-4 text-center text-sm text-[var(--color-muted)]">
          Don't have an account?{' '}
          <Link
            href="/register"
            className="font-medium text-[var(--color-ink)] hover:underline"
          >
            Register
          </Link>
        </p>
      </main>
    </div>
  );
}