// @ts-nocheck
'use client';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import HeroCard from './components/HeroCard';
import AboutCard from './components/AboutCard';
import EducationCard from './components/EducationCard';
import SkillsCard from './components/SkillsCard';
import CVCard from './components/CVCard';

const DEFAULT = {
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
  const [profile, setProfile] = useState(DEFAULT);
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

  const patch = (updates) => setProfile((prev) => ({ ...prev, ...updates }));

  if (loading) {
    return (
      <div style={{ maxWidth: '900px', padding: '24px' }}>
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '900px', display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '48px', margin: '0 auto' }}>
      
      {/* 1. Header Hero Section */}
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

      {/* 2. About Section */}
      <AboutCard 
        bio={profile.bio} 
        onSaved={(bio) => patch({ bio })} 
      />
      
      {/* 3. Education Section (with dropdown support) */}
      <EducationCard 
        data={{ 
          institution: profile.institution, 
          courseOfStudy: profile.courseOfStudy, 
          educationLevel: profile.educationLevel, 
          academicGrade: profile.academicGrade 
        }} 
        onSaved={(p) => patch(p)} 
      />
      
      {/* 4. Combined Skills & Experience Section */}
      <SkillsCard 
        data={{ 
          experienceYears: profile.experienceYears, 
          tags: profile.tags, 
          tagIds: profile.tagIds 
        }} 
        onSaved={(p) => patch(p)} 
      />
      
      {/* 5. CV / Résumé Section */}
      <CVCard 
        data={{ cvUrl: profile.cvUrl, cvFilename: profile.cvFilename }} 
        onUploaded={(p) => patch(p)} 
      />
      
    </div>
  );
}