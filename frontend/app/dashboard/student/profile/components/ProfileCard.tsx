// @ts-nocheck
'use client';

export default function ProfileCard({ title, onEdit, children }) {
  return (
    <div style={{ 
      backgroundColor: '#ffffff', 
      border: '1px solid var(--color-line)', 
      borderRadius: '16px', 
      padding: '32px', 
      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
    }}>
      {(title || onEdit) && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--color-paper)' }}>
          {title && <h2 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--color-ink)', margin: 0 }}>{title}</h2>}
          
          {onEdit && (
            <button
              onClick={onEdit}
              style={{ 
                display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: '1px solid var(--color-line)', 
                cursor: 'pointer', fontSize: '14px', fontWeight: '600', color: '#1e3a8a', padding: '8px 16px', borderRadius: '8px', transition: 'all 0.2s' 
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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