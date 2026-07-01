'use client';
import { ReactNode } from 'react';

interface ProfileCardProps {
  title?: string;
  onEdit?: () => void;
  children: ReactNode;
  className?: string;
}

export default function ProfileCard({ title, onEdit, children, className = '' }: ProfileCardProps) {
  return (
    <div className={`bg-[var(--color-surface)] border border-[var(--color-line)] rounded-xl p-6 ${className}`}>
      {(title || onEdit) && (
        <div className="flex items-center justify-between mb-5">
          {title && <h2 className="font-semibold text-base text-[var(--color-ink)]">{title}</h2>}
          {onEdit && (
            <button
              onClick={onEdit}
              className="flex items-center gap-1.5 text-sm text-[var(--color-muted)] hover:text-[var(--color-ink)] transition-colors px-2.5 py-1 rounded-lg hover:bg-[var(--color-line)]"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Edit
            </button>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
