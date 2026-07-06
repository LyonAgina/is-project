// @ts-nocheck
'use client';
import { useRef, useState } from 'react';
import ProfileCard from './ProfileCard';

export default function CVCard({ data, onUploaded }) {
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
    if (res.ok) onUploaded({ cvUrl: d.cvUrl, cvFilename: d.cvFilename });
    e.target.value = '';
  };

  return (
    <ProfileCard title="CV / Résumé">
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        
        {/* Document Icon */}
        <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1e3a8a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
        </div>
        
        {/* Filename */}
        <span style={{ fontSize: '15px', fontWeight: '500', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--color-ink)' }}>
          {data.cvFilename || <span style={{ color: 'var(--color-muted)' }}>No CV uploaded yet</span>}
        </span>
        
        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
          {data.cvUrl && (
            <a 
              href={`${process.env.NEXT_PUBLIC_API_URL}${data.cvUrl}`} 
              target="_blank" 
              style={{ fontSize: '14px', fontWeight: '600', color: '#1e3a8a', textDecoration: 'underline', textUnderlineOffset: '4px' }}
            >
              View
            </a>
          )}
          <button 
            onClick={() => fileInputRef.current?.click()} 
            disabled={uploading} 
            style={{ fontSize: '14px', fontWeight: '600', padding: '8px 16px', border: '1px solid var(--color-line)', borderRadius: '8px', backgroundColor: 'transparent', color: 'var(--color-ink)', cursor: uploading ? 'not-allowed' : 'pointer' }}
          >
            {uploading ? 'Uploading…' : data.cvUrl ? 'Replace' : 'Upload'}
          </button>
        </div>
      </div>
      
      <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" style={{ display: 'none' }} onChange={handleUpload} />
    </ProfileCard>
  );
}