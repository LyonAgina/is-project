// @ts-nocheck
'use client';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import TagPicker from '@/components/TagPicker';

export default function StudentProfile() {
  const [form, setForm] = useState({
    fullName: '', institution: '', courseOfStudy: '', educationLevel: 'undergraduate',
    experienceYears: 0, location: '', bio: '', cvUrl: '',
  });
  const [tagIds, setTagIds] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    apiFetch('/api/student/profile').then((r) => r.json()).then((data) => {
      setForm({
        fullName: data.full_name || '',
        institution: data.institution || '',
        courseOfStudy: data.course_of_study || '',
        educationLevel: data.education_level || 'undergraduate',
        experienceYears: data.experience_years || 0,
        location: data.location || '',
        bio: data.bio || '',
        cvUrl: data.cv_url || '',
      });
      setTagIds((data.tags || []).map((t) => t.id));
    }).catch(() => {});
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    const res = await apiFetch('/api/student/profile', { method: 'PUT', body: JSON.stringify({ ...form, tagIds }) });
    setMessage(res.ok ? 'Profile saved' : 'Failed to save profile');
  };

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl font-bold mb-6">Your profile</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input name="fullName" value={form.fullName} onChange={handleChange} placeholder="Full name" className="w-full border border-[var(--color-line)] p-2 rounded-md" />
        <input name="institution" value={form.institution} onChange={handleChange} placeholder="Institution" className="w-full border border-[var(--color-line)] p-2 rounded-md" />
        <input name="courseOfStudy" value={form.courseOfStudy} onChange={handleChange} placeholder="Course of study" className="w-full border border-[var(--color-line)] p-2 rounded-md" />
        <select name="educationLevel" value={form.educationLevel} onChange={handleChange} className="w-full border border-[var(--color-line)] p-2 rounded-md">
          <option value="certificate">Certificate</option>
          <option value="diploma">Diploma</option>
          <option value="undergraduate">Undergraduate</option>
          <option value="graduate">Graduate</option>
        </select>

        <select name="academicGrade" value={form.academicGrade} onChange={handleChange} className="w-full border border-[var(--color-line)] p-2 rounded-md">
        <option value="">Academic grade (optional)</option>
        <option value="first_class">First Class</option>
        <option value="second_upper">Second Class Upper</option>
        <option value="second_lower">Second Class Lower</option>
        <option value="pass">Pass</option>
        </select>

        <input name="experienceYears" type="number" step="0.5" value={form.experienceYears} onChange={handleChange} placeholder="Years of experience" className="w-full border border-[var(--color-line)] p-2 rounded-md" />
        <input name="location" value={form.location} onChange={handleChange} placeholder="Location (e.g. Nairobi)" className="w-full border border-[var(--color-line)] p-2 rounded-md" />
        <textarea name="bio" value={form.bio} onChange={handleChange} placeholder="Short bio" className="w-full border border-[var(--color-line)] p-2 rounded-md" rows={3} />
        <div>
       <label className="text-sm font-medium block mb-2">CV (PDF or Word)</label>
        {form.cvUrl && (
            <a href={`${process.env.NEXT_PUBLIC_API_URL}${form.cvUrl}`} target="_blank" className="text-sm underline block mb-2">
        View current CV
          </a>
         )}
     <input type="file" accept=".pdf,.doc,.docx" onChange={async (e) => {
        const file = e.target.files[0];
          if (!file) return;
          const formData = new FormData();
          formData.append('cv', file);
          const token = localStorage.getItem('token');
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/student/profile/cv`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
          });
       const data = await res.json();
        if (res.ok) setForm((prev) => ({ ...prev, cvUrl: data.cvUrl }));
         }} className="text-sm" />
      </div>

        <TagPicker selectedIds={tagIds} onChange={setTagIds} />

        {message && <p className="text-sm">{message}</p>}
        <button type="submit" className="bg-[var(--color-ink)] text-white px-4 py-2 rounded-md">Save profile</button>
      </form>
    </div>
  );
}