'use client';

import { ReactNode } from 'react';

interface EditModalProps {
  title: string;
  onClose: (open: boolean) => void;
  onSave: () => void;
  saving: boolean;
  children: ReactNode;
}

export default function EditModal({ title, onClose, onSave, saving, children }: EditModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.4)' }}
      onClick={() => onClose(false)}
    >
      <div
        className="w-full max-w-md rounded-xl shadow-xl p-6 space-y-5"
        style={{ background: 'var(--color-surface, #fff)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">{title}</h2>
          <button
            onClick={() => onClose(false)}
            className="text-sm text-[var(--color-muted)] hover:text-[var(--color-ink)]"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">{children}</div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={() => onClose(false)}
            disabled={saving}
            className="px-4 py-2 text-sm rounded-lg border border-[var(--color-line)] hover:bg-[var(--color-surface-hover,#f9fafb)]"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className="px-4 py-2 text-sm rounded-lg text-white disabled:opacity-60"
            style={{ background: 'var(--color-ink, #111)' }}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}