// @ts-nocheck
'use client';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

export default function OrganizationProfile() {
  const [form, setForm] = useState({ name: '', type: 'company', description: '', website: '', location: '' });
  const [status, setStatus] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    apiFetch('/api/organization/profile').then((r) => r.json()).then((data) => {
      setForm({
        name: data.name || '', type: data.type || 'company', description: data.description || '',
        website: data.website || '', location: data.location || '',
      });
      setStatus(data.verification_status);
    }).catch(() => {});
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await apiFetch('/api/organization/profile', { method: 'PUT', body: JSON.stringify(form) });
    setMessage(res.ok ? 'Profile saved' : 'Failed to save profile');
  };

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl font-bold mb-2">Organization profile</h1>
      <p className="text-sm text-[var(--color-muted)] mb-6">Verification status: <span className="capitalize">{status}</span></p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input name="name" value={form.name} onChange={handleChange} placeholder="Organization name" className="w-full border border-[var(--color-line)] p-2 rounded-md" />
        <select name="type" value={form.type} onChange={handleChange} className="w-full border border-[var(--color-line)] p-2 rounded-md">
          <option value="company">Company</option>
          <option value="university">University</option>
          <option value="ngo">NGO</option>
          <option value="government">Government</option>
        </select>
        <textarea name="description" value={form.description} onChange={handleChange} placeholder="Description" className="w-full border border-[var(--color-line)] p-2 rounded-md" rows={3} />
        <input name="website" value={form.website} onChange={handleChange} placeholder="Website" className="w-full border border-[var(--color-line)] p-2 rounded-md" />
        <input name="location" value={form.location} onChange={handleChange} placeholder="Location" className="w-full border border-[var(--color-line)] p-2 rounded-md" />
        {message && <p className="text-sm">{message}</p>}
        <button type="submit" className="bg-[var(--color-ink)] text-white px-4 py-2 rounded-md">Save profile</button>
      </form>
    </div>
  );
}