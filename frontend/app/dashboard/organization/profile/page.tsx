// @ts-nocheck
'use client';
import { useState, useEffect, Dispatch, SetStateAction } from 'react';
import ProfileCard from './ProfileCard';
import EditModal from './EditModal';
import { apiFetch } from '@/lib/api';

type OrgType = 'company' | 'university' | 'ngo' | 'government';

interface OrgForm {
  name: string;
  type: OrgType;
  description: string;
  website: string;
  location: string;
}

const TYPE_LABELS: Record<OrgType, string> = {
  company: 'Company',
  university: 'University',
  ngo: 'NGO',
  government: 'Government',
};

function StatusBadge({ status }: { status?: string }) {
  const isVerified = status === 'verified';
  return (
    <span style={{
      fontSize: '12px', fontWeight: '700', padding: '4px 10px', borderRadius: '6px', textTransform: 'capitalize',
      backgroundColor: isVerified ? '#f0fdf4' : '#fffbeb',
      color: isVerified ? '#15803d' : '#b45309',
      border: `1px solid ${isVerified ? '#bbf7d0' : '#fde68a'}`
    }}>
      {status || 'pending'}
    </span>
  );
}

export default function OrganizationProfile() {
  const [form, setForm] = useState<OrgForm>({ name: '', type: 'company', description: '', website: '', location: '' });
  const [status, setStatus] = useState<string>('');
  const [loaded, setLoaded] = useState(false);

  const [headerOpen, setHeaderOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [draft, setDraft] = useState<OrgForm>(form);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiFetch('/api/organization/profile').then((r) => r.json()).then((data) => {
      setForm({
        name: data.name || '',
        type: (data.type || 'company') as OrgType,
        description: data.description || '',
        website: data.website || '',
        location: data.location || '',
      });
      setStatus(data.verification_status);
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, []);

  const openModal = (setter: Dispatch<SetStateAction<boolean>>) => { setDraft(form); setter(true); };

  const save = async (closeFn: Dispatch<SetStateAction<boolean>>) => {
    setSaving(true);
    const res = await apiFetch('/api/organization/profile', { method: 'PUT', body: JSON.stringify(draft) });
    setSaving(false);
    if (res.ok) { setForm(draft); closeFn(false); }
  };

  if (!loaded) return null;

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px solid var(--color-line)',
    fontSize: '14px',
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>

      {/* Header Info */}
      <ProfileCard onEdit={() => openModal(setHeaderOpen)}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '700', color: 'var(--color-ink)', margin: '0 0 8px 0' }}>{form.name || 'Unnamed organization'}</h1>
            <p style={{ fontSize: '15px', color: 'var(--color-muted)', fontWeight: '500', margin: 0 }}>{TYPE_LABELS[form.type] || form.type}</p>
          </div>
          <StatusBadge status={status} />
        </div>
      </ProfileCard>

      {/* About Box */}
      <ProfileCard title="About Organization" onEdit={() => openModal(setAboutOpen)}>
        {form.description ? (
          <p style={{ fontSize: '15px', color: 'var(--color-ink)', lineHeight: '1.6', margin: 0, fontWeight: '500' }}>{form.description}</p>
        ) : (
          <p style={{ fontSize: '14px', color: 'var(--color-muted)', fontStyle: 'italic', margin: 0 }}>Add a description of your organization.</p>
        )}
      </ProfileCard>

      {/* Contact Box */}
      <ProfileCard title="Contact Details" onEdit={() => openModal(setContactOpen)}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'var(--color-paper)', border: '1px solid var(--color-line)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1e3a8a' }}>
               <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
            </div>
            {form.website ? <a href={form.website} target="_blank" style={{ fontSize: '15px', fontWeight: '600', color: '#1e3a8a', textDecoration: 'none' }}>{form.website}</a> : <span style={{ color: 'var(--color-muted)' }}>No website set</span>}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'var(--color-paper)', border: '1px solid var(--color-line)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1e3a8a' }}>
               <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
            </div>
            {form.location ? <span style={{ fontSize: '15px', fontWeight: '500', color: 'var(--color-ink)' }}>{form.location}</span> : <span style={{ color: 'var(--color-muted)' }}>No location set</span>}
          </div>
        </div>
      </ProfileCard>

      {/* Edit Header Modal */}
      {headerOpen && (
        <EditModal
          title="Edit Organization Info"
          onClose={setHeaderOpen}
          onSave={() => save(setHeaderOpen)}
          saving={saving}
        >
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: 'var(--color-ink)' }}>
              Organization Name
            </label>
            <input
              type="text"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: 'var(--color-ink)' }}>
              Type
            </label>
            <select
              value={draft.type}
              onChange={(e) => setDraft({ ...draft, type: e.target.value as OrgType })}
              style={inputStyle}
            >
              <option value="company">Company</option>
              <option value="university">University</option>
              <option value="ngo">NGO</option>
              <option value="government">Government</option>
            </select>
          </div>
        </EditModal>
      )}

      {/* Edit About Modal */}
      {aboutOpen && (
        <EditModal
          title="Edit About"
          onClose={setAboutOpen}
          onSave={() => save(setAboutOpen)}
          saving={saving}
        >
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: 'var(--color-ink)' }}>
              Description
            </label>
            <textarea
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              rows={5}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>
        </EditModal>
      )}

      {/* Edit Contact Modal */}
      {contactOpen && (
        <EditModal
          title="Edit Contact Details"
          onClose={setContactOpen}
          onSave={() => save(setContactOpen)}
          saving={saving}
        >
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: 'var(--color-ink)' }}>
              Website
            </label>
            <input
              type="text"
              value={draft.website}
              onChange={(e) => setDraft({ ...draft, website: e.target.value })}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: 'var(--color-ink)' }}>
              Location
            </label>
            <input
              type="text"
              value={draft.location}
              onChange={(e) => setDraft({ ...draft, location: e.target.value })}
              style={inputStyle}
            />
          </div>
        </EditModal>
      )}
    </div>
  );
}