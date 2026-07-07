// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';

export default function ReportModal({
  open,
  onClose,
  onPDF,
  onExcel,
  title = 'Generate Report',
}) {
  const [format, setFormat] = useState('pdf');

  useEffect(() => {
    if (open) setFormat('pdf');
  }, [open]);

  if (!open) return null;

  const handleGenerate = () => {
    if (format === 'pdf') {
      onPDF();
    } else {
      onExcel();
    }

    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '500px',
          background: '#fff',
          borderRadius: '18px',
          border: '1px solid var(--color-line)',
          boxShadow: '0 20px 40px rgba(0,0,0,.12)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '28px 30px 18px',
            borderBottom: '1px solid var(--color-line)',
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: '22px',
              fontWeight: 700,
              color: 'var(--color-ink)',
            }}
          >
            {title}
          </h2>

          <p
            style={{
              marginTop: '8px',
              marginBottom: 0,
              color: 'var(--color-muted)',
              fontSize: '14px',
            }}
          >
            Choose which report format you'd like to download.
          </p>
        </div>

        {/* Body */}

        <div style={{ padding: '26px 30px' }}>
          {/* PDF */}

          <label
            style={{
              display: 'flex',
              gap: '16px',
              alignItems: 'flex-start',
              padding: '18px',
              border:
                format === 'pdf'
                  ? '2px solid #1e3a8a'
                  : '1px solid var(--color-line)',
              borderRadius: '14px',
              cursor: 'pointer',
              marginBottom: '16px',
              background:
                format === 'pdf' ? '#f8fbff' : '#ffffff',
            }}
          >
            <input
              type="radio"
              checked={format === 'pdf'}
              onChange={() => setFormat('pdf')}
            />

            <div>
              <div
                style={{
                  fontWeight: 700,
                  color: 'var(--color-ink)',
                }}
              >
                PDF Document (.pdf)
              </div>

              <div
                style={{
                  marginTop: '4px',
                  fontSize: '13px',
                  color: 'var(--color-muted)',
                }}
              >
                Best for printing, sharing and presentations.
              </div>
            </div>
          </label>

          {/* Excel */}

          <label
            style={{
              display: 'flex',
              gap: '16px',
              alignItems: 'flex-start',
              padding: '18px',
              border:
                format === 'excel'
                  ? '2px solid #1e3a8a'
                  : '1px solid var(--color-line)',
              borderRadius: '14px',
              cursor: 'pointer',
              background:
                format === 'excel' ? '#f8fbff' : '#ffffff',
            }}
          >
            <input
              type="radio"
              checked={format === 'excel'}
              onChange={() => setFormat('excel')}
            />

            <div>
              <div
                style={{
                  fontWeight: 700,
                  color: 'var(--color-ink)',
                }}
              >
                Excel Spreadsheet (.xlsx)
              </div>

              <div
                style={{
                  marginTop: '4px',
                  fontSize: '13px',
                  color: 'var(--color-muted)',
                }}
              >
                Best for sorting, filtering and data analysis.
              </div>
            </div>
          </label>
        </div>

        {/* Footer */}

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            padding: '22px 30px',
            borderTop: '1px solid var(--color-line)',
            background: '#fafafa',
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '10px 18px',
              borderRadius: '10px',
              border: '1px solid var(--color-line)',
              background: '#fff',
              cursor: 'pointer',
              fontWeight: 600,
              color: 'var(--color-ink)',
            }}
          >
            Cancel
          </button>

          <button
            onClick={handleGenerate}
            style={{
              padding: '10px 20px',
              borderRadius: '10px',
              border: 'none',
              background: '#1e3a8a',
              color: '#fff',
              cursor: 'pointer',
              fontWeight: 600,
              boxShadow: '0 4px 10px rgba(30,58,138,.25)',
            }}
          >
            Generate Report
          </button>
        </div>
      </div>
    </div>
  );
}