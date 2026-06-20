// @ts-nocheck
'use client';
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
    <main>
      {/* Header */}
      <header className="flex items-center justify-between px-6 md:px-12 py-6 border-b border-[var(--color-line)]">
        <span className="font-display text-xl font-bold">Fursa</span>
        <nav className="flex gap-4 items-center text-sm">
          <Link href="/login" className="text-[var(--color-muted)] hover:text-[var(--color-ink)]">Log in</Link>
          <Link href="/register" className="bg-[var(--color-ink)] text-white px-4 py-2 rounded-md">Register</Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="grid md:grid-cols-2 gap-10 px-6 md:px-12 py-16 md:py-24 items-center max-w-6xl mx-auto">
        <div>
          <p className="text-sm uppercase tracking-wide text-[var(--color-muted)] mb-3">Fursa — Swahili for &ldquo;opportunity&rdquo;</p>
          <h1 className="font-display text-4xl md:text-5xl font-bold leading-tight mb-5">
            Match score, not guesswork.
          </h1>
          <p className="text-[var(--color-muted)] text-lg mb-8 max-w-md">
            Fursa reads your skills, education and interests, then ranks every job,
            internship and scholarship by how well it actually fits you.
            No more scrolling through listings meant for someone else.
          </p>
          <div className="flex gap-3">
            <Link href="/register" className="bg-[var(--color-ink)] text-white px-5 py-3 rounded-md font-medium">
              Find your matches
            </Link>
            <Link href="/login" className="border border-[var(--color-line)] px-5 py-3 rounded-md font-medium">
              Log in
            </Link>
          </div>
        </div>

        {/* Signature match demo */}
        <div className="border border-[var(--color-line)] rounded-xl p-6 bg-white">
          <div className="flex justify-between items-center mb-5">
            <span className="text-xs uppercase tracking-wide text-[var(--color-muted)]">Your profile</span>
            <span className="text-xs uppercase tracking-wide text-[var(--color-muted)]">Opportunity</span>
          </div>
          <div className="flex justify-between gap-4 mb-6">
            <div className="flex flex-wrap gap-2">
              {studentTags.map((tag) => (
                <span
                  key={tag}
                  className={`text-xs px-2 py-1 rounded-full border ${
                    overlap.has(tag)
                      ? 'border-[var(--color-accent)] text-[var(--color-accent)]'
                      : 'border-[var(--color-line)] text-[var(--color-muted)]'
                  }`}
                >
                  {tag}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 justify-end">
              {oppTags.map((tag) => (
                <span
                  key={tag}
                  className={`text-xs px-2 py-1 rounded-full border ${
                    overlap.has(tag)
                      ? 'border-[var(--color-accent)] text-[var(--color-accent)]'
                      : 'border-[var(--color-line)] text-[var(--color-muted)]'
                  }`}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div className="border-t border-[var(--color-line)] pt-5 flex items-center justify-between">
            <span className="text-sm text-[var(--color-muted)]">Junior Data Analyst — Nairobi</span>
            <span className="font-mono text-2xl font-semibold text-[var(--color-accent)]">{score}%</span>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 md:px-12 py-16 border-t border-[var(--color-line)] max-w-6xl mx-auto">
        <h2 className="font-display text-2xl font-bold mb-10">How Fursa works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { n: '1', title: 'Build your profile', text: 'Add your education, skills, interests and location — once.' },
            { n: '2', title: 'Get scored against every listing', text: 'Fursa weighs skills, education, location, experience and interests for each opportunity live on the platform.' },
            { n: '3', title: 'Apply to your best matches first', text: 'Skip the listings that were never meant for you, and focus where you actually fit.' },
          ].map((step) => (
            <div key={step.n}>
              <span className="font-mono text-sm text-[var(--color-accent)]">{step.n}</span>
              <h3 className="font-display font-semibold text-lg mt-2 mb-2">{step.title}</h3>
              <p className="text-[var(--color-muted)] text-sm">{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Roles */}
      <section className="px-6 md:px-12 py-16 border-t border-[var(--color-line)] max-w-6xl mx-auto">

        <div className="grid md:grid-cols-3 gap-6">
          <div className="border border-[var(--color-line)] rounded-xl p-6">
            <h3 className="font-display font-semibold text-lg mb-2">Students</h3>
            <p className="text-[var(--color-muted)] text-sm">
              One profile, ranked recommendations across jobs, internships and scholarships.
            </p>
          </div>
          <div className="border border-[var(--color-line)] rounded-xl p-6">
            <h3 className="font-display font-semibold text-lg mb-2" style={{ color: 'var(--color-accent-2)' }}>
              Organizations &amp; universities
            </h3>
            <p className="text-[var(--color-muted)] text-sm">
              Post once, reach students who actually match your requirements.
            </p>
          </div>
          <div className="border border-[var(--color-line)] rounded-xl p-6">
            <h3 className="font-display font-semibold text-lg mb-2">Admins</h3>
            <p className="text-[var(--color-muted)] text-sm">
              Verify organizations and keep listings trustworthy.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 md:px-12 py-8 border-t border-[var(--color-line)] flex justify-between items-center text-sm text-[var(--color-muted)]">
        <span>Fursa</span>
        <div className="flex gap-4">
          <Link href="/login" className="hover:text-[var(--color-ink)]">Log in</Link>
          <Link href="/register" className="hover:text-[var(--color-ink)]">Register</Link>
        </div>
      </footer>
    </main>
  );
}