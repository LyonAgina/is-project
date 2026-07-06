// @ts-nocheck
'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const GRADE_LABEL = {
  first_class: 'First Class',
  second_upper: 'Second Class Upper',
  second_lower: 'Second Class Lower',
  pass: 'Pass',
};

function ScoreBar({ label, value, color }) {
  return (
    <div className="mb-2.5">
      <div className="flex justify-between text-xs mb-1">
        <span style={{ color: '#6b7280' }}>{label}</span>
        <span className="font-medium" style={{ color }}>{Math.round(value || 0)}%</span>
      </div>
      <div className="w-full h-1.5 rounded-full" style={{ background: '#f3f4f6' }}>
        <div className="h-1.5 rounded-full" style={{ width: `${Math.min(100, value || 0)}%`, background: color }} />
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
      // default: top 3 by score
      setSelected(data.slice(0, 3).map((a) => a.id));
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleSelect = (appId: number) => {
    setSelected((prev) => {
      if (prev.includes(appId)) return prev.filter((id) => id !== appId);
      if (prev.length >= 4) return prev; // cap at 4 columns
      return [...prev, appId];
    });
  };

  const compared = applicants.filter((a) => selected.includes(a.id));

  return (
    <div>
      <button onClick={() => router.back()} className="text-sm mb-4 hover:underline" style={{ color: '#6b7280' }}>
        ← Back to applicants
      </button>
      <h1 className="font-display text-2xl font-bold mb-1">Compare applicants</h1>
      <p className="text-sm mb-6" style={{ color: '#6b7280' }}>Select up to 4 applicants to compare side by side.</p>

      {error && (
        <div className="rounded-lg text-sm px-4 py-3 mb-6" style={{ border: '1px solid #fecaca', background: '#fef2f2', color: '#b91c1c' }}>
          {error}
        </div>
      )}

      {/* Selector chips */}
      <div className="flex flex-wrap gap-2 mb-6">
        {applicants.map((a) => {
          const isSelected = selected.includes(a.id);
          return (
            <button
              key={a.id}
              onClick={() => toggleSelect(a.id)}
              className="text-xs font-medium px-3 py-1.5 rounded-full transition-colors"
              style={{
                background: isSelected ? '#111827' : '#ffffff',
                color: isSelected ? '#ffffff' : '#4b5563',
                border: '1px solid ' + (isSelected ? '#111827' : '#e5e7eb'),
              }}
            >
              {a.full_name} · {Math.round(a.total_score || 0)}%
            </button>
          );
        })}
      </div>

      {compared.length === 0 ? (
        <p className="text-sm" style={{ color: '#6b7280' }}>Select at least one applicant above to compare.</p>
      ) : (
        <div className="overflow-x-auto">
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${compared.length}, minmax(220px, 1fr))` }}>
            {compared.map((a) => {
              const initials = (a.full_name || '?').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
              const cvHref = a.cv_url ? API_URL + a.cv_url : null;
              return (
                <div key={a.id} className="rounded-xl p-5" style={{ border: '1px solid #e5e7eb', background: '#ffffff' }}>
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold shrink-0"
                      style={{ background: '#f3f4f6', color: '#4b5563' }}
                    >
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{a.full_name}</p>
                      <p className="text-xs truncate" style={{ color: '#6b7280' }}>{a.institution || 'No institution'}</p>
                    </div>
                  </div>

                  <div className="text-center mb-4 py-3 rounded-lg" style={{ background: '#f9fafb' }}>
                    <p className="text-2xl font-bold" style={{ color: '#111827' }}>{Math.round(a.total_score || 0)}%</p>
                    <p className="text-xs" style={{ color: '#6b7280' }}>overall match</p>
                  </div>

                  <ScoreBar label="Similarity Score" value={a.text_similarity_score} color="#1d4ed8" />
                  <ScoreBar label="Skills" value={a.skills_score} color="#7e22ce" />
                  <ScoreBar label="Education" value={a.education_score} color="#15803d" />
                  <ScoreBar label="Location" value={a.location_score} color="#92400e" />
                  <ScoreBar label="Experience" value={a.experience_score} color="#be185d" />
                  <ScoreBar label="Interests" value={a.interest_score} color="#0891b2" />

                  <div className="mt-4 pt-4 space-y-1.5 text-xs" style={{ borderTop: '1px solid #f3f4f6', color: '#6b7280' }}>
                    <p>Education: {a.education_level || 'Not set'}</p>
                    <p>Grade: {GRADE_LABEL[a.academic_grade] || 'Not set'}</p>
                    <p>Experience: {a.experience_years != null ? a.experience_years + ' yrs' : 'Not set'}</p>
                    <p>Location: {a.location || 'Not set'}</p>
                  </div>

                  {cvHref ? (
                    <a href={cvHref} target="_blank" className="block mt-4 text-center text-xs font-medium hover:underline" style={{ color: '#111827' }}>
                      View CV
                    </a>
                  ) : (
                    <p className="mt-4 text-center text-xs" style={{ color: '#9ca3af' }}>No CV uploaded</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}