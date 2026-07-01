'use client';
import { useState } from 'react';
import ProfileCard from './ProfileCard';
import EditModal from './EditModal';
import { apiFetch } from '@/lib/api';

const LEVEL_LABELS: Record<string, string> = {
  certificate: 'Certificate',
  diploma: 'Diploma',
  undergraduate: 'Undergraduate',
  graduate: 'Graduate',
};

const GRADE_LABELS: Record<string, string> = {
  first_class: 'First Class',
  second_upper: 'Second Class Upper',
  second_lower: 'Second Class Lower',
  pass: 'Pass',
};

interface EducationData {
  institution: string;
  courseOfStudy: string;
  educationLevel: string;
  academicGrade: string;
}

interface EducationCardProps {
  data: EducationData;
  onSaved: (patch: Partial<EducationData>) => void;
}

function Badge({ label, variant = 'default' }: { label: string; variant?: 'default' | 'green' }) {
  const base = 'inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full';
  const colors = variant === 'green'
    ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-800/40'
    : 'bg-[var(--color-line)] text-[var(--color-muted)] border border-[var(--color-line)]';
  return <span className={`${base} ${colors}`}>{label}</span>;
}

export default function EducationCard({ data, onSaved }: EducationCardProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(data);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const res = await apiFetch('/api/student/profile', {
      method: 'PUT',
      body: JSON.stringify(draft),
    });
    setSaving(false);
    if (res.ok) { onSaved(draft); setOpen(false); }
  };

  const hasData = data.institution || data.courseOfStudy || data.educationLevel;

  return (
    <>
      <ProfileCard title="Education" onEdit={() => { setDraft(data); setOpen(true); }}>
        {hasData ? (
          <div className="flex gap-4 items-start">
            {/* Icon */}
            <div className="w-11 h-11 rounded-lg bg-[#1a3a5c] flex items-center justify-center shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c3.3 2 8.7 2 12 0v-5" />
              </svg>
            </div>
            <div className="min-w-0 space-y-2">
              <div>
                <p className="font-semibold text-sm leading-tight">{data.institution || '—'}</p>
                {data.courseOfStudy && (
                  <p className="text-sm text-[var(--color-muted)] mt-0.5">{data.courseOfStudy}</p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {data.educationLevel && <Badge label={LEVEL_LABELS[data.educationLevel] ?? data.educationLevel} />}
                {data.academicGrade && <Badge label={GRADE_LABELS[data.academicGrade] ?? data.academicGrade} variant="green" />}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm italic text-[var(--color-muted)]">Add your education details.</p>
        )}
      </ProfileCard>

      {open && (
        <EditModal title="Edit education" onClose={() => setOpen(false)} onSave={handleSave} saving={saving}>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider">Institution</label>
            <input
              value={draft.institution}
              onChange={(e) => setDraft({ ...draft, institution: e.target.value })}
              placeholder="e.g. University of Nairobi"
              className="w-full bg-transparent border border-[var(--color-line)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-ink)]"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider">Course of study</label>
            <input
              value={draft.courseOfStudy}
              onChange={(e) => setDraft({ ...draft, courseOfStudy: e.target.value })}
              placeholder="e.g. Bachelor of Science in Computer Science"
              className="w-full bg-transparent border border-[var(--color-line)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-ink)]"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider">Level</label>
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
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider">Grade</label>
              <select
                value={draft.academicGrade}
                onChange={(e) => setDraft({ ...draft, academicGrade: e.target.value })}
                className="w-full bg-[var(--color-surface)] border border-[var(--color-line)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-ink)]"
              >
                <option value="">— optional —</option>
                <option value="first_class">First Class</option>
                <option value="second_upper">Second Class Upper</option>
                <option value="second_lower">Second Class Lower</option>
                <option value="pass">Pass</option>
              </select>
            </div>
          </div>
        </EditModal>
      )}
    </>
  );
}
