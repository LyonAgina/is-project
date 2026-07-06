// @ts-nocheck
'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const GRADE_LABEL = { first_class: 'First Class', second_upper: 'Second Class Upper', second_lower: 'Second Class Lower', pass: 'Pass' };

function ScoreBar({ label, value, color }) {
  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px', fontWeight: '600' }}>
        <span style={{ color: 'var(--color-muted)' }}>{label}</span>
        <span style={{ color: color }}>{Math.round(value || 0)}%</span>
      </div>
      <div style={{ width: '100%', height: '6px', borderRadius: '999px', backgroundColor: 'var(--color-paper)' }}>
        <div style={{ height: '6px', borderRadius: '999px', width: `${Math.min(100, value || 0)}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

export default function CompareApplicants() {
  const { id } = useParams();
  const router = useRouter();
  const [applicants, setApplicants] = useState([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [error, setError] = useState('');

  useEffect(() => { load(); }, [id]);

  const load = async () => {
    try {
      const res = await apiFetch('/api/organization/opportunities/' + id + '/applicants');
      const data = await res.json();
      if (!res.ok || !Array.isArray(data)) throw new Error(data.error || 'Failed to load applicants');
      setApplicants(data);
      setSelected(data.slice(0, 3).map((a) => a.id));
    } catch (err) { setError(err.message); }
  };

  const toggleSelect = (appId: number) => {
    setSelected((prev) => {
      if (prev.includes(appId)) return prev.filter((id) => id !== appId);
      if (prev.length >= 4) return prev;
      return [...prev, appId];
    });
  };

  const compared = applicants.filter((a) => selected.includes(a.id));

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '40px' }}>
      <button onClick={() => router.back()} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: '14px', fontWeight: '600', color: 'var(--color-muted)', marginBottom: '24px' }}>
        &larr; Back to applicants
      </button>
      <h1 style={{ fontFamily: 'var(--font-disp)', fontSize: '28px', fontWeight: '700', color: 'var(--color-ink)', marginBottom: '8px' }}>Compare applicants</h1>
      <p style={{ fontSize: '14px', color: 'var(--color-muted)', fontWeight: '500', marginBottom: '32px' }}>Select up to 4 applicants to compare side by side.</p>

      {error && <div style={{ padding: '16px', backgroundColor: 'rgba(220,38,38,0.05)', borderRadius: '12px', border: '1px solid rgba(220,38,38,0.2)', color: '#dc2626', fontWeight: '600', marginBottom: '24px' }}>{error}</div>}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '40px' }}>
        {applicants.map((a) => {
          const isSelected = selected.includes(a.id);
          return (
            <button
              key={a.id}
              onClick={() => toggleSelect(a.id)}
              style={{
                fontSize: '13px', fontWeight: '600', padding: '8px 16px', borderRadius: '999px', cursor: 'pointer', transition: 'all 0.2s',
                backgroundColor: isSelected ? '#1e3a8a' : '#ffffff',
                color: isSelected ? '#ffffff' : 'var(--color-ink)',
                border: `1px solid ${isSelected ? '#1e3a8a' : 'var(--color-line)'}`
              }}
            >
              {a.full_name} · {Math.round(a.total_score || 0)}%
            </button>
          );
        })}
      </div>

      {compared.length === 0 ? (
        <p style={{ color: 'var(--color-muted)', fontWeight: '500' }}>Select at least one applicant above to compare.</p>
      ) : (
        <div style={{ display: 'grid', gap: '24px', gridTemplateColumns: `repeat(${compared.length}, minmax(260px, 1fr))` }}>
          {compared.map((a) => {
            const initials = (a.full_name || '?').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
            return (
              <div key={a.id} style={{ backgroundColor: '#ffffff', border: '1px solid var(--color-line)', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'var(--color-paper)', border: '1px solid var(--color-line)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: '700', color: '#1e3a8a', flexShrink: 0 }}>
                    {initials}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: '16px', fontWeight: '700', color: 'var(--color-ink)', margin: '0 0 4px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.full_name}</p>
                    <p style={{ fontSize: '13px', color: 'var(--color-muted)', fontWeight: '500', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.institution || 'No institution'}</p>
                  </div>
                </div>

                <div style={{ textAlign: 'center', padding: '20px', borderRadius: '12px', backgroundColor: 'var(--color-paper)', border: '1px solid var(--color-line)', marginBottom: '24px' }}>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '32px', fontWeight: '700', color: 'var(--color-accent)', margin: '0 0 4px 0' }}>{Math.round(a.total_score || 0)}%</p>
                  <p style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.05em', color: 'var(--color-muted)', textTransform: 'uppercase', margin: 0 }}>Overall Match</p>
                </div>

                {/* Using primary system blue scale for the bars */}
                <ScoreBar label="Similarity Score" value={a.text_similarity_score} color="#1e3a8a" />
                <ScoreBar label="Skills" value={a.skills_score} color="#3b82f6" />
                <ScoreBar label="Education" value={a.education_score} color="#60a5fa" />
                <ScoreBar label="Location" value={a.location_score} color="#93c5fd" />
                <ScoreBar label="Experience" value={a.experience_score} color="#1e3a8a" />
                <ScoreBar label="Interests" value={a.interest_score} color="#3b82f6" />

                <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--color-line)', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: 'var(--color-muted)', fontWeight: '500' }}>
                  <p style={{ margin: 0 }}><strong style={{ color: 'var(--color-ink)' }}>Education:</strong> {a.education_level || 'Not set'}</p>
                  <p style={{ margin: 0 }}><strong style={{ color: 'var(--color-ink)' }}>Grade:</strong> {GRADE_LABEL[a.academic_grade] || 'Not set'}</p>
                  <p style={{ margin: 0 }}><strong style={{ color: 'var(--color-ink)' }}>Experience:</strong> {a.experience_years != null ? a.experience_years + ' yrs' : 'Not set'}</p>
                  <p style={{ margin: 0 }}><strong style={{ color: 'var(--color-ink)' }}>Location:</strong> {a.location || 'Not set'}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}