// @ts-nocheck
'use client';
import { useState } from 'react';
import ProfileCard from './ProfileCard';
import EditModal from './EditModal';
import TagPicker from '@/components/TagPicker';
import { apiFetch } from '@/lib/api';

export default function SkillsCard({ data, onSaved }) {
  const [open, setOpen] = useState(false);
  const [draftYears, setDraftYears] = useState(data.experienceYears);
  const [draftTagIds, setDraftTagIds] = useState(data.tagIds);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await apiFetch('/api/student/profile', { 
      method: 'PUT', 
      body: JSON.stringify({ experience_years: Number(draftYears), tagIds: draftTagIds }) 
    });
    onSaved({ experienceYears: Number(draftYears), tagIds: draftTagIds });
    setSaving(false); setOpen(false);
  };

  return (
    <>
      <ProfileCard title="Skills & experience" onEdit={() => { setDraftYears(data.experienceYears); setDraftTagIds(data.tagIds); setOpen(true); }}>
        <p style={{ fontSize: '14px', marginBottom: '16px', color: '#64748b' }}>{data.experienceYears} Years of experience</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {(data.tags || []).map(tag => (
            <span key={tag.id} style={{ fontSize: '13px', padding: '6px 14px', backgroundColor: '#f1f5f9', borderRadius: '999px', border: '1px solid #e2e8f0' }}>{tag.name}</span>
          ))}
        </div>
      </ProfileCard>
      
      {open && (
        <EditModal title="Edit Skills & experience" onClose={() => setOpen(false)} onSave={handleSave} saving={saving}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '8px' }}>Years of Experience</label>
          <input type="number" value={draftYears} onChange={(e) => setDraftYears(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc', marginBottom: '16px' }} />
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '8px' }}>Skills</label>
          <TagPicker selectedIds={draftTagIds} onChange={setDraftTagIds} />
        </EditModal>
      )}
    </>
  );
}