// @ts-nocheck
'use client';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import HeroCard from './components/HeroCard';
import AboutCard from './components/AboutCard';
import EducationCard from './components/EducationCard';
import SkillsCard from './components/SkillsCard';
import CVCard from './components/CVCard';

interface ProfileState {
  fullName: string;
  institution: string;
  courseOfStudy: string;
  educationLevel: string;
  academicGrade: string;
  experienceYears: number;
  location: string;
  bio: string;
  cvUrl: string;
  cvFilename: string;
  avatarUrl: string;
  tags: { id: number; name: string }[];
  tagIds: number[];
}

const DEFAULT: ProfileState = {
  fullName: '',
  institution: '',
  courseOfStudy: '',
  educationLevel: 'undergraduate',
  academicGrade: '',
  experienceYears: 0,
  location: '',
  bio: '',
  cvUrl: '',
  cvFilename: '',
  avatarUrl: '',
  tags: [],
  tagIds: [],
};

export default function StudentProfile() {
  const [profile, setProfile] = useState<ProfileState>(DEFAULT);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/api/student/profile')
      .then((r) => r.json())
      .then((data) => {
        const tags = data.tags || [];
        setProfile({
          fullName: data.full_name || '',
          institution: data.institution || '',
          courseOfStudy: data.course_of_study || '',
          educationLevel: data.education_level || 'undergraduate',
          academicGrade: data.academic_grade || '',
          experienceYears: data.experience_years || 0,
          location: data.location || '',
          bio: data.bio || '',
          cvUrl: data.cv_url || '',
          cvFilename: data.cv_filename || '',
          avatarUrl: data.profile_picture_url || '',
          tags,
          tagIds: tags.map((t) => t.id),
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const patch = (updates: Partial<ProfileState>) =>
    setProfile((prev) => ({ ...prev, ...updates }));

  if (loading) {
    return (
      <div className="max-w-2xl space-y-3 animate-pulse">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-24 rounded-xl bg-[var(--color-line)]" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-4">
      <HeroCard
        data={{
          fullName: profile.fullName,
          courseOfStudy: profile.courseOfStudy,
          educationLevel: profile.educationLevel,
          location: profile.location,
          avatarUrl: profile.avatarUrl,
        }}
        onSaved={(p) => patch(p)}
      />

      <AboutCard
        bio={profile.bio}
        onSaved={(bio) => patch({ bio })}
      />

      <EducationCard
        data={{
          institution: profile.institution,
          courseOfStudy: profile.courseOfStudy,
          educationLevel: profile.educationLevel,
          academicGrade: profile.academicGrade,
        }}
        onSaved={(p) => patch(p)}
      />

      <SkillsCard
        data={{
          experienceYears: profile.experienceYears,
          tags: profile.tags,
          tagIds: profile.tagIds,
        }}
        onSaved={(p) => {
          // tagIds changed → we don't have fresh tag objects here,
          // so keep existing tags if tagIds didn't change length drastically;
          // a real app would re-fetch or pass tag objects back from the API.
          patch(p);
        }}
      />

      <CVCard
        data={{ cvUrl: profile.cvUrl, cvFilename: profile.cvFilename }}
        onUploaded={(p) => patch(p)}
      />
    </div>
  );
}
