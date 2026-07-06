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

  // Helper to render mini progress bars
  const MetricBar = ({ label, score }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
        <span style={{ fontWeight: '500', color: 'var(--color-muted)' }}>{label}</span>
        <span style={{ fontWeight: '700', color: 'var(--color-ink)' }}>{Math.round(score)}%</span>
      </div>
      <div style={{ width: '100%', height: '6px', backgroundColor: '#f1f5f9', borderRadius: '999px', overflow: 'hidden' }}>
        <div style={{ width: `${Math.round(score)}%`, height: '100%', backgroundColor: '#1e3a8a', borderRadius: '999px', transition: 'width 1s ease-out' }} />
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: '900px' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: 'var(--color-ink)', margin: '0 0 8px 0' }}>Recommended for you</h1>
        <p style={{ margin: 0, color: 'var(--color-muted)' }}>Ranked by how well each opportunity matches your profile.</p>
      </div>

      {/* Warnings & States */}
      {error && (
        <div style={{ padding: '16px', borderRadius: '12px', border: '1px solid #fecaca', backgroundColor: '#fef2f2', color: '#b91c1c', marginBottom: '24px', fontSize: '14px' }}>
          {error}
        </div>
      )}
      
      {!hasCv && (
        <div style={{ fontSize: '14px', color: '#b45309', backgroundColor: '#fffbeb', padding: '16px', borderRadius: '12px', border: '1px solid #fde68a', marginBottom: '24px' }}>
          Upload your CV before applying. <Link href="/dashboard/student/profile" style={{ fontWeight: '600', color: '#b45309', textDecoration: 'underline' }}>Go to your profile</Link>.
        </div>
      )}

      {loading && (
        <div style={{ padding: '48px', textAlign: 'center', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid var(--color-line)' }}>
          <p style={{ fontSize: '15px', color: 'var(--color-muted)', fontWeight: '500' }}>Scoring opportunities against your profile…</p>
        </div>
      )}

      {!loading && !error && recs.length === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 24px', textAlign: 'center', borderRadius: '16px', border: '2px dashed var(--color-line)' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <p style={{ fontWeight: '600', fontSize: '16px', color: 'var(--color-ink)', margin: '0 0 4px 0' }}>No active opportunities to score yet</p>
          <p style={{ fontSize: '14px', color: 'var(--color-muted)', margin: 0 }}>Check back once organizations post something.</p>
        </div>
      )}

      {/* Recommendations List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {recs.map((r) => {
          const detailHref = `/dashboard/student/opportunities/${r.id}`;
          const isApplied = appliedIds.has(r.id);

          return (
            <div key={r.id} style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid var(--color-line)', padding: '32px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
              
              {/* Card Header (Title & Total Score) */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '24px', flexWrap: 'wrap', marginBottom: '32px' }}>
                <div style={{ flex: '1 1 300px' }}>
                  <Link href={detailHref} style={{ textDecoration: 'none' }}>
                    <h2 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--color-ink)', margin: '0 0 8px 0' }} onMouseOver={(e) => e.target.style.textDecoration = 'underline'} onMouseOut={(e) => e.target.style.textDecoration = 'none'}>
                      {r.title}
                    </h2>
                  </Link>
                  <p style={{ fontSize: '14px', color: 'var(--color-muted)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: '500' }}>{r.organization_name}</span>
                    <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'var(--color-line)' }}></span>
                    <span style={{ textTransform: 'capitalize' }}>{r.category}</span>
                    <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'var(--color-line)' }}></span>
                    <span>{r.location || 'Location not set'}</span>
                  </p>
                </div>

                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', backgroundColor: '#fdf7ec', padding: '12px 20px', borderRadius: '12px', border: '1px solid #fde68a' }}>
                  <span style={{ fontSize: '32px', fontWeight: '800', color: 'var(--color-accent)', lineHeight: '1' }}>
                    {Math.round(r.totalScore)}%
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '4px' }}>
                    Overall Match
                  </span>
                </div>
              </div>

              {/* Metrics Grid with Visual Bars */}
              <div style={{ backgroundColor: '#f8fafc', padding: '24px', borderRadius: '12px', border: '1px solid var(--color-line)', marginBottom: '32px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-ink)', margin: '0 0 16px 0' }}>Match Breakdown</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '24px' }}>
                  <MetricBar label="AI Similarity" score={r.textScore} />
                  <MetricBar label="Skills" score={r.skillsScore} />
                  <MetricBar label="Education" score={r.eduScore} />
                  <MetricBar label="Location" score={r.locScore} />
                  <MetricBar label="Experience" score={r.expScore} />
                  <MetricBar label="Interests" score={r.interestScore} />
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <button
                  onClick={() => apply(r.id)}
                  disabled={isApplied || !hasCv}
                  style={{ 
                    padding: '10px 24px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', 
                    backgroundColor: isApplied ? '#e2e8f0' : '#1e3a8a', 
                    color: isApplied ? '#64748b' : '#ffffff', 
                    border: 'none', cursor: (isApplied || !hasCv) ? 'not-allowed' : 'pointer', transition: 'background-color 0.2s'
                  }}
                >
                  {isApplied ? 'Applied' : 'Apply Now'}
                </button>
                <Link href={detailHref} style={{ fontSize: '14px', fontWeight: '500', color: '#1e3a8a', textDecoration: 'none' }}>
                  View details &rarr;
                </Link>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}