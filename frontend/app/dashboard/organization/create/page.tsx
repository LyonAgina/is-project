// @ts-nocheck
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import TagPicker from '@/components/TagPicker';

export default function CreateOpportunity() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: '', category: 'job', description: '', minEducation: 'undergraduate',
    minExperience: 0, location: '', deadline: '',
  });
  const [tagIds, setTagIds] = useState([]);
  const [error, setError] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const res = await apiFetch('/api/organization/opportunities', { method: 'POST', body: JSON.stringify({ ...form, tagIds }) });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Failed to post opportunity');
      return;
    }
    router.push('/dashboard/organization/opportunities');
  };

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl font-bold mb-6">Create an opportunity</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input name="title" value={form.title} onChange={handleChange} placeholder="Title" className="w-full border border-[var(--color-line)] p-2 rounded-md" required />
        <select name="category" value={form.category} onChange={handleChange} className="w-full border border-[var(--color-line)] p-2 rounded-md">
          <option value="job">Job</option>
          <option value="internship">Internship</option>
          <option value="scholarship">Scholarship</option>
        </select>
        <textarea name="description" value={form.description} onChange={handleChange} placeholder="Description" className="w-full border border-[var(--color-line)] p-2 rounded-md" rows={4} />
        <select name="minEducation" value={form.minEducation} onChange={handleChange} className="w-full border border-[var(--color-line)] p-2 rounded-md">
          <option value="certificate">Certificate</option>
          <option value="diploma">Diploma</option>
          <option value="undergraduate">Undergraduate</option>
          <option value="graduate">Graduate</option>
        </select>
        <select name="minAcademicGrade" value={form.minAcademicGrade} onChange={handleChange} className="w-full border border-[var(--color-line)] p-2 rounded-md">
        <option value="">No minimum grade required</option>
        <option value="first_class">First Class</option>
        <option value="second_upper">Second Class Upper</option>
        <option value="second_lower">Second Class Lower</option>
        <option value="pass">Pass</option> 
        </select>

        <input name="minExperience" type="number" step="0.5" value={form.minExperience} onChange={handleChange} placeholder="Minimum years of experience" className="w-full border border-[var(--color-line)] p-2 rounded-md" />
        <input name="location" value={form.location} onChange={handleChange} placeholder="Location" className="w-full border border-[var(--color-line)] p-2 rounded-md" />
        <input name="deadline" type="date" value={form.deadline} onChange={handleChange} className="w-full border border-[var(--color-line)] p-2 rounded-md" />

        <TagPicker selectedIds={tagIds} onChange={setTagIds} />

        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button type="submit" className="bg-[var(--color-ink)] text-white px-4 py-2 rounded-md">Post opportunity</button>
      </form>
    </div>
  );
}