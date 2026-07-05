// @ts-nocheck
'use client';
import { useState, useEffect } from 'react';
import ProfileCard from './ProfileCard';
import EditModal from './EditModal';
import { apiFetch } from '@/lib/api';

const TYPE_LABELS = {
  company: 'Company',
  university: 'University',
  ngo: 'NGO',
  government: 'Government',
};

const STATUS_STYLES = {
  verified: { bg: '#f0fdf4', fg: '#15803d', border: '#bbf7d0' },
  pending: { bg: '#fffbeb', fg: '#92400e', border: '#fde68a' },
  rejected: { bg: '#fef2f2', fg: '#b91c1c', border: '#fecaca' },
};

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.pending;
  return (
    <span
      className="inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full capitalize"
      style={{ background: s.bg, color: s.fg, border: `1px solid ${s.border}` }}
    >
      {status || 'pending'}
    </span>
  );
}

export default function OrganizationProfile() {
  const [form, setForm] = useState({ name: '', type: 'company', description: '', website: '', location: '' });
  const [status, setStatus] = useState('');
  const [loaded, setLoaded] = useState(false);

  const [headerOpen, setHeaderOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [draft, setDraft] = useState(form);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiFetch('/api/organization/profile').then((r) => r.json()).then((data) => {
      const loadedForm = {
        name: data.name || '',
        type: data.type || 'company',
        description: data.description || '',
        website: data.website || '',
        location: data.location || '',
      };
      setForm(loadedForm);
      setStatus(data.verification_status);
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, []);

  const openModal = (setter) => {
    setDraft(form);
    setter(true);
  };

  const save = async (closeFn) => {
    setSaving(true);
    const res = await apiFetch('/api/organization/profile', { method: 'PUT', body: JSON.stringify(draft) });
    setSaving(false);
    if (res.ok) {
      setForm(draft);
      closeFn(false);
    }
  };

  if (!loaded) return null;

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header card: name, type, verification */}
      <ProfileCard onEdit={() => openModal(setHeaderOpen)}>
        <div className="flex items-start justify-between">
          <div>
            <p className="font-semibold text-lg leading-tight">{form.name || 'Unnamed organization'}</p>
            <p className="text-sm mt-1" style={{ color: '#6b7280' }}>{TYPE_LABELS[form.type] || form.type}</p>
          </div>
          <StatusBadge status={status} />
        </div>
      </ProfileCard>

      {headerOpen && (
        <EditModal title="Edit organization details" onClose={() => setHeaderOpen(false)} onSave={() => save(setHeaderOpen)} saving={saving}>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider">Organization name</label>
            <input
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder="e.g. University of Nairobi"
              className="w-full bg-transparent border border-[var(--color-line)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-ink)]"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider">Type</label>
            <select
              value={draft.type}
              onChange={(e) => setDraft({ ...draft, type: e.target.value })}
              className="w-full bg-[var(--color-surface)] border border-[var(--color-line)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-ink)]"
            >
              <option value="company">Company</option>
              <option value="university">University</option>
              <option value="ngo">NGO</option>
              <option value="government">Government</option>
            </select>
          </div>
        </EditModal>
      )}

      {/* About card */}
      <ProfileCard title="About" onEdit={() => openModal(setAboutOpen)}>
        {form.description ? (
          <p className="text-sm leading-relaxed">{form.description}</p>
        ) : (
          <p className="text-sm italic text-[var(--color-muted)]">Add a description of your organization.</p>
        )}
      </ProfileCard>

      {aboutOpen && (
        <EditModal title="Edit about" onClose={() => setAboutOpen(false)} onSave={() => save(setAboutOpen)} saving={saving}>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider">Description</label>
            <textarea
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              placeholder="Tell students about your organization…"
              rows={4}
              className="w-full bg-transparent border border-[var(--color-line)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-ink)] resize-none"
            />
          </div>
        </EditModal>
      )}

      {/* Contact card */}
      <ProfileCard title="Contact" onEdit={() => openModal(setContactOpen)}>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#eff6ff' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
            </div>
            {form.website ? (
              <a href={form.website} target="_blank" rel="noopener noreferrer" className="text-sm hover:underline" style={{ color: '#1d4ed8' }}>
                {form.website}
              </a>
            ) : (
              <p className="text-sm italic" style={{ color: '#9ca3af' }}>No website set</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#f0fdf4' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </div>
            {form.location ? (
              <p className="text-sm">{form.location}</p>
            ) : (
              <p className="text-sm italic" style={{ color: '#9ca3af' }}>No location set</p>
            )}
          </div>
        </div>
      </ProfileCard>

      {contactOpen && (
        <EditModal title="Edit contact info" onClose={() => setContactOpen(false)} onSave={() => save(setContactOpen)} saving={saving}>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider">Website</label>
            <input
              value={draft.website}
              onChange={(e) => setDraft({ ...draft, website: e.target.value })}
              placeholder="https://example.com"
              className="w-full bg-transparent border border-[var(--color-line)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-ink)]"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider">Location</label>
            <input
              value={draft.location}
              onChange={(e) => setDraft({ ...draft, location: e.target.value })}
              placeholder="e.g. Nairobi, Kenya"
              className="w-full bg-transparent border border-[var(--color-line)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-ink)]"
            />
          </div>
        </EditModal>
      )}
    </div>
  );
}