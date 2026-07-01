// @ts-nocheck
'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';

const GRADE_LABEL = { first_class: 'First Class', second_upper: 'Second Class Upper', second_lower: 'Second Class Lower', pass: 'Pass' };

export default function OpportunityDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [opp, setOpp] = useState(null);
  const [hasCv, setHasCv] = useState(true);
  const [applied, setApplied] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [coverNote, setCoverNote] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    load();
  }, [id]);

  const load = async () => {
    setError('');
    try {
      const res = await apiFetch('/api/student/opportunities/' + id);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load opportunity');
      setOpp(data);

      const profileRes = await apiFetch('/api/student/profile');
      const profileData = await profileRes.json();
      if (profileRes.ok) setHasCv(!!profileData.cv_url);

      const appsRes = await apiFetch('/api/student/applications');
      const apps = await appsRes.json();
      if (appsRes.ok && Array.isArray(apps)) {
        setApplied(apps.some((a) => a.opportunity_id === Number(id) || a.title === data.title));
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const submitApplication = async () => {
    setSubmitting(true);
    setError('');
    try {
      const res = await apiFetch('/api/student/applications', {
        method: 'POST',
        body: JSON.stringify({ opportunityId: Number(id), coverNote }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to apply');
      setApplied(true);
      setShowForm(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (error && !opp) return <p className="text-red-600">{error}</p>;
  if (!opp) return <p className="text-[var(--color-muted)]">Loading…</p>;

  const skills = (opp.tags || []).filter((t) => t.type === 'skill');
  const interests = (opp.tags || []).filter((t) => t.type === 'interest');

  return (
    <div className="max-w-2xl">
      <Link href="/dashboard/student/opportunities" className="text-sm text-[var(--color-muted)] underline">&larr; Back to opportunities</Link>

      <h1 className="font-display text-2xl font-bold mt-4 mb-1">{opp.title}</h1>
      <p className="text-[var(--color-muted)] mb-6">{opp.organization_name} · {opp.category} · {opp.location || 'Location not set'}</p>

      {opp.description && (
        <div className="mb-6">
          <h2 className="font-semibold mb-2">Description</h2>
          <p className="text-sm">{opp.description}</p>
        </div>
      )}

      <div className="mb-6">
        <h2 className="font-semibold mb-2">Requirements</h2>
        <ul className="text-sm space-y-1 text-[var(--color-muted)]">
          <li>Minimum education: {opp.min_education ? opp.min_education : 'Not specified'}</li>
          <li>Minimum grade: {opp.min_academic_grade ? GRADE_LABEL[opp.min_academic_grade] : 'Not specified'}</li>
          <li>Minimum experience: {opp.min_experience > 0 ? opp.min_experience + ' years' : 'Not specified'}</li>
          {opp.deadline && <li>Deadline: {new Date(opp.deadline).toLocaleDateString()}</li>}
        </ul>
      </div>

      {skills.length > 0 && (
        <div className="mb-6">
          <h2 className="font-semibold mb-2">Skills required</h2>
          <div className="flex flex-wrap gap-2">
            {skills.map((s) => (
              <span key={s.id} className="text-xs px-2 py-1 rounded-full border border-[var(--color-line)]">{s.name}</span>
            ))}
          </div>
        </div>
      )}

      {interests.length > 0 && (
        <div className="mb-6">
          <h2 className="font-semibold mb-2">Interests valued</h2>
          <div className="flex flex-wrap gap-2">
            {interests.map((s) => (
              <span key={s.id} className="text-xs px-2 py-1 rounded-full border border-[var(--color-line)]">{s.name}</span>
            ))}
          </div>
        </div>
      )}

      {!hasCv && (
        <div className="border border-[var(--color-accent)] bg-amber-50 text-amber-800 text-sm rounded-md p-3 mb-4">
          Upload your CV before applying. <Link href="/dashboard/student/profile" className="underline font-medium">Go to your profile</Link>.
        </div>
      )}

      {/* Apply / Applied state */}
      {applied ? (
        <div className="inline-flex items-center gap-2 text-sm font-medium text-green-700 bg-green-50 border border-green-200 px-4 py-2 rounded-full">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Application submitted
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          disabled={!hasCv}
          className="bg-[var(--color-ink)] text-white px-5 py-2.5 rounded-lg font-medium text-sm disabled:opacity-40 hover:opacity-90 transition-opacity"
        >
          Apply for this opportunity
        </button>
      )}

      {/* ── Apply modal ── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative bg-[var(--color-surface)] border border-[var(--color-line)] rounded-2xl w-full max-w-lg shadow-2xl">
            {/* Header */}
            <div className="flex items-start justify-between px-6 py-5 border-b border-[var(--color-line)]">
              <div>
                <h2 className="font-semibold text-base">Apply for this opportunity</h2>
                <p className="text-sm text-[var(--color-muted)] mt-0.5">{opp.title} · {opp.organization_name}</p>
              </div>
              <button
                onClick={() => setShowForm(false)}
                className="text-[var(--color-muted)] hover:text-[var(--color-ink)] w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[var(--color-line)] transition-colors ml-4 shrink-0"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium block">
                  Why are you a good fit?
                  <span className="text-[var(--color-muted)] font-normal ml-1">(required)</span>
                </label>
                <p className="text-xs text-[var(--color-muted)]">
                  Briefly introduce yourself and explain what makes you a strong candidate for this role.
                </p>
                <textarea
                  value={coverNote}
                  onChange={(e) => setCoverNote(e.target.value)}
                  placeholder="e.g. I am a third-year Computer Science student with experience in data analysis. I'm particularly drawn to this opportunity because…"
                  rows={5}
                  className="w-full border border-[var(--color-line)] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--color-ink)] resize-none mt-2"
                />
                <p className={`text-xs text-right ${coverNote.trim().length > 0 && coverNote.trim().length < 30 ? 'text-amber-600' : 'text-[var(--color-muted)]'}`}>
                  {coverNote.trim().length} / 500 {coverNote.trim().length < 30 && coverNote.trim().length > 0 ? '— add a bit more' : ''}
                </p>
              </div>
              {error && <p className="text-red-600 text-sm">{error}</p>}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--color-line)]">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm rounded-lg border border-[var(--color-line)] text-[var(--color-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-line)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitApplication}
                disabled={submitting || coverNote.trim().length < 30}
                className="px-5 py-2 text-sm rounded-lg bg-[var(--color-ink)] text-white hover:opacity-90 transition-opacity disabled:opacity-40 font-medium"
              >
                {submitting ? 'Submitting…' : 'Submit application'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}