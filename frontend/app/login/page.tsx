'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AuthLayout from '@/components/AuthLayout';

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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');

      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.role);
      localStorage.setItem('userId', data.userId);

      router.push(`/dashboard/${data.role}`);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const inputStyle: React.CSSProperties = {
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
    fontFamily: 'var(--font-body-text), sans-serif'
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '10px',
    fontWeight: '700',
    color: 'var(--color-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    display: 'block',
    marginBottom: '6px',
    fontFamily: 'var(--font-body-text), sans-serif'
  };

  return (
    <AuthLayout title="Login" subtitle="Welcome back to Opportunity Hub">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <label style={labelStyle}>Email Address</label>
          <input name="email" type="email" placeholder="name@example.com" onChange={handleChange} style={inputStyle} required />
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <label style={labelStyle}>Password</label>
            <Link href="/forgot-password" style={{ fontSize: '12px', fontWeight: '600', color: '#1e3a8a', textDecoration: 'none', fontFamily: 'var(--font-body-text), sans-serif' }}>
              Forgot password?
            </Link>
          </div>
          <input name="password" type="password" placeholder="••••••••" onChange={handleChange} style={inputStyle} required />
        </div>

        <button type="submit" style={{ width: '100%', backgroundColor: '#1e3a8a', color: '#ffffff', fontWeight: '600', padding: '14px', borderRadius: '12px', border: 'none', fontSize: '14px', cursor: 'pointer', marginTop: '4px', fontFamily: 'var(--font-body-text), sans-serif', boxShadow: '0 4px 6px -1px rgba(30, 58, 138, 0.15)' }}>
          Login
        </button>

        {error && (
          <div style={{ padding: '12px', backgroundColor: 'rgba(220, 38, 38, 0.05)', border: '1px solid rgba(220, 38, 38, 0.1)', borderRadius: '12px', textAlign: 'center' }}>
            <p style={{ fontSize: '13px', fontWeight: '600', color: '#dc2626', margin: 0, fontFamily: 'var(--font-body-text), sans-serif' }}>
              {error}
              {error.toLowerCase().includes('verify') && (
                <Link href="/check-email" style={{ display: 'block', textDecoration: 'underline', marginTop: '4px', fontWeight: '700', color: '#dc2626' }}>
                  Resend verification
                </Link>
              )}
            </p>
          </div>
        )}
      </form>

      <div style={{ borderTop: '1px solid var(--color-line)', paddingTop: '20px', marginTop: '24px', textAlign: 'center' }}>
        <p style={{ fontSize: '14px', color: 'var(--color-muted)', margin: 0, fontWeight: '500', fontFamily: 'var(--font-body-text), sans-serif' }}>
          Don't have an account?{' '}
          <Link href="/register" style={{ fontWeight: '700', color: '#1e3a8a', textDecoration: 'none' }}>
            Register
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}