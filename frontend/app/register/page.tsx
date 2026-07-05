'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Register() {
  const [role, setRole] = useState('student');

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    organizationName: '',
    organizationType: 'company',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: form.email,
            password: form.password,
            fullName: form.fullName,
            organizationName: form.organizationName,
            organizationType: form.organizationType,
            role,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Registration failed');

      router.push(`/check-email?email=${encodeURIComponent(form.email)}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <main className="w-full max-w-md rounded-xl border border-[var(--color-line)] p-6">
        <h1 className="mb-6 text-center text-2xl font-bold">Register</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full rounded border border-[var(--color-line)] bg-transparent p-2"
          >
            <option value="student">Student</option>
            <option value="organization">
              Organization / University
            </option>
          </select>

          {role === 'student' && (
            <input
              name="fullName"
              placeholder="Full Name"
              value={form.fullName}
              onChange={handleChange}
              className="w-full rounded border border-[var(--color-line)] bg-transparent p-2"
              required
            />
          )}

          {role === 'organization' && (
            <>
              <input
                name="organizationName"
                placeholder="Organization Name"
                value={form.organizationName}
                onChange={handleChange}
                className="w-full rounded border border-[var(--color-line)] bg-transparent p-2"
                required
              />

              <select
                name="organizationType"
                value={form.organizationType}
                onChange={handleChange}
                className="w-full rounded border border-[var(--color-line)] bg-transparent p-2"
              >
                <option value="company">Company</option>
                <option value="university">University</option>
                <option value="ngo">NGO</option>
                <option value="government">Government</option>
              </select>
            </>
          )}

          <input
            name="email"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            className="w-full rounded border border-[var(--color-line)] bg-transparent p-2"
            required
          />

          <input
            name="password"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            className="w-full rounded border border-[var(--color-line)] bg-transparent p-2"
            required
            minLength={8}
          />

          <input
            name="confirmPassword"
            type="password"
            placeholder="Confirm Password"
            value={form.confirmPassword}
            onChange={handleChange}
            className="w-full rounded border border-[var(--color-line)] bg-transparent p-2"
            required
            minLength={8}
          />

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white p-2 rounded disabled:opacity-60"
          >
            {loading ? 'Creating account…' : 'Register'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-[var(--color-muted)]">
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-medium text-[var(--color-ink)] hover:underline"
          >
            Login
          </Link>
        </p>
      </main>
    </div>
  );
}