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

  if (error && !opp) return <p style={{ color: '#dc2626', padding: '24px' }}>{error}</p>;
  if (!opp) return <p style={{ color: 'var(--color-muted)', padding: '24px' }}>Loading opportunity details…</p>;

  const skills = (opp.tags || []).filter((t) => t.type === 'skill');
  const interests = (opp.tags || []).filter((t) => t.type === 'interest');

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '64px' }}>
      
      {/* Back Navigation */}
      <Link 
        href="/dashboard/student/opportunities" 
        style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '500', color: '#1e3a8a', textDecoration: 'none', marginBottom: '24px' }}
      >
        <span>&larr;</span> Back to opportunities
      </Link>

      {/* Header Card */}
      <div style={{ backgroundColor: '#ffffff', padding: '32px', borderRadius: '16px', border: '1px solid var(--color-line)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '800', color: 'var(--color-ink)', margin: '0 0 12px 0', lineHeight: '1.2' }}>{opp.title}</h1>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '24px' }}>
          <span style={{ fontSize: '16px', fontWeight: '600', color: 'var(--color-ink)' }}>{opp.organization_name}</span>
          <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'var(--color-line)' }}></span>
          <span style={{ fontSize: '14px', color: 'var(--color-muted)', textTransform: 'capitalize' }}>{opp.category}</span>
          <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'var(--color-line)' }}></span>
          <span style={{ fontSize: '14px', color: 'var(--color-muted)' }}>{opp.location || 'Location not set'}</span>
        </div>

        {/* Action Area */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', paddingTop: '24px', borderTop: '1px solid var(--color-line)' }}>
          {applied ? (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600', color: '#065f46', backgroundColor: '#d1fae5', padding: '12px 24px', borderRadius: '999px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Application submitted
            </div>
          ) : (
            <button
              onClick={() => setShowForm(true)}
              disabled={!hasCv}
              style={{ 
                backgroundColor: hasCv ? '#1e3a8a' : '#e2e8f0', color: hasCv ? '#ffffff' : '#64748b', 
                padding: '12px 32px', borderRadius: '8px', fontSize: '15px', fontWeight: '600', border: 'none', 
                cursor: hasCv ? 'pointer' : 'not-allowed', transition: 'background-color 0.2s', boxShadow: hasCv ? '0 4px 6px -1px rgba(30, 58, 138, 0.2)' : 'none'
              }}
            >
              Apply for this opportunity
            </button>
          )}

          {!hasCv && !applied && (
            <div style={{ fontSize: '13px', color: '#b45309', backgroundColor: '#fffbeb', padding: '10px 16px', borderRadius: '8px', border: '1px solid #fde68a' }}>
              Upload your CV on your <Link href="/dashboard/student/profile" style={{ fontWeight: '600', color: '#b45309', textDecoration: 'underline' }}>profile</Link> before applying.
            </div>
          )}
        </div>
      </div>

      {/* Details Content */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        
        {opp.description && (
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--color-ink)', marginBottom: '16px' }}>Description</h2>
            <p style={{ fontSize: '15px', color: '#475569', lineHeight: '1.7', margin: 0, whiteSpace: 'pre-wrap' }}>
              {opp.description}
            </p>
          </div>
        )}

        <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '16px', border: '1px solid var(--color-line)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--color-ink)', marginBottom: '16px' }}>Requirements</h2>
          <ul style={{ margin: 0, padding: '0 0 0 20px', fontSize: '15px', color: '#475569', lineHeight: '2', listStyleType: 'disc' }}>
            <li><strong style={{ color: 'var(--color-ink)' }}>Education:</strong> {opp.min_education ? opp.min_education : 'Not specified'}</li>
            <li><strong style={{ color: 'var(--color-ink)' }}>Academic Grade:</strong> {opp.min_academic_grade ? GRADE_LABEL[opp.min_academic_grade] : 'Not specified'}</li>
            <li><strong style={{ color: 'var(--color-ink)' }}>Experience:</strong> {opp.min_experience > 0 ? opp.min_experience + ' years' : 'Not specified'}</li>
            {opp.deadline && <li><strong style={{ color: 'var(--color-ink)' }}>Deadline:</strong> {new Date(opp.deadline).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</li>}
          </ul>
        </div>

        {(skills.length > 0 || interests.length > 0) && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            {skills.length > 0 && (
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--color-ink)', marginBottom: '12px' }}>Required Skills</h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {skills.map((s) => (
                    <span key={s.id} style={{ fontSize: '13px', fontWeight: '500', padding: '6px 12px', borderRadius: '999px', backgroundColor: '#f1f5f9', color: '#334155', border: '1px solid var(--color-line)' }}>
                      {s.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {interests.length > 0 && (
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--color-ink)', marginBottom: '12px' }}>Valued Interests</h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {interests.map((s) => (
                    <span key={s.id} style={{ fontSize: '13px', fontWeight: '500', padding: '6px 12px', borderRadius: '999px', backgroundColor: '#f1f5f9', color: '#334155', border: '1px solid var(--color-line)' }}>
                      {s.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Apply Modal ── */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)' }} onClick={() => setShowForm(false)} />
          <div style={{ position: 'relative', backgroundColor: '#ffffff', border: '1px solid var(--color-line)', borderRadius: '16px', width: '100%', maxWidth: '500px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '24px', borderBottom: '1px solid var(--color-line)' }}>
              <div>
                <h2 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '700', color: 'var(--color-ink)' }}>Submit Application</h2>
                <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-muted)' }}>{opp.title} · {opp.organization_name}</p>
              </div>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)', padding: '4px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div style={{ padding: '24px' }}>
              {error && <p style={{ color: '#dc2626', fontSize: '14px', marginBottom: '16px' }}>{error}</p>}
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: 'var(--color-ink)', marginBottom: '8px' }}>
                Cover Note (Optional)
              </label>
              <textarea
                value={coverNote}
                onChange={(e) => setCoverNote(e.target.value)}
                placeholder="Briefly introduce yourself..."
                rows={4}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-line)', backgroundColor: '#f8fafc', fontSize: '14px', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }}
              />
            </div>
            
            <div style={{ padding: '16px 24px', backgroundColor: '#f8fafc', borderTop: '1px solid var(--color-line)', borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button 
                onClick={() => setShowForm(false)} 
                style={{ padding: '10px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', backgroundColor: 'transparent', color: 'var(--color-ink)', border: '1px solid var(--color-line)', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                onClick={submitApplication} 
                disabled={submitting} 
                style={{ padding: '10px 24px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', backgroundColor: '#1e3a8a', color: '#ffffff', border: 'none', cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1 }}
              >
                {submitting ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}