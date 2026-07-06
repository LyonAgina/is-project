// @ts-nocheck
'use client';
import { ReactNode, useEffect } from 'react';

interface EditModalProps {
  title: string;
  onClose: () => void;
  onSave: () => void;
  saving?: boolean;
  children: ReactNode;
}

export default function EditModal({ title, onClose, onSave, saving, children }: EditModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      {/* Dark Blur Backdrop */}
      <div 
        style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)' }} 
        onClick={onClose} 
      />

      {/* Modal Panel */}
      <div style={{ position: 'relative', backgroundColor: '#ffffff', border: '1px solid var(--color-line)', borderRadius: '16px', width: '100%', maxWidth: '500px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', itemsCenter: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid var(--color-line)' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: 'var(--color-ink)' }}>{title}</h2>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-muted)', padding: '4px', borderRadius: '8px' }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px', overflowY: 'auto' }}>
          {children}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', padding: '16px 24px', borderTop: '1px solid var(--color-line)', backgroundColor: '#f8fafc', borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px' }}>
          <button
            onClick={onClose}
            style={{ padding: '10px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', backgroundColor: '#ffffff', color: 'var(--color-ink)', border: '1px solid var(--color-line)', cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            style={{ padding: '10px 24px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', backgroundColor: '#1e3a8a', color: '#ffffff', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>

      </div>
    </div>
  );
}