// @ts-nocheck
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Register() {
  const [role, setRole] = useState('student');
  const [form, setForm] = useState({
    email: '', password: '', fullName: '', organizationName: '', organizationType: 'company'
  });
  const [error, setError] = useState('');
  const router = useRouter();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      router.push('/login');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <main className="max-w-md mx-auto mt-16 p-6">
      <h1 className="text-2xl font-bold mb-4">Register</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full border p-2 rounded">
          <option value="student">Student</option>
          <option value="organization">Organization / University</option>
        </select>

        <input name="email" placeholder="Email" onChange={handleChange} className="w-full border p-2 rounded" required />
        <input name="password" type="password" placeholder="Password" onChange={handleChange} className="w-full border p-2 rounded" required />

        {role === 'student' && (
          <input name="fullName" placeholder="Full Name" onChange={handleChange} className="w-full border p-2 rounded" required />
        )}

        {role === 'organization' && (
          <>
            <input name="organizationName" placeholder="Organization Name" onChange={handleChange} className="w-full border p-2 rounded" required />
            <select name="organizationType" onChange={handleChange} className="w-full border p-2 rounded">
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
    </main>
  );
}
