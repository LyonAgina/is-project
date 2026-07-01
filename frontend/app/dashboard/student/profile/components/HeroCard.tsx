'use client';
import { useRef, useState } from 'react';
import EditModal from './EditModal';
import { apiFetch } from '@/lib/api';

interface HeroData {
  fullName: string;
  courseOfStudy: string;
  educationLevel: string;
  location: string;
  avatarUrl: string;
}

interface HeroCardProps {
  data: HeroData;
  onSaved: (patch: Partial<HeroData>) => void;
}

const LEVEL_LABELS: Record<string, string> = {
  certificate: 'Certificate',
  diploma: 'Diploma',
  undergraduate: 'Undergraduate',
  graduate: 'Graduate',
};

function getInitials(name: string): string {
  const parts = (name || '').trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return (parts[0]?.[0] ?? '?').toUpperCase();
}

export default function HeroCard({ data, onSaved }: HeroCardProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(data);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    setSaving(true);
    const res = await apiFetch('/api/student/profile', {
      method: 'PUT',
      body: JSON.stringify({
        fullName: draft.fullName,
        courseOfStudy: draft.courseOfStudy,
        educationLevel: draft.educationLevel,
        location: draft.location,
      }),
    });
    setSaving(false);
    if (res.ok) {
      onSaved({ fullName: draft.fullName, courseOfStudy: draft.courseOfStudy, educationLevel: draft.educationLevel, location: draft.location });
      setOpen(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    const formData = new FormData();
    formData.append('avatar', file);
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/student/profile/avatar`, {
      method: 'POST',
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: formData,
    });
    const d = await res.json();
    setUploadingAvatar(false);
    if (res.ok) onSaved({ avatarUrl: d.avatarUrl });
    e.target.value = '';
  };

  const subtitle = [
    data.courseOfStudy,
    data.educationLevel ? (LEVEL_LABELS[data.educationLevel] ?? data.educationLevel) : '',
  ].filter(Boolean).join(' · ');

  return (
    <>
      {/* hidden file input */}
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: 'none' }}
        onChange={handleAvatarUpload}
      />

      <div className="border border-[var(--color-line)] rounded-xl overflow-hidden bg-[var(--color-surface)]">
        {/* ── Cover banner ── */}
        <div className="h-32 bg-[#1e293b]" />

        {/* ── Content ── */}
        <div className="px-6 pb-6 relative">
          {/* Edit profile — top-right of the content area, matching the About card style */}
          <button
            onClick={() => { setDraft(data); setOpen(true); }}
            className="absolute top-3 right-5 flex items-center gap-1.5 text-sm text-[var(--color-muted)] hover:text-[var(--color-ink)] transition-colors px-2.5 py-1 rounded-lg hover:bg-[var(--color-line)]"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Edit
          </button>

          {/* ── Avatar: pulled up into the cover with negative margin ── */}
          <div className="-mt-10 mb-3">
            <button
              type="button"
              title="Change profile photo"
              onClick={() => !uploadingAvatar && avatarInputRef.current?.click()}
              className="relative rounded-full border-4 border-[var(--color-surface)] bg-[#334155] overflow-hidden group cursor-pointer"
              style={{ width: 80, height: 80, flexShrink: 0 }}
            >
              {data.avatarUrl ? (
                <img
                  src={`${process.env.NEXT_PUBLIC_API_URL}${data.avatarUrl}`}
                  alt={data.fullName || 'Profile photo'}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              ) : (
                <span className="absolute inset-0 flex items-center justify-center text-white font-bold text-xl select-none">
                  {getInitials(data.fullName)}
                </span>
              )}
              <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                {uploadingAvatar ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                    <span className="text-white text-[9px] font-medium">Edit</span>
                  </>
                )}
              </div>
            </button>
          </div>

          {/* ── Name ── */}
          <h1 className="font-display text-xl font-bold leading-tight">
            {data.fullName || <span className="text-[var(--color-muted)]">Your name</span>}
          </h1>

          {subtitle && (
            <p className="text-sm text-[var(--color-muted)] mt-0.5">{subtitle}</p>
          )}

          {data.location && (
            <p className="flex items-center gap-1.5 text-sm text-[var(--color-muted)] mt-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              {data.location}
            </p>
          )}
        </div>
      </div>

      {open && (
        <EditModal title="Edit profile" onClose={() => setOpen(false)} onSave={handleSave} saving={saving}>
          {(['fullName', 'courseOfStudy', 'location'] as const).map((key) => (
            <div key={key} className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider">
                {key === 'fullName' ? 'Full name' : key === 'courseOfStudy' ? 'Course of study' : 'Location'}
              </label>
              <input
                value={draft[key]}
                onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
                placeholder={
                  key === 'fullName' ? 'e.g. Lyon Mwangi'
                  : key === 'courseOfStudy' ? 'e.g. Computer Science'
                  : 'e.g. Nairobi, Kenya'
                }
                className="w-full bg-transparent border border-[var(--color-line)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-ink)]"
              />
            </div>
          ))}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider">Education level</label>
            <select
              value={draft.educationLevel}
              onChange={(e) => setDraft({ ...draft, educationLevel: e.target.value })}
              className="w-full bg-[var(--color-surface)] border border-[var(--color-line)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-ink)]"
            >
              <option value="certificate">Certificate</option>
              <option value="diploma">Diploma</option>
              <option value="undergraduate">Undergraduate</option>
              <option value="graduate">Graduate</option>
            </select>
          </div>
        </EditModal>
      )}
    </>
  );
}
