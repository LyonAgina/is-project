// @ts-nocheck
'use client';

const FIELDS = [
  { key: 'full_name', label: 'Full name', weight: 10 },
  { key: 'institution', label: 'Institution', weight: 10 },
  { key: 'course_of_study', label: 'Course of study', weight: 10 },
  { key: 'education_level', label: 'Education level', weight: 10 },
  { key: 'location', label: 'Location', weight: 10 },
  { key: 'bio', label: 'About/bio', weight: 15 },
  { key: 'cv_url', label: 'CV uploaded', weight: 25 },
  { key: 'experience_years', label: 'Experience', weight: 10, isNumber: true },
];

export default function ProfileCompleteness({ profile, tags = [] }) {
  if (!profile) return null;

  let score = 0;
  const missing = [];

  FIELDS.forEach((f) => {
    const val = profile[f.key];
    const filled = f.isNumber ? val !== null && val !== undefined : !!val;
    if (filled) {
      score += f.weight;
    } else {
      missing.push(f.label);
    }
  });

  if (tags.length > 0) {
    score += 10;
  } else {
    missing.push('Skills/interests');
  }

  const pct = Math.min(100, score);
  const color = pct >= 80 ? '#15803d' : pct >= 50 ? '#f59e0b' : '#dc2626';

  if (pct >= 100) return null;

  return (
    <div className="rounded-xl p-5 mb-6" style={{ border: '1px solid #e5e7eb', background: '#ffffff' }}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-semibold">Profile completeness</p>
        <span className="text-sm font-bold" style={{ color }}>{pct}%</span>
      </div>
      <div className="w-full h-2 rounded-full mb-3" style={{ background: '#f3f4f6' }}>
        <div
          className="h-2 rounded-full transition-all"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      {missing.length > 0 && (
        <p className="text-xs" style={{ color: '#6b7280' }}>
          A more complete profile improves your match scores. Missing: {missing.slice(0, 3).join(', ')}
          {missing.length > 3 ? ` +${missing.length - 3} more` : ''}
        </p>
      )}
    </div>
  );
}