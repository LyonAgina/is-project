'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Register() {
  const [role, setRole] = useState('student');

  const [form, setForm] = useState({
    email: '',
    password: '',
    fullName: '',
    organizationName: '',
    organizationType: 'company',
  });

  const [error, setError] = useState('');
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

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...form,
            role,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Registration failed');

      router.push('/login');
    } catch (err: any) {
      setError(err.message);
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

          <input
            name="email"
            type="email"
            placeholder="Email"
            onChange={handleChange}
            className="w-full rounded border border-[var(--color-line)] bg-transparent p-2"
            required
          />

          <input
            name="password"
            type="password"
            placeholder="Password"
            onChange={handleChange}
            className="w-full rounded border border-[var(--color-line)] bg-transparent p-2"
            required
          />

          {role === 'student' && (
            <input
              name="fullName"
              placeholder="Full Name"
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
                onChange={handleChange}
                className="w-full rounded border border-[var(--color-line)] bg-transparent p-2"
                required
              />

              <select
                name="organizationType"
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

          {error && <p className="text-red-600">{error}</p>}

          <button type="submit" className="w-full bg-black text-white p-2 rounded">Register</button>
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