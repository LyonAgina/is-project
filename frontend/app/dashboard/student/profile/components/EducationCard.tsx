// @ts-nocheck
'use client';
import { useState } from 'react';
import ProfileCard from './ProfileCard';
import EditModal from './EditModal';
import { apiFetch } from '@/lib/api';

const GRADE_LABELS = { first_class: 'First Class', second_upper: 'Second Class Upper', second_lower: 'Second Class Lower', pass: 'Pass' };

export default function EducationCard({ data, onSaved }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({
    institution: data.institution,
    course_of_study: data.courseOfStudy,
    education_level: data.educationLevel,
    academic_grade: data.academicGrade
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const res = await apiFetch('/api/student/profile', { method: 'PUT', body: JSON.stringify(draft) });
    setSaving(false);
    if (res.ok) { 
      onSaved({ institution: draft.institution, courseOfStudy: draft.course_of_study, educationLevel: draft.education_level, academicGrade: draft.academic_grade }); 
      setOpen(false); 
    }
  };

  return (
    <>
      <ProfileCard title="Education" onEdit={() => { setDraft({ institution: data.institution, course_of_study: data.courseOfStudy, education_level: data.educationLevel, academic_grade: data.academicGrade }); setOpen(true); }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1e3a8a" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>
          </div>
          <div>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '700' }}>{data.institution}</h3>
            <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>{data.courseOfStudy} · {data.educationLevel}</p>
            {data.academicGrade && (
              <span style={{ display: 'inline-block', marginTop: '8px', fontSize: '12px', fontWeight: '700', padding: '4px 10px', backgroundColor: '#f1f5f9', color: '#1e3a8a', borderRadius: '6px' }}>
                {GRADE_LABELS[data.academicGrade] || data.academicGrade}
              </span>
            )}
          </div>
        </div>
      </ProfileCard>

      {open && (
        <EditModal title="Edit Education" onClose={() => setOpen(false)} onSave={handleSave} saving={saving}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <input value={draft.institution} onChange={(e) => setDraft({...draft, institution: e.target.value})} placeholder="Institution" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }} />
            <input value={draft.course_of_study} onChange={(e) => setDraft({...draft, course_of_study: e.target.value})} placeholder="Course of Study" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }} />
            <select value={draft.academic_grade} onChange={(e) => setDraft({...draft, academic_grade: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}>
              <option value="first_class">First Class</option>
              <option value="second_upper">Second Class Upper</option>
              <option value="second_lower">Second Class Lower</option>
              <option value="pass">Pass</option>
            </select>
            <select value={draft.education_level} onChange={(e) => setDraft({...draft, education_level: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}>
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