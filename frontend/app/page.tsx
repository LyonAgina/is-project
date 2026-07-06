'use client';
// @ts-nocheck
import { useEffect, useState } from 'react';
import Link from 'next/link';

const studentTags = ['SQL', 'React', 'Python', 'Communication', 'Data Analysis'];
const oppTags = ['SQL', 'React', 'Public Speaking', 'Data Analysis', 'Figma'];
const overlap = new Set(studentTags.filter((t) => oppTags.includes(t)));

export default function Home() {
  const [score, setScore] = useState(0);
  const target = 78;

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      setScore(target);
      return;
    }
    let current = 0;
    const interval = setInterval(() => {
      current += 2;
      if (current >= target) {
        setScore(target);
        clearInterval(interval);
      } else {
        setScore(current);
      }
    }, 20);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-paper)', color: 'var(--color-ink)', fontFamily: 'var(--font-body-text), system-ui, sans-serif' }}>
      
      {/* Top Header Navbar */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 48px', backgroundColor: '#ffffff', borderBottom: '1px solid var(--color-line)', position: 'sticky', top: 0, zIndex: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '18px', fontWeight: '700', letterSpacing: '-0.01em', color: 'var(--color-ink)' }}>Opportunity Hub</span>
        </div>
        <nav style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <Link href="/login" style={{ fontSize: '14px', color: 'var(--color-muted)', fontWeight: '500', textDecoration: 'none' }}>Log in</Link>
          <Link href="/register" style={{ backgroundColor: '#1e3a8a', color: '#ffffff', padding: '10px 20px', borderRadius: '12px', fontSize: '14px', fontWeight: '600', textDecoration: 'none', boxShadow: '0 4px 6px -1px rgba(30, 58, 138, 0.2)' }}>Register</Link>
        </nav>
      </header>

      {/* Hero Content Section */}
      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '64px', maxWidth: '1140px', margin: '0 auto', padding: '80px 24px', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-disp), sans-serif', fontSize: '52px', fontWeight: '700', lineHeight: '1.1', letterSpacing: '-0.03em', marginBottom: '24px' }}>
            Match score, <br />not guesswork.
          </h1>
          <p style={{ fontSize: '17px', color: 'var(--color-muted)', lineHeight: '1.6', marginBottom: '36px', maxWidth: '460px', fontWeight: '500' }}>
            It reads your skills, education and interests, then ranks every job, internship and scholarship by how well it actually fits you. No more scrolling through listings meant for someone else.
          </p>
          <div style={{ display: 'flex', gap: '16px' }}>
            <Link href="/register" style={{ backgroundColor: '#1e3a8a', color: '#ffffff', padding: '14px 28px', borderRadius: '12px', fontSize: '15px', fontWeight: '600', textDecoration: 'none', boxShadow: '0 4px 6px -1px rgba(30, 58, 138, 0.2)' }}>Find your matches</Link>
            <Link href="/login" style={{ backgroundColor: '#ffffff', border: '1px solid var(--color-line)', color: 'var(--color-ink)', padding: '14px 28px', borderRadius: '12px', fontSize: '15px', fontWeight: '600', textDecoration: 'none' }}>Log in</Link>
          </div>
        </div>

        {/* Dynamic Demo Card */}
        <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--color-line)', borderRadius: '16px', padding: '32px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <span style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.05em', color: 'var(--color-muted)', textTransform: 'uppercase' }}>Your profile</span>
            <span style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.05em', color: 'var(--color-muted)', textTransform: 'uppercase' }}>Opportunity</span>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {studentTags.map((tag) => {
                const isMatch = overlap.has(tag);
                return (
                  <span key={tag} style={{ fontSize: '12px', fontWeight: '600', padding: '6px 14px', borderRadius: '999px', border: isMatch ? '1px solid var(--color-accent)' : '1px solid var(--color-line)', color: isMatch ? 'var(--color-accent)' : 'var(--color-muted)', backgroundColor: isMatch ? 'rgba(226, 163, 59, 0.04)' : 'transparent' }}>
                    {tag}
                  </span>
                );
              })}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'flex-end' }}>
              {oppTags.map((tag) => {
                const isMatch = overlap.has(tag);
                return (
                  <span key={tag} style={{ fontSize: '12px', fontWeight: '600', padding: '6px 14px', borderRadius: '999px', border: isMatch ? '1px solid var(--color-accent)' : '1px solid var(--color-line)', color: isMatch ? 'var(--color-accent)' : 'var(--color-muted)', backgroundColor: isMatch ? 'rgba(226, 163, 59, 0.04)' : 'transparent' }}>
                    {tag}
                  </span>
                );
              })}
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--color-line)', paddingTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '15px', fontWeight: '700', display: 'block', color: 'var(--color-ink)' }}>Junior Data Analyst</span>
              <span style={{ fontSize: '12px', color: 'var(--color-muted)', display: 'block', marginTop: '2px', fontWeight: '500' }}>Nairobi, Kenya</span>
            </div>
            <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: '32px', fontWeight: '700', color: 'var(--color-accent)', letterSpacing: '-0.02em' }}>
              {score}%
            </span>
          </div>
        </div>
      </section>

      {/* Grid Process Blocks */}
      <section style={{ backgroundColor: '#ffffff', borderTop: '1px solid var(--color-line)', padding: '80px 48px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'var(--font-disp), sans-serif', fontSize: '26px', fontWeight: '700', marginBottom: '40px', letterSpacing: '-0.01em' }}>How it works</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '32px' }}>
            {[
              { n: '01', title: 'Build your profile', text: 'Add your education, skills, interests and location — once.' },
              { n: '02', title: 'Get scored against every listing', text: 'It weighs skills, education, location, experience and interests for each opportunity live on the platform.' },
              { n: '03', title: 'Apply to your best matches first', text: 'Skip the listings that were never meant for you, and focus where you actually fit.' },
            ].map((step) => (
              <div key={step.n} style={{ border: '1px solid var(--color-line)', padding: '28px', borderRadius: '16px', backgroundColor: 'rgba(243, 245, 247, 0.3)' }}>
                <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: '11px', fontWeight: '700', color: 'var(--color-accent)', border: '1px solid var(--color-line)', padding: '4px 8px', borderRadius: '6px', backgroundColor: '#ffffff' }}>{step.n}</span>
                <h3 style={{ fontSize: '17px', fontWeight: '700', marginTop: '20px', marginBottom: '8px' }}>{step.title}</h3>
                <p style={{ fontSize: '13.5px', color: 'var(--color-muted)', lineHeight: '1.5', fontWeight: '500' }}>{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Target Audiences Panels */}
      <section style={{ maxWidth: '1100px', margin: '0 auto', padding: '80px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
          <div style={{ border: '1px solid var(--color-line)', backgroundColor: '#ffffff', padding: '28px', borderRadius: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>Students</h3>
            <p style={{ fontSize: '13.5px', color: 'var(--color-muted)', lineHeight: '1.5', fontWeight: '500' }}>One profile, ranked recommendations across jobs, internships and scholarships.</p>
          </div>
          <div style={{ border: '1px solid var(--color-line)', backgroundColor: '#ffffff', padding: '28px', borderRadius: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px', color: 'var(--color-accent-2)' }}>Organizations &amp; universities</h3>
            <p style={{ fontSize: '13.5px', color: 'var(--color-muted)', lineHeight: '1.5', fontWeight: '500' }}>Post once, reach students who actually match your operational requirements.</p>
          </div>
          <div style={{ border: '1px solid var(--color-line)', backgroundColor: '#ffffff', padding: '28px', borderRadius: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>Admins</h3>
            <p style={{ fontSize: '13.5px', color: 'var(--color-muted)', lineHeight: '1.5', fontWeight: '500' }}>Verify organizations and keep system listings highly secure and trustworthy.</p>
          </div>
        </div>
      </section>

      <footer style={{ borderTop: '1px solid var(--color-line)', backgroundColor: '#ffffff', padding: '32px', fontSize: '12px', color: 'var(--color-muted)', textAlign: 'center', fontWeight: '500' }}>
        &copy; 2026 Opportunity Hub. All rights reserved.
      </footer>
    </div>
  );
}