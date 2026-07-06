// @ts-nocheck
'use client';
import Link from 'next/link';

export default function OnboardingChecklist({ profile, tags = [], hasApplied }) {
  if (!profile) return null;

  const steps = [
    {
      done: !!(profile.institution && profile.education_level),
      title: 'Complete your education details',
      desc: 'Add your institution, course, and education level.',
      href: '/dashboard/student/profile',
      icon: (color) => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3.3 2 8.7 2 12 0v-5" />
        </svg>
      ),
    },
    {
      done: tags.length > 0,
      title: 'Add your skills and interests',
      desc: 'This directly improves your match scores.',
      href: '/dashboard/student/profile',
      icon: (color) => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2l3 7h7l-5.5 4.5L18.5 21 12 16.5 5.5 21l2-7.5L2 9h7z" />
        </svg>
      ),
    },
    {
      done: !!profile.cv_url,
      title: 'Upload your CV',
      desc: 'Required to apply, and powers your similarity score.',
      href: '/dashboard/student/profile',
      icon: (color) => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
        </svg>
      ),
    },
    {
      done: !!hasApplied,
      title: 'Apply to your first opportunity',
      desc: 'Browse jobs, internships, and scholarships matched to you.',
      href: '/dashboard/student/recommendations',
      icon: (color) => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" />
        </svg>
      ),
    },
  ];

  const doneCount = steps.filter((s) => s.done).length;
  if (doneCount === steps.length) return null; // hide once fully onboarded

  return (
    <div className="rounded-xl p-5 mb-6" style={{ border: '1px solid #e5e7eb', background: '#ffffff' }}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-sm">Get started with Fursa</h2>
        <span className="text-xs font-medium" style={{ color: '#6b7280' }}>{doneCount}/{steps.length} complete</span>
      </div>
      <div className="space-y-1">
        {steps.map((s, i) => (
          <Link
            key={i}
            href={s.href}
            className="flex items-center gap-3 py-2.5 group"
            style={{ borderTop: i > 0 ? '1px solid #f3f4f6' : 'none' }}
          >
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
              style={{ background: s.done ? '#f0fdf4' : '#f3f4f6' }}
            >
              {s.done ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                s.icon('#4b5563')
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="text-sm font-medium group-hover:underline"
                style={{ textDecoration: s.done ? 'line-through' : 'none', color: s.done ? '#9ca3af' : '#111827' }}
              >
                {s.title}
              </p>
              <p className="text-xs" style={{ color: '#9ca3af' }}>{s.desc}</p>
            </div>
            {!s.done && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}