'use client';
import { useState } from 'react';
import ProfileCard from './ProfileCard';
import EditModal from './EditModal';
import TagPicker from '@/components/TagPicker';
import { apiFetch } from '@/lib/api';

interface Tag { id: number; name: string; }

interface SkillsData {
  experienceYears: number;
  tags: Tag[];
  tagIds: number[];
}

interface SkillsCardProps {
  data: SkillsData;
  onSaved: (patch: Partial<SkillsData>) => void;
}

export default function SkillsCard({ data, onSaved }: SkillsCardProps) {
  const [open, setOpen] = useState(false);
  const [draftYears, setDraftYears] = useState(data.experienceYears);
  const [draftTagIds, setDraftTagIds] = useState(data.tagIds);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const res = await apiFetch('/api/student/profile', {
      method: 'PUT',
      body: JSON.stringify({ experienceYears: draftYears, tagIds: draftTagIds }),
    });
    setSaving(false);
    if (res.ok) {
      onSaved({ experienceYears: draftYears, tagIds: draftTagIds });
      setOpen(false);
    }
  };

  const expLabel = data.experienceYears === 0
    ? null
    : `${data.experienceYears} year${data.experienceYears === 1 ? '' : 's'} of experience`;

  return (
    <>
      <ProfileCard
        title="Skills & experience"
        onEdit={() => {
          setDraftYears(data.experienceYears);
          setDraftTagIds(data.tagIds);
          setOpen(true);
        }}
      >
        {expLabel && (
          <div className="flex items-center gap-2 text-sm text-[var(--color-muted)] mb-3">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
              <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
            </svg>
            {expLabel}
          </div>
        )}

        {data.tags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {data.tags.map((tag) => (
              <span
                key={tag.id}
                className="text-xs font-medium px-3 py-1.5 rounded-full border border-[var(--color-line)] text-[var(--color-ink)]"
              >
                {tag.name}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm italic text-[var(--color-muted)]">Add your skills.</p>
        )}
      </ProfileCard>

      {open && (
        <EditModal title="Edit skills & experience" onClose={() => setOpen(false)} onSave={handleSave} saving={saving}>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider">
              Years of experience
            </label>
            <input
              type="number"
              step="0.5"
              min="0"
              value={draftYears}
              onChange={(e) => setDraftYears(parseFloat(e.target.value) || 0)}
              className="w-full bg-transparent border border-[var(--color-line)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-ink)]"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider">Skills</label>
            <TagPicker selectedIds={draftTagIds} onChange={setDraftTagIds} />
          </div>
        </EditModal>
      )}
    </>
  );
}
