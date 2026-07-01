// @ts-nocheck
'use client';

import { useState } from 'react';
import ProfileCard from './ProfileCard';

export default function ExperienceCard({
  form,
  setForm,
  onSave,
}) {
  const [editing, setEditing] = useState(false);

  const [years, setYears] = useState(
    form.experienceYears ?? 0
  );

  const startEdit = () => {
    setYears(form.experienceYears ?? 0);
    setEditing(true);
  };

  const cancelEdit = () => {
    setYears(form.experienceYears ?? 0);
    setEditing(false);
  };

  const save = async () => {
    const updated = {
      ...form,
      experienceYears: Number(years),
    };

    setForm(updated);

    await onSave(updated);

    setEditing(false);
  };

  return (
    <ProfileCard
      title="Experience"
      actions={
        !editing && (
          <button
            onClick={startEdit}
            className="text-sm border border-[var(--color-line)] px-3 py-1 rounded-md"
          >
            Edit
          </button>
        )
      }
    >
      {!editing ? (
        <div>
          {form.experienceYears > 0 ? (
            <p>
              <span className="font-semibold">
                {form.experienceYears}
              </span>{' '}
              {form.experienceYears === 1
                ? 'year'
                : 'years'}{' '}
              of experience
            </p>
          ) : (
            <p className="text-[var(--color-muted)]">
              No experience added yet.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">

          <input
            type="number"
            min="0"
            step="0.5"
            value={years}
            onChange={(e) => setYears(e.target.value)}
            placeholder="Years of experience"
            className="w-full border border-[var(--color-line)] rounded-md p-2"
          />

          <div className="flex gap-3">
            <button
              onClick={save}
              className="bg-[var(--color-ink)] text-[var(--color-paper)] px-4 py-2 rounded-md"
            >
              Save
            </button>

            <button
              onClick={cancelEdit}
              className="border border-[var(--color-line)] px-4 py-2 rounded-md"
            >
              Cancel
            </button>
          </div>

        </div>
      )}
    </ProfileCard>
  );
}