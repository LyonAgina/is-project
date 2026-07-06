// @ts-nocheck
'use client';
import { useState } from 'react';
import ProfileCard from './ProfileCard';
import EditModal from './EditModal';
import { apiFetch } from '@/lib/api';

export default function ExperienceCard({ form, setForm, onSave }) {
  const [open, setOpen] = useState(false);
  const [years, setYears] = useState(form.experienceYears ?? 0);

  const handleSave = async () => {
    const updated = { ...form, experienceYears: Number(years) };
    await apiFetch('/api/student/profile', { method: 'PUT', body: JSON.stringify({ experienceYears: updated.experienceYears }) });
    setForm(updated);
    setOpen(false);
  };

  return (
    <>
      <ProfileCard title="Experience" onEdit={() => { setYears(form.experienceYears ?? 0); setOpen(true); }}>
        <p style={{ fontSize: '15px', fontWeight: '600' }}>
          {form.experienceYears > 0 ? `${form.experienceYears} Years of Experience` : 'No formal experience added.'}
        </p>
      </ProfileCard>
      {open && (
        <EditModal title="Edit Experience" onClose={() => setOpen(false)} onSave={handleSave}>
          <input type="number" value={years} onChange={(e) => setYears(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }} />
        </EditModal>
      )}
    </>
  );
}