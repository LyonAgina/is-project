'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AuthLayout from '@/components/AuthLayout';

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          fullName: form.fullName,
          organizationName: form.organizationName,
          organizationType: form.organizationType,
          role,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');

      router.push(`/check-email?email=${encodeURIComponent(form.email)}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
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
    <AuthLayout title="Register" subtitle="Create your profile">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={labelStyle}>Account Type</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            style={{ ...inputStyle, cursor: 'pointer', appearance: 'none', backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 16px center', backgroundSize: '16px' }}
          >
            <option value="student">Student</option>
            <option value="organization">Organization / University</option>
          </select>
        </div>

        {role === 'student' && (
          <div>
            <label style={labelStyle}>Full Name</label>
            <input name="fullName" type="text" placeholder="John Doe" value={form.fullName} onChange={handleChange} style={inputStyle} required />
          </div>
        )}

        {role === 'organization' && (
          <>
            <div>
              <label style={labelStyle}>Organization Name</label>
              <input name="organizationName" type="text" placeholder="e.g. Strathmore University" value={form.organizationName} onChange={handleChange} style={inputStyle} required />
            </div>

            <div>
              <label style={labelStyle}>Organization Type</label>
              <select
                name="organizationType"
                value={form.organizationType}
                onChange={handleChange}
                style={{ ...inputStyle, cursor: 'pointer', appearance: 'none', backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 16px center', backgroundSize: '16px' }}
              >
                <option value="company">Company</option>
                <option value="university">University</option>
                <option value="ngo">NGO</option>
                <option value="government">Government</option>
              </select>
            </div>
          </>
        )}

        <div>
          <label style={labelStyle}>Email Address</label>
          <input name="email" type="email" placeholder="you@domain.com" value={form.email} onChange={handleChange} style={inputStyle} required />
        </div>

        <div>
          <label style={labelStyle}>Password</label>
          <input name="password" type="password" placeholder="Minimum 8 characters" value={form.password} onChange={handleChange} style={inputStyle} required minLength={8} />
        </div>

        <div>
          <label style={labelStyle}>Confirm Password</label>
          <input name="confirmPassword" type="password" placeholder="Re-enter password" value={form.confirmPassword} onChange={handleChange} style={inputStyle} required minLength={8} />
        </div>

        {error && (
          <div style={{ padding: '12px', backgroundColor: 'rgba(220, 38, 38, 0.05)', border: '1px solid rgba(220, 38, 38, 0.1)', borderRadius: '12px', textAlign: 'center' }}>
            <p style={{ fontSize: '13px', fontWeight: '600', color: '#dc2626', margin: 0, fontFamily: 'var(--font-body-text), sans-serif' }}>{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{ width: '100%', backgroundColor: '#1e3a8a', color: '#ffffff', fontWeight: '600', padding: '14px', borderRadius: '12px', border: 'none', fontSize: '14px', cursor: 'pointer', transition: 'opacity 0.2s', marginTop: '8px', opacity: loading ? 0.6 : 1, fontFamily: 'var(--font-body-text), sans-serif', boxShadow: '0 4px 6px -1px rgba(30, 58, 138, 0.15)' }}
        >
          {loading ? 'Creating account…' : 'Register'}
        </button>
      </form>

      <div style={{ borderTop: '1px solid var(--color-line)', paddingTop: '20px', marginTop: '24px', textAlign: 'center' }}>
        <p style={{ fontSize: '14px', color: 'var(--color-muted)', margin: 0, fontWeight: '500', fontFamily: 'var(--font-body-text), sans-serif' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ fontWeight: '700', color: '#1e3a8a', textDecoration: 'none' }}>
            Login
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}