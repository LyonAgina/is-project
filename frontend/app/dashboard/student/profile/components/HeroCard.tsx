// @ts-nocheck
'use client';
import { useRef, useState } from 'react';
import EditModal from './EditModal';
import { apiFetch } from '@/lib/api';

const LEVEL_LABELS = {
  certificate: 'Certificate',
  diploma: 'Diploma',
  undergraduate: 'Undergraduate',
  graduate: 'Graduate',
};

function getInitials(name) {
  const parts = (name || '').trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return (parts[0]?.[0] ?? '?').toUpperCase();
}

export default function HeroCard({ data, onSaved }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(data);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef(null);

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

  const handleAvatarUpload = async (e) => {
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

  return (
    <>
      <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--color-line)', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <div style={{ height: '160px', background: 'linear-gradient(135deg, #1e3a8a, #3b82f6)' }} />

        <div style={{ padding: '0 32px 32px 32px', position: 'relative' }}>
          
          <div style={{ marginTop: '-64px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div 
              style={{ width: '136px', height: '136px', borderRadius: '50%', border: '4px solid #ffffff', backgroundColor: '#f1f5f9', overflow: 'hidden', cursor: 'pointer', position: 'relative', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}
              onClick={() => !uploadingAvatar && avatarInputRef.current?.click()}
            >
              {data.avatarUrl ? (
                <img src={`${process.env.NEXT_PUBLIC_API_URL}${data.avatarUrl}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: 'bold', color: '#94a3b8' }}>
                  {getInitials(data.fullName)}
                </div>
              )}
            </div>

            <button
              onClick={() => { setDraft(data); setOpen(true); }}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: '1px solid var(--color-line)', cursor: 'pointer', fontSize: '14px', fontWeight: '600', color: '#1e3a8a', padding: '8px 16px', borderRadius: '8px', marginBottom: '8px' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
              Edit Profile
            </button>
          </div>

          <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--color-ink)', margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>
            {data.fullName || <span style={{ color: 'var(--color-muted)' }}>Your Name</span>}
          </h1>
          
          <p style={{ fontSize: '16px', color: 'var(--color-ink)', margin: '0 0 8px 0', fontWeight: '500' }}>
            {data.courseOfStudy} <span style={{ padding: '0 6px', color: 'var(--color-muted)' }}>·</span> {LEVEL_LABELS[data.educationLevel] || data.educationLevel}
          </p>
          
          <p style={{ fontSize: '14px', color: 'var(--color-muted)', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
            </svg>
            {data.location || 'Location not set'}
          </p>
        </div>
      </div>
      
      <input ref={avatarInputRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={handleAvatarUpload} />

      {open && (
        <EditModal title="Edit Intro" onClose={() => setOpen(false)} onSave={handleSave} saving={saving}>
          {(['fullName', 'courseOfStudy', 'location']).map((key) => (
            <div key={key} style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                {key === 'fullName' ? 'Full Name' : key === 'courseOfStudy' ? 'Course of Study' : 'Location'}
              </label>
              <input
                value={draft[key]}
                onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--color-line)', backgroundColor: '#f8fafc', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
          ))}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Education Level</label>
            <select
              value={draft.educationLevel}
              onChange={(e) => setDraft({ ...draft, educationLevel: e.target.value })}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--color-line)', backgroundColor: '#f8fafc', fontSize: '14px', outline: 'none', cursor: 'pointer', boxSizing: 'border-box' }}
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