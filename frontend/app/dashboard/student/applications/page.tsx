// @ts-nocheck
'use client';
import { useEffect, useState, useMemo } from 'react';
import { apiFetch } from '@/lib/api';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ReportModal from "@/components/ReportModal";
import * as XLSX from "xlsx";


// Upgraded to our premium structural colors
const STATUS_COLORS = {
  submitted: { bg: '#f8fafc', fg: 'var(--color-ink)', border: '#e2e8f0', dot: 'var(--color-muted)' },
  under_review: { bg: '#dbeafe', fg: '#1e40af', border: '#bfdbfe', dot: '#3b82f6' }, // Sky Blue
  accepted: { bg: '#d1fae5', fg: '#065f46', border: '#a7f3d0', dot: '#10b981' }, // Green
  rejected: { bg: '#fee2e2', fg: '#991b1b', border: '#fecaca', dot: '#ef4444' }, // Red
};

const CATEGORY_COLORS = {
  job: { bg: '#eff6ff', fg: '#1e3a8a', border: '#bfdbfe' }, // Navy Blue theme
  internship: { bg: '#faf5ff', fg: '#7e22ce', border: '#e9d5ff' },
  scholarship: { bg: '#fffbeb', fg: '#92400e', border: '#fde68a' },
};
const DEFAULT_CATEGORY = { bg: '#f3f4f6', fg: '#4b5563', border: '#e5e7eb' };

const STATUS_LABELS = {
  submitted: 'Submitted',
  under_review: 'Under review',
  accepted: 'Accepted',
  rejected: 'Rejected',
};

const CATEGORY_ICONS = {
  job: (color) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  ),
  internship: (color) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c3.3 2 8.7 2 12 0v-5" />
    </svg>
  ),
  scholarship: (color) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="6" />
      <path d="M15.5 13.5 17 22l-5-3-5 3 1.5-8.5" />
    </svg>
  ),
  default: (color) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  ),
};

export default function StudentApplications() {
  const [apps, setApps] = useState([]);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [reportOpen, setReportOpen] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setError('');
    try {
      const res = await apiFetch('/api/student/applications');
      const data = await res.json();
      if (!res.ok || !Array.isArray(data)) throw new Error(data.error || 'Failed to load applications');
      setApps(data);
    } catch (err) {
      setError(err.message);
      setApps([]);
    }
  };

  const filtered = useMemo(() => {
    return apps.filter((a) => {
      const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        a.title?.toLowerCase().includes(q) ||
        a.organization_name?.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [apps, statusFilter, search]);

  const counts = useMemo(() => {
    return apps.reduce((acc, a) => {
      acc[a.status] = (acc[a.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [apps]);

const downloadPDF = () => {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const today = new Date();

  const total = apps.length;
  const submitted = apps.filter(a => a.status === "submitted").length;
  const underReview = apps.filter(a => a.status === "under_review").length;
  const accepted = apps.filter(a => a.status === "accepted").length;
  const rejected = apps.filter(a => a.status === "rejected").length;

  // =========================
  // Report Title
  // =========================
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("APPLICATION HISTORY REPORT", 148, 18, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(
    `Generated on: ${today.toLocaleDateString()} ${today.toLocaleTimeString()}`,
    14,
    30
  );

  // Divider
  doc.setDrawColor(180);
  doc.line(14, 34, 283, 34);

  // =========================
  // Summary
  // =========================
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text("SUMMARY", 14, 45);

  autoTable(doc, {
    startY: 50,
    theme: "grid",
    head: [["Metric", "Count"]],
    body: [
      ["Total Applications", total],
      ["Submitted", submitted],
      ["Under Review", underReview],
      ["Accepted", accepted],
      ["Rejected", rejected],
    ],
    styles: {
      fontSize: 11,
    },
    headStyles: {
      fillColor: [30, 58, 138],
    },
  });

  // =========================
  // Applications Table
  // =========================
  const rows = apps.map((a) => [
    a.title,
    a.organization_name,
    a.category,
    a.status.replace("_", " "),
    new Date(a.applied_at).toLocaleDateString(),
    a.deadline
      ? new Date(a.deadline).toLocaleDateString()
      : "N/A",
  ]);

  const finalY = (doc as any).lastAutoTable.finalY + 12;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text("APPLICATION DETAILS", 14, finalY);

  autoTable(doc, {
    startY: finalY + 5,
    head: [[
      "Title",
      "Organization",
      "Category",
      "Status",
      "Applied",
      "Deadline",
    ]],
    body: rows,
    theme: "striped",
    styles: {
      fontSize: 9,
      cellPadding: 3,
      overflow: "linebreak",
    },
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: 255,
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
  });

  // =========================
  // Footer (Page Numbers)
  // =========================
  const pageCount = doc.getNumberOfPages();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    doc.setDrawColor(180);
    doc.line(14, 195, 283, 195);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");

    doc.text(
      "Generated by Student Opportunities Management System",
      14,
      202
    );

    doc.text(
      `Page ${i} of ${pageCount}`,
      283,
      202,
      { align: "right" }
    );
  }
  const timestamp = today
    .toISOString()
    .replace(/[:.]/g, "-")
    .replace("T", "_")
    .replace("Z", "");

  doc.save(`Application_History_Report_${timestamp}.pdf`);
};

const downloadExcel = () => {
  const data = apps.map((a) => ({
    Opportunity: a.title,
    Organization: a.organization_name,
    Category: a.category,
    Status: (a.status || "").replace("_", " "),
    Applied: new Date(a.applied_at).toLocaleDateString(),
    Deadline: a.deadline
      ? new Date(a.deadline).toLocaleDateString()
      : "N/A",
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);

  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    "Applications"
  );

  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, "-")
    .replace("T", "_")
    .replace("Z", "");

  XLSX.writeFile(
    workbook,
    `Application_History_Report_${timestamp}.xlsx`
  );
};

  return (
    <div style={{ maxWidth: '900px' }}>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          #applications-report, #applications-report * { visibility: visible; }
          #applications-report { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div id="applications-report">
        {/* Header */}
        <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '700', color: 'var(--color-ink)', margin: '0 0 8px 0' }}>Application history</h1>
            <p style={{ margin: 0, color: 'var(--color-muted)' }}>Track the status of everything you've applied to.</p>
          </div>
          {apps.length > 0 && (
            <button
              onClick={() => setReportOpen(true)}
              className="no-print"
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                backgroundColor: '#1e3a8a', color: '#ffffff', border: 'none',
                padding: '10px 18px', borderRadius: '10px', fontSize: '14px', fontWeight: '600',
                cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(30, 58, 138, 0.2)',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download report
            </button>
          )}

          <ReportModal
            open={reportOpen}
            onClose={() => setReportOpen(false)}
            onPDF={downloadPDF}
            onExcel={downloadExcel}
            title="Generate Application Report"
          />
        </div>

        {/* Interactive Summary Stats (Acts as filters) */}
        {apps.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }} className="stats-grid">
            {(['submitted', 'under_review', 'accepted', 'rejected'] as const).map((s) => {
              const active = statusFilter === s;
              const c = STATUS_COLORS[s];
              return (
                <button
                  key={s}
                  onClick={() => setStatusFilter(active ? 'all' : s)}
                  className="no-print"
                  style={{
                    backgroundColor: active ? c.bg : '#ffffff',
                    borderRadius: '16px',
                    padding: '24px',
                    border: active ? `2px solid ${c.dot}` : '1px solid var(--color-line)',
                    textAlign: 'left',
                    cursor: 'pointer',
                    boxShadow: active ? `0 4px 12px -2px ${c.dot}30` : '0 4px 6px -1px rgba(0, 0, 0, 0.02)',
                    transition: 'all 0.2s',
                    outline: 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: c.dot }} />
                    <p style={{ margin: 0, fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', color: active ? c.fg : 'var(--color-muted)' }}>
                      {STATUS_LABELS[s]}
                    </p>
                  </div>
                  <p style={{ margin: 0, fontSize: '36px', fontWeight: '700', color: active ? c.fg : 'var(--color-ink)' }}>
                    {counts[s] || 0}
                  </p>
                </button>
              );
            })}
          </div>
        )}

        {/* Cleaned Search Toolbar (Removed redundant dropdown) */}
        <div className="no-print" style={{
          display: 'flex', backgroundColor: '#ffffff', padding: '16px',
          borderRadius: '16px', border: '1px solid var(--color-line)',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', marginBottom: '32px'
        }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <svg
              style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
              width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Search your applications by title or organization…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%', padding: '12px 16px 12px 42px', borderRadius: '10px',
                border: '1px solid var(--color-line)', backgroundColor: '#f8fafc',
                fontSize: '14px', outline: 'none', transition: 'border-color 0.2s',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#1e3a8a'}
              onBlur={(e) => e.target.style.borderColor = 'var(--color-line)'}
            />
          </div>
        </div>

        {/* Warnings & States */}
        {error && (
          <div style={{ padding: '16px', borderRadius: '12px', border: '1px solid #fecaca', backgroundColor: '#fef2f2', color: '#b91c1c', marginBottom: '24px', fontSize: '14px' }}>
            {error}
          </div>
        )}

        {!error && apps.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 24px', textAlign: 'center', borderRadius: '16px', border: '2px dashed var(--color-line)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              {CATEGORY_ICONS.default('#9ca3af')}
            </div>
            <p style={{ fontWeight: '600', fontSize: '16px', color: 'var(--color-ink)', margin: '0 0 4px 0' }}>You haven't applied to anything yet</p>
            <p style={{ fontSize: '14px', color: 'var(--color-muted)', margin: 0 }}>Applications you submit will show up here.</p>
          </div>
        )}

        {!error && apps.length > 0 && filtered.length === 0 && (
          <div style={{ padding: '48px', textAlign: 'center', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid var(--color-line)' }}>
            <p style={{ fontSize: '15px', color: 'var(--color-muted)', fontWeight: '500', margin: 0 }}>No applications match your current search or filter.</p>
          </div>
        )}

        {/* Application List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {filtered.map((a) => {
            const c = STATUS_COLORS[a.status] || STATUS_COLORS.submitted;
            const catColor = CATEGORY_COLORS[a.category] || DEFAULT_CATEGORY;
            const iconFn = CATEGORY_ICONS[a.category] || CATEGORY_ICONS.default;

            return (
              <div
                key={a.id}
                style={{
                  display: 'flex', gap: '20px', padding: '24px', borderRadius: '16px',
                  backgroundColor: '#ffffff', border: '1px solid var(--color-line)',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)'
                }}
              >
                {/* Category icon badge */}
                <div style={{ flexShrink: 0, width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: catColor.bg, border: `1px solid ${catColor.border}` }}>
                  {iconFn(catColor.fg)}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap', marginBottom: '16px' }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--color-ink)', margin: '0 0 6px 0', lineHeight: '1.3' }}>{a.title}</h2>
                      <p style={{ fontSize: '14px', color: 'var(--color-muted)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: '500' }}>{a.organization_name}</span>
                        <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'var(--color-line)' }}></span>
                        <span style={{ textTransform: 'capitalize' }}>{a.category}</span>
                      </p>
                    </div>

                    {/* Status Badge */}
                    <div style={{ flexShrink: 0 }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600',
                        padding: '6px 14px', borderRadius: '999px', backgroundColor: c.bg, color: c.fg, border: `1px solid ${c.border}`, whiteSpace: 'nowrap'
                      }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: c.dot }}></span>
                        {STATUS_LABELS[a.status] || a.status}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px', paddingTop: '16px', borderTop: '1px solid var(--color-line)', fontSize: '13px', color: 'var(--color-muted)' }}>
                    <span><strong style={{ color: 'var(--color-ink)' }}>Applied:</strong> {new Date(a.applied_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    {a.deadline && <span><strong style={{ color: 'var(--color-ink)' }}>Deadline:</strong> {new Date(a.deadline).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
} n