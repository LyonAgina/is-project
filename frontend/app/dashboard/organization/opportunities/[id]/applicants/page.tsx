// @ts-nocheck
'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';

export default function Applicants() {
  const { id } = useParams();
  const [applicants, setApplicants] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    load();
  }, [id]);

  const load = async () => {
    setError('');
    try {
      const res = await apiFetch(`/api/organization/opportunities/${id}/applicants`);
      const data = await res.json();
      if (!res.ok || !Array.isArray(data)) {
        throw new Error(data.error || 'Failed to load applicants');
      }
      setApplicants(data);
    } catch (err) {
      setError(err.message);
      setApplicants([]);
    }
  };

  const updateStatus = async (appId, status) => {
    await apiFetch(`/api/organization/applications/${appId}/status`, { method: 'PUT', body: JSON.stringify({ status }) });
    load();
  };

  return (
    <div>
      <h1 className="font-display text-2xl font-bold mb-6">Applicants</h1>
      {error && <p className="text-red-600 mb-4">{error}</p>}
      {!error && applicants.length === 0 && <p className="text-[var(--color-muted)]">No applicants yet.</p>}
      <div className="space-y-3">
        {applicants.map((a) => (
          <div key={a.id} className="border border-[var(--color-line)] rounded-xl p-4 flex justify-between items-center">
            <div>
              <p className="font-medium">{a.full_name}</p>
              <p className="text-sm text-[var(--color-muted)]">{a.email} · {a.institution || 'No institution set'}</p>
            </div>
            <select value={a.status} onChange={(e) => updateStatus(a.id, e.target.value)} className="text-sm border border-[var(--color-line)] rounded-md p-1">
              <option value="submitted">Submitted</option>
              <option value="under_review">Under review</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}
