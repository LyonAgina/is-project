'use client';
import { useRef, useState } from 'react';
import ProfileCard from './ProfileCard';

interface CVData {
  cvUrl: string;
  cvFilename: string;
}

interface CVCardProps {
  data: CVData;
  onUploaded: (patch: CVData) => void;
}

export default function CVCard({ data, onUploaded }: CVCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('cv', file);
    const token = localStorage.getItem('token');
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/student/profile/cv`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const d = await res.json();
    setUploading(false);
    if (res.ok) {
      onUploaded({ cvUrl: d.cvUrl, cvFilename: d.cvFilename });
    }
    // reset so the same file can be re-uploaded
    e.target.value = '';
  };

  return (
    <ProfileCard title="CV / résumé">
      <div className="flex items-center gap-3">
        {/* File icon */}
        <div className="w-9 h-9 rounded-lg border border-[var(--color-line)] flex items-center justify-center shrink-0 text-[var(--color-muted)]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
        </div>

        <span className="text-sm flex-1 truncate text-[var(--color-muted)]">
          {data.cvFilename || 'No CV uploaded yet'}
        </span>

        <div className="flex items-center gap-2 shrink-0">
          {data.cvUrl && (
            <a
              href={`${process.env.NEXT_PUBLIC_API_URL}${data.cvUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-[var(--color-muted)] hover:text-[var(--color-ink)] underline underline-offset-2 transition-colors"
            >
              View
            </a>
          )}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 text-sm border border-[var(--color-line)] px-3 py-1.5 rounded-lg hover:bg-[var(--color-line)] transition-colors disabled:opacity-50"
          >
            {uploading ? (
              'Uploading…'
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                {data.cvUrl ? 'Replace' : 'Upload'}
              </>
            )}
          </button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx"
        className="hidden"
        onChange={handleUpload}
      />
    </ProfileCard>
  );
}
