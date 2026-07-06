// @ts-nocheck
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import TagPicker from '@/components/TagPicker';

export default function CreateOpportunity() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: '', category: 'job', description: '', minEducation: 'undergraduate',
    minAcademicGrade: '', minExperience: 0, location: '', deadline: '', minimumMatchScore: ''
  });
  const [tagIds, setTagIds] = useState([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    const res = await apiFetch('/api/organization/opportunities', { method: 'POST', body: JSON.stringify({ ...form, tagIds }) });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error || 'Failed to post opportunity');
      return;
    }
    router.push('/dashboard/organization/opportunities');
  };

  const inputStyle = { width: '100%', borderRadius: '12px', border: '1px solid var(--color-line)', backgroundColor: '#ffffff', color: 'var(--color-ink)', padding: '12px 16px', fontSize: '14px', fontWeight: '500', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' };
  const labelStyle = { fontSize: '11px', fontWeight: '700', color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '40px' }}>
      <h1 style={{ fontSize: '28px', fontWeight: '700', color: 'var(--color-ink)', margin: '0 0 8px 0' }}>Create an opportunity</h1>
      
      <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--color-line)', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div>
            <label style={labelStyle}>Opportunity Title</label>
            <input name="title" value={form.title} onChange={handleChange} placeholder="e.g. Software Engineering Graduate Trainee" style={inputStyle} required />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label style={labelStyle}>Category</label>
              <select name="category" value={form.category} onChange={handleChange} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="job">Job</option>
                <option value="internship">Internship</option>
                <option value="scholarship">Scholarship</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Location</label>
              <input name="location" value={form.location} onChange={handleChange} placeholder="e.g. Nairobi, Remote" style={inputStyle} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} placeholder="Describe the responsibilities and requirements..." style={{ ...inputStyle, minHeight: '140px', resize: 'vertical' }} required />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', paddingTop: '16px', borderTop: '1px solid var(--color-line)' }}>
            <div>
              <label style={labelStyle}>Minimum Education</label>
              <select name="minEducation" value={form.minEducation} onChange={handleChange} style={inputStyle}>
                <option value="certificate">Certificate</option>
                <option value="diploma">Diploma</option>
                <option value="undergraduate">Undergraduate</option>
                <option value="graduate">Graduate</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Minimum Grade</label>
              <select name="minAcademicGrade" value={form.minAcademicGrade} onChange={handleChange} style={inputStyle}>
                <option value="">No minimum grade required</option>
                <option value="first_class">First Class</option>
                <option value="second_upper">Second Class Upper</option>
                <option value="second_lower">Second Class Lower</option>
                <option value="pass">Pass</option> 
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label style={labelStyle}>Min Experience (Years)</label>
              <input name="minExperience" type="number" step="0.5" value={form.minExperience} onChange={handleChange} placeholder="e.g. 2" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Minimum Match Score %</label>
              <input name="minimumMatchScore" type="number" min="0" max="100" value={form.minimumMatchScore} onChange={handleChange} placeholder="e.g. 60" style={inputStyle} />
            </div>
          </div>

          <div style={{ paddingTop: '16px', borderTop: '1px solid var(--color-line)' }}>
            <label style={labelStyle}>Required Skills / Tags</label>
            <TagPicker selectedIds={tagIds} onChange={setTagIds} />
          </div>

          {error && (
            <div style={{ padding: '16px', backgroundColor: 'rgba(220, 38, 38, 0.05)', border: '1px solid rgba(220, 38, 38, 0.2)', borderRadius: '12px' }}>
              <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: '#dc2626' }}>{error}</p>
            </div>
          )}
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '16px' }}>
            <button type="submit" disabled={saving} style={{ backgroundColor: '#1e3a8a', color: '#ffffff', fontWeight: '600', padding: '14px 32px', borderRadius: '12px', border: 'none', fontSize: '14px', cursor: 'pointer', transition: 'opacity 0.2s', opacity: saving ? 0.6 : 1, boxShadow: '0 4px 6px -1px rgba(30, 58, 138, 0.2)' }}>
              {saving ? 'Posting...' : 'Post opportunity'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}