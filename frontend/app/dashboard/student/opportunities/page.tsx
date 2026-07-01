// @ts-nocheck
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';

const CATEGORY_STYLES = {
  job: 'bg-blue-50 text-blue-700 border-blue-200',
  internship: 'bg-purple-50 text-purple-700 border-purple-200',
  scholarship: 'bg-amber-50 text-amber-800 border-amber-200',
};

export default function StudentOpportunities() {
  const [opps, setOpps] = useState([]);
  const [appliedIds, setAppliedIds] = useState(new Set());
  const [error, setError] = useState('');

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setError('');

    try {
      const oppsRes = await apiFetch('/api/student/opportunities');
      const oppsData = await oppsRes.json();

      if (!oppsRes.ok || !Array.isArray(oppsData)) {
        throw new Error(oppsData.error || 'Failed to load opportunities');
      }

      setOpps(oppsData);

      const appsRes = await apiFetch('/api/student/applications');
      const appsData = await appsRes.json();

      if (appsRes.ok && Array.isArray(appsData)) {
        setAppliedIds(
          new Set(
            appsData
              .map((a) => a.opportunity_id)
              .filter(Boolean)
          )
        );
      }
    } catch (err) {
      setError(err.message);
      setOpps([]);
    }
  };

  const apply = async (opportunityId) => {
    try {
      const res = await apiFetch('/api/student/applications', {
        method: 'POST',
        body: JSON.stringify({ opportunityId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to apply');
      }

      setAppliedIds((prev) => new Set([...prev, opportunityId]));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <h1 className="font-display text-2xl font-bold mb-6">
        Opportunities
      </h1>

      {error && (
        <p className="text-red-600 mb-4">{error}</p>
      )}

      {!error && opps.length === 0 && (
        <p className="text-[var(--color-muted)]">
          No active opportunities right now — check back soon.
        </p>
      )}

      <div className="space-y-4">
        {opps.map((o) => {
          const detailHref =
            '/dashboard/student/opportunities/' + o.id;

          const categoryClass =
            CATEGORY_STYLES[o.category] ||
            CATEGORY_STYLES.job;

          const isApplied = appliedIds.has(o.id);

          const preview = o.description
            ? o.description.length > 140
              ? o.description.slice(0, 140) + '…'
              : o.description
            : null;

          return (
            <div
              key={o.id}
              className="border border-[var(--color-line)] rounded-xl p-5 flex justify-between items-start"
            >
              <div className="flex-1">
                <Link href={detailHref}>
                  <h2 className="font-semibold hover:underline cursor-pointer">
                    {o.title}
                  </h2>
                </Link>

                <p className="text-sm text-[var(--color-muted)] mt-1">
                  {o.organization_name} ·{' '}
                  {o.location || 'Location not set'}
                </p>

                {preview && (
                  <p className="text-sm text-[var(--color-muted)] mt-2">
                    {preview}
                  </p>
                )}

                {o.deadline && (
                  <p className="text-xs text-[var(--color-muted)] mt-3 pt-3 border-t border-[var(--color-line)]">
                    Deadline:{' '}
                    {new Date(
                      o.deadline
                    ).toLocaleDateString()}
                  </p>
                )}
              </div>

              <div className="ml-6 flex flex-col items-end gap-2">
                <span
                  className={
                    'text-xs px-2 py-1 rounded-full border capitalize whitespace-nowrap ' +
                    categoryClass
                  }
                >
                  {o.category}
                </span>

                <button
                  onClick={() => apply(o.id)}
                  disabled={isApplied}
                  className="bg-[var(--color-ink)] text-white px-3 py-1.5 rounded-md text-sm disabled:opacity-40"
                >
                  {isApplied ? 'Applied' : 'Apply'}
                </button>

                <Link
                  href={detailHref}
                  className="text-sm text-[var(--color-ink)] hover:underline"
                >
                  View Details
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}