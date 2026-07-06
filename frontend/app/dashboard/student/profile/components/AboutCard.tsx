// @ts-nocheck
'use client';
import { useState } from 'react';
import ProfileCard from './ProfileCard';
import EditModal from './EditModal';
import { apiFetch } from '@/lib/api';

export default function AboutCard({ bio, onSaved }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(bio || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const res = await apiFetch('/api/student/profile', {
      method: 'PUT',
      body: JSON.stringify({ bio: draft }),
    });
    setSaving(false);
    if (res.ok) {
      onSaved(draft);
      setOpen(false);
    }
  };

  return (
    <>
      <ProfileCard title="About" onEdit={() => { setDraft(bio || ''); setOpen(true); }}>
        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1e3a8a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
            </svg>
          </div>
          <p style={{ fontSize: '15px', lineHeight: '1.6', color: 'var(--color-ink)', margin: 0, whiteSpace: 'pre-wrap' }}>
            {bio || <span style={{ color: 'var(--color-muted)' }}>Add a professional summary to help recruiters understand your goals.</span>}
          </p>
        </div>
      </ProfileCard>

      {open && (
        <EditModal title="Edit About" onClose={() => setOpen(false)} onSave={handleSave} saving={saving}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
            Professional Summary
          </label>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={5}
            placeholder="I am a passionate software engineer..."
            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-line)', backgroundColor: '#f8fafc', fontSize: '14px', outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
          />
        </EditModal>
      )}
    </>
  );
}