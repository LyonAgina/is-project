// @ts-nocheck
'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const STATUS_STYLES = {
  submitted: 'bg-gray-50 text-gray-600 border-[var(--color-line)]',
  under_review: 'bg-amber-50 text-amber-800 border-amber-200',
  accepted: 'bg-green-50 text-green-700 border-green-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
};

const STATUS_LABELS = {
  submitted: 'Submitted',
  under_review: 'Under review',
  accepted: 'Accepted',
  rejected: 'Rejected',
};

const DEFAULT_MESSAGES = {
  under_review: 'Your application is currently under review. We will get back to you soon.',
  accepted: 'Congratulations! Your application has been accepted.',
  rejected: 'Thank you for applying. Unfortunately, your application was not successful at this time.',
  submitted: 'Your application has been received.',
};

const GRADE_LABEL = {
  first_class: 'First Class',
  second_upper: 'Second Class Upper',
  second_lower: 'Second Class Lower',
  pass: 'Pass',
};

export default function Applicants() {
  const { id } = useParams();
  const [applicants, setApplicants] = useState([]);
  const [error, setError] = useState('');
  const [modal, setModal] = useState<null | { appId: number; status: string; name: string }>(null);
  const [notifMsg, setNotifMsg] = useState('');

  useEffect(() => { load(); }, [id]);

  const load = async () => {
    setError('');
    try {
      const res = await apiFetch('/api/organization/opportunities/' + id + '/applicants');
      const data = await res.json();
      if (!res.ok || !Array.isArray(data)) throw new Error(data.error || 'Failed to load applicants');
      setApplicants(data);
    } catch (err) {
      setError(err.message);
      setApplicants([]);
    }
  };

  const openModal = (appId: number, status: string, name: string) => {
    setModal({ appId, status, name });
    setNotifMsg(DEFAULT_MESSAGES[status] || '');
  };

  const confirmUpdate = async () => {
    if (!modal) return;
    await apiFetch('/api/organization/applications/' + modal.appId + '/status', {
      method: 'PUT',
      body: JSON.stringify({ status: modal.status, message: notifMsg }),
    });
    setModal(null);
    load();
  };

  return (
    <div>
      <h1 className="font-display text-2xl font-bold mb-6">Applicants</h1>
      {error && <p className="text-red-600 mb-4">{error}</p>}
      {!error && applicants.length === 0 && (
        <p className="text-[var(--color-muted)]">No applicants yet.</p>
      )}

      <div className="space-y-4">
        {applicants.map((a) => {
          const cvHref = a.cv_url ? (API_URL + a.cv_url) : null;
          const cvLabel = a.cv_filename || 'View CV';
          const scoreLabel = a.total_score != null ? Math.round(a.total_score) + '% match' : null;
          const gradeLabel = a.academic_grade ? GRADE_LABEL[a.academic_grade] : null;
          const statusClass = STATUS_STYLES[a.status] || STATUS_STYLES.submitted;
          const initials = (a.full_name || '?').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

          return (
            <div key={a.id} className="border border-[var(--color-line)] rounded-xl p-5">
              <div className="flex justify-between items-start mb-3">
                <div className="flex gap-3 items-start">
                  <div className="w-10 h-10 rounded-full bg-[var(--color-paper)] border border-[var(--color-line)] flex items-center justify-center text-sm font-semibold shrink-0">
                    {initials}
                  </div>
                  <div>
                    <p className="font-semibold">{a.full_name}</p>
                    <p className="text-sm text-[var(--color-muted)]">{a.email}</p>
                    <p className="text-sm text-[var(--color-muted)]">{a.institution || 'No institution set'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={'text-xs px-2 py-1 rounded-full border whitespace-nowrap ' + statusClass}>
                    {STATUS_LABELS[a.status] || a.status}
                  </span>
                  {scoreLabel && <p className="text-sm font-mono text-[var(--color-accent)] mt-2">{scoreLabel}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm text-[var(--color-muted)] border-t border-[var(--color-line)] pt-3 mb-3">
                <span>Education: {a.education_level || 'Not set'}</span>
                <span>Grade: {gradeLabel || 'Not set'}</span>
                <span>Experience: {a.experience_years != null ? a.experience_years + ' yrs' : 'Not set'}</span>
                <span>Location: {a.location || 'Not set'}</span>
              </div>

              {a.total_score != null && (
                <div className="grid grid-cols-2 gap-2 text-sm text-[var(--color-muted)] border-t border-[var(--color-line)] pt-3 mb-3">
                  <span className="font-medium text-[var(--color-ink)]">Similarity Score: {Math.round(a.text_similarity_score)}%</span>
                  <span>Skills: {Math.round(a.skills_score)}%</span>
                  <span>Education: {Math.round(a.education_score)}%</span>
                  <span>Location: {Math.round(a.location_score)}%</span>
                  <span>Experience: {Math.round(a.experience_score)}%</span>
                  <span>Interests: {Math.round(a.interest_score)}%</span>
                </div>
              )}

              <div className="flex justify-between items-center">
                {cvHref ? (
                  <a href={cvHref} target="_blank" className="text-sm underline text-[var(--color-ink)]">{cvLabel}</a>
                ) : (
                  <span className="text-sm text-[var(--color-muted)]">No CV uploaded</span>
                )}
                <select
                  value={a.status}
                  onChange={(e) => openModal(a.id, e.target.value, a.full_name)}
                  className="text-sm border border-[var(--color-line)] rounded-md p-1.5 bg-white"
                >
                  <option value="submitted">Submitted</option>
                  <option value="under_review">Under review</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
          );
        })}
      </div>

      {/* Notification modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl border border-[var(--color-line)] w-full max-w-md p-6 shadow-xl">
            <h2 className="font-semibold text-lg mb-1">Update status & notify</h2>
            <p className="text-sm text-[var(--color-muted)] mb-4">
              Changing <strong>{modal.name}</strong>'s status to <span className="capitalize font-medium">{STATUS_LABELS[modal.status]}</span>.
              They will receive the message below in their inbox.
            </p>
            <textarea
              value={notifMsg}
              onChange={(e) => setNotifMsg(e.target.value)}
              rows={4}
              className="w-full border border-[var(--color-line)] rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--color-ink)] mb-4"
              placeholder="Write a message to the applicant…"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setModal(null)}
                className="px-4 py-2 text-sm rounded-lg border border-[var(--color-line)] hover:bg-[var(--color-paper)]"
              >
                Cancel
              </button>
              <button
                onClick={confirmUpdate}
                className="px-4 py-2 text-sm rounded-lg bg-[var(--color-ink)] text-white font-medium hover:opacity-90"
              >
                Confirm & send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}