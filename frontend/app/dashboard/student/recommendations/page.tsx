// @ts-nocheck
'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';

export default function StudentRecommendations() {
  const [recs, setRecs] = useState([]);
  const [appliedIds, setAppliedIds] = useState(new Set());
  const [hasCv, setHasCv] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch('/api/student/recommendations');
      const data = await res.json();
      if (!res.ok || !Array.isArray(data)) throw new Error(data.error || 'Failed to load recommendations');
      setRecs(data);

      const appsRes = await apiFetch('/api/student/applications');
      const apps = await appsRes.json();
      if (appsRes.ok && Array.isArray(apps)) {
        setAppliedIds(new Set(apps.map((a) => a.opportunity_id).filter(Boolean)));
      }

      const profileRes = await apiFetch('/api/student/profile');
      const profileData = await profileRes.json();
      if (profileRes.ok) setHasCv(!!profileData.cv_url);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const apply = async (opportunityId) => {
    try {
      const res = await apiFetch('/api/student/applications', { method: 'POST', body: JSON.stringify({ opportunityId }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to apply');
      setAppliedIds((prev) => new Set([...prev, opportunityId]));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <h1 className="font-display text-2xl font-bold mb-2">Recommended for you</h1>
      <p className="text-[var(--color-muted)] mb-6">Ranked by how well each opportunity matches your profile.</p>
      {error && <p className="text-red-600 mb-4">{error}</p>}
      {!hasCv && (
        <div className="border border-[var(--color-accent)] bg-amber-50 text-amber-800 text-sm rounded-md p-3 mb-4">
          Upload your CV before applying. <Link href="/dashboard/student/profile" className="underline font-medium">Go to your profile</Link>.
        </div>
      )}
      {loading && <p className="text-[var(--color-muted)]">Scoring opportunities against your profile…</p>}
      {!loading && !error && recs.length === 0 && (
        <p className="text-[var(--color-muted)]">No active opportunities to score yet — check back once organizations post something.</p>
      )}

      <div className="space-y-4">
        {recs.map((r) => (
          <div key={r.id} className="border border-[var(--color-line)] rounded-xl p-5">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h2 className="font-semibold">{r.title}</h2>
                <p className="text-sm text-[var(--color-muted)]">{r.organization_name} · {r.category} · {r.location || 'Location not set'}</p>
              </div>
              <div className="text-right">
                <span className="font-mono text-2xl font-semibold text-[var(--color-accent)]">{Math.round(r.totalScore)}%</span>
                <p className="text-xs text-[var(--color-muted)]">match</p>
              </div>
            </div>

            <div className="grid grid-cols-5 gap-2 text-xs text-[var(--color-muted)] mb-4">
              <span>Skills {Math.round(r.skillsScore)}%</span>
              <span>Education {Math.round(r.eduScore)}%</span>
              <span>Location {Math.round(r.locScore)}%</span>
              <span>Experience {Math.round(r.expScore)}%</span>
              <span>Interests {Math.round(r.interestScore)}%</span>
            </div>

            <button
              onClick={() => apply(r.id)}
              disabled={appliedIds.has(r.id) || !hasCv}
              className="bg-[var(--color-ink)] text-white px-3 py-1.5 rounded-md text-sm disabled:opacity-40"
            >
              {appliedIds.has(r.id) ? 'Applied' : 'Apply'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}