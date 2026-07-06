'use client';
// @ts-nocheck
import { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export default function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--color-paper)', color: 'var(--color-ink)', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'var(--font-body-text), system-ui, sans-serif' }}>
      <main style={{ width: '100%', maxWidth: '440px', backgroundColor: '#ffffff', border: '1px solid var(--color-line)', borderRadius: '16px', padding: '40px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.02)' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontFamily: 'var(--font-disp), sans-serif', fontSize: '26px', fontWeight: '700', letterSpacing: '-0.02em', color: 'var(--color-ink)', marginBottom: '6px' }}>
            {title}
          </h1>
          {subtitle && (
            <p style={{ fontSize: '14px', color: 'var(--color-muted)', fontWeight: '500' }}>
              {subtitle}
            </p>
          )}
        </div>
        <div>{children}</div>
      </main>
    </div>
  );
}