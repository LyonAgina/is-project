// @ts-nocheck
'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import ProfileCompleteness from '@/app/dashboard/student/profile/components/ProfileCompleteness';

const STATUS_STYLES = {
  submitted: { dot: 'var(--color-muted)', text: 'var(--color-ink)', bg: '#f1f5f9' },
  under_review: { dot: '#3b82f6', text: '#1e40af', bg: '#dbeafe' }, // Sky Blue to Navy
  accepted: { dot: '#10b981', text: '#065f46', bg: '#d1fae5' }, // Green for accepted
  rejected: { dot: '#ef4444', text: '#991b1b', bg: '#fee2e2' }, // Red for rejected
};

const STATUS_LABELS = {
  submitted: 'Submitted',
  under_review: 'Under review',
  accepted: 'Accepted',
  rejected: 'Rejected',
};

export default function StudentHome() {
  const [profile, setProfile] = useState(null);
  const [apps, setApps] = useState([]);
  const [unread, setUnread] = useState(0);
  const [opps, setOpps] = useState([]);
  const [tags, setTags] = useState([]);

  useEffect(() => {
    apiFetch('/api/student/profile').then(r => r.json()).then(d => {
      setProfile(d);
      setTags(Array.isArray(d.tags) ? d.tags : []);
    }).catch(() => {});
    apiFetch('/api/student/applications').then(r => r.json()).then(d => setApps(Array.isArray(d) ? d : [])).catch(() => {});
    apiFetch('/api/student/notifications').then(r => r.json()).then(d => setUnread(Array.isArray(d) ? d.filter(n => !n.is_read).length : 0)).catch(() => {});
    apiFetch('/api/student/opportunities').then(r => r.json()).then(d => setOpps(Array.isArray(d) ? d.slice(0, 3) : [])).catch(() => {});
  }, []);

  const accepted = apps.filter(a => a.status === 'accepted').length;
  const underReview = apps.filter(a => a.status === 'under_review').length;
  const recent = apps.slice(0, 4);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', paddingBottom: '40px' }}>
      
      {/* Welcome Section */}
      <div>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: 'var(--color-ink)', margin: '0 0 8px 0' }}>
          Welcome back{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}
        </h1>
        <p style={{ margin: 0, color: 'var(--color-muted)' }}>Here is a summary of your application activity.</p>
      </div>

      <ProfileCompleteness profile={profile} tags={tags} />

      {/* Stats Cards - Forced Grid with explicit gaps */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
        {[
          { label: 'Applications', value: apps.length, href: '/dashboard/student/applications', dot: '#1e3a8a' }, // Navy
          { label: 'Under review', value: underReview, href: '/dashboard/student/applications', dot: '#3b82f6' }, // Sky Blue
          { label: 'Accepted', value: accepted, href: '/dashboard/student/applications', dot: '#10b981' },
          { label: 'Unread Inbox', value: unread, href: '/dashboard/student/inbox', dot: '#ef4444' },
        ].map(s => (
          <Link
            key={s.label}
            href={s.href}
            style={{
              backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px', 
              border: '1px solid var(--color-line)', textDecoration: 'none',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', display: 'flex', 
              flexDirection: 'column', justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: s.dot }} />
              <p style={{ margin: 0, fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-muted)' }}>
                {s.label}
              </p>
            </div>
            <p style={{ margin: 0, fontSize: '36px', fontWeight: '700', color: 'var(--color-ink)' }}>{s.value}</p>
          </Link>
        ))}
      </div>

      {/* Recent & New Opportunities Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
        
        {/* Recent Applications */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid var(--color-line)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-line)', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: 'var(--color-ink)' }}>Recent applications</h2>
            <Link href="/dashboard/student/applications" style={{ fontSize: '13px', fontWeight: '500', color: '#1e3a8a', textDecoration: 'none' }}>
              View all &rarr;
            </Link>
          </div>
          <div>
            {recent.length === 0 ? (
              <div style={{ padding: '48px 24px', textAlign: 'center' }}>
                <p style={{ color: 'var(--color-muted)', marginBottom: '8px' }}>No applications yet.</p>
                <Link href="/dashboard/student/opportunities" style={{ fontSize: '14px', fontWeight: '500', color: '#1e3a8a' }}>Browse opportunities</Link>
              </div>
            ) : (
              <div>
                {recent.map((a, i) => {
                  const s = STATUS_STYLES[a.status] || STATUS_STYLES.submitted;
                  return (
                    <div key={a.id} style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: i !== 0 ? '1px solid var(--color-line)' : 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', overflow: 'hidden', paddingRight: '16px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: s.dot, flexShrink: 0 }} />
                        <div style={{ minWidth: 0 }}>
                          <p style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '600', color: 'var(--color-ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.title}</p>
                          <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.organization_name}</p>
                        </div>
                      </div>
                      <span style={{ backgroundColor: s.bg, color: s.text, padding: '4px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', whiteSpace: 'nowrap' }}>
                        {STATUS_LABELS[a.status]}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Latest Opportunities */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid var(--color-line)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-line)', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: 'var(--color-ink)' }}>New opportunities</h2>
            <Link href="/dashboard/student/opportunities" style={{ fontSize: '13px', fontWeight: '500', color: '#1e3a8a', textDecoration: 'none' }}>
              View all &rarr;
            </Link>
          </div>
          <div>
            {opps.length === 0 ? (
              <div style={{ padding: '48px 24px', textAlign: 'center' }}>
                <p style={{ color: 'var(--color-muted)' }}>No opportunities available right now.</p>
              </div>
            ) : (
              <div>
                {opps.map((o, i) => {
                  return (
                    <Link
                      key={o.id}
                      href={`/dashboard/student/opportunities/${o.id}`}
                      style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '16px', textDecoration: 'none', borderTop: i !== 0 ? '1px solid var(--color-line)' : 'none' }}
                    >
                      <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#f1f5f9', color: '#1e3a8a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '700', border: '1px solid var(--color-line)', flexShrink: 0 }}>
                        {(o.organization_name || '?')[0].toUpperCase()}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '600', color: 'var(--color-ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{o.title}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--color-muted)' }}>
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{o.organization_name}</span>
                          <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'var(--color-line)' }}></span>
                          <span style={{ whiteSpace: 'nowrap' }}>{o.location || 'Remote'}</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}