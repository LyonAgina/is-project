'use client';
import { useState } from 'react';
import ProfileCard from './ProfileCard';
import EditModal from './EditModal';
import { apiFetch } from '@/lib/api';

interface AboutCardProps {
  bio: string;
  onSaved: (bio: string) => void;
}

export default function AboutCard({ bio, onSaved }: AboutCardProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(bio);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const res = await apiFetch('/api/student/profile', {
      method: 'PUT',
      body: JSON.stringify({ bio: draft }),
    });
    setSaving(false);
    if (res.ok) { onSaved(draft); setOpen(false); }
  };

  return (
    <>
      <ProfileCard title="About" onEdit={() => { setDraft(bio); setOpen(true); }}>
        {bio ? (
          <p className="text-sm leading-relaxed text-[var(--color-ink)]">{bio}</p>
        ) : (
          <p className="text-sm italic text-[var(--color-muted)]">
            Add a short bio — what you're studying, what you're building, what you're looking for.
          </p>
        )}
      </ProfileCard>

      {open && (
        <EditModal title="Edit about" onClose={() => setOpen(false)} onSave={handleSave} saving={saving}>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider">Bio</label>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Passionate about data systems…"
              rows={5}
              className="w-full bg-transparent border border-[var(--color-line)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-ink)] resize-none"
            />
          </div>
        </EditModal>
      )}
    </>
  );
}
