// @ts-nocheck
'use client';
import { useEffect, useState, useMemo } from 'react';
import { apiFetch } from '@/lib/api';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ReportModal from '@/components/ReportModal';
import * as XLSX from "xlsx";


export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [notifyTarget, setNotifyTarget] = useState(null);
  const [notifyMessage, setNotifyMessage] = useState('');
  const [notifyError, setNotifyError] = useState('');
  const [notifySuccess, setNotifySuccess] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [reportOpen, setReportOpen] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setError('');
    try {
      const res = await apiFetch('/api/admin/users');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load users');
      setUsers(Array.isArray(data) ? data : []);
    } catch (e: any) { setError(e.message); }
  };

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const q = search.toLowerCase();
      const matchSearch = !q || u.email.toLowerCase().includes(q);
      const matchRole = roleFilter === 'all' || u.role === roleFilter;
      const matchStatus = statusFilter === 'all' || (statusFilter === 'active' && u.is_active) || (statusFilter === 'inactive' && !u.is_active);
      return matchSearch && matchRole && matchStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  const toggleActive = async (u) => {
    setActionLoading(u.id);
    try {
      const res = await apiFetch(`/api/admin/users/${u.id}/toggle-active`, { method: 'PUT' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, is_active: data.is_active } : x)));
    } catch (e: any) { alert(e.message); } finally { setActionLoading(null); }
  };

  const deleteUser = async (u) => {
    if (!confirm(`Delete ${u.email}? This cannot be undone.`)) return;
    setActionLoading(u.id);
    try {
      const res = await apiFetch(`/api/admin/users/${u.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUsers((prev) => prev.filter((x) => x.id !== u.id));
    } catch (e: any) { alert(e.message); } finally { setActionLoading(null); }
  };

  const sendNotification = async () => {
    if (!notifyMessage.trim()) { setNotifyError('Message cannot be empty'); return; }
    setNotifyError(''); setNotifySuccess('');
    try {
      const res = await apiFetch(`/api/admin/users/${notifyTarget.id}/notify`, { method: 'POST', body: JSON.stringify({ message: notifyMessage }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setNotifySuccess('Notification sent!');
      setNotifyMessage('');
      setTimeout(() => { setNotifyTarget(null); setNotifySuccess(''); }, 1500);
    } catch (e: any) { setNotifyError(e.message); }
  };

  const downloadReport = () => {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const now = new Date();

  const totalUsers = users.length;
  const students = users.filter(u => u.role === "student").length;
  const organizations = users.filter(u => u.role === "organization").length;
  const admins = users.filter(u => u.role === "admin").length;
  const active = users.filter(u => u.is_active).length;
  const inactive = users.filter(u => !u.is_active).length;

  // =============================
  // Title
  // =============================

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("USERS REPORT", 148, 18, {
    align: "center",
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);

  doc.text(
    `Generated on: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`,
    14,
    30
  );

  doc.setDrawColor(180);
  doc.line(14, 34, 283, 34);

  // =============================
  // Summary
  // =============================

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text("SUMMARY", 14, 45);

  autoTable(doc, {
    startY: 50,
    theme: "grid",
    head: [["Metric", "Count"]],
    body: [
      ["Total Users", totalUsers],
      ["Students", students],
      ["Organizations", organizations],
      ["Administrators", admins],
      ["Active Users", active],
      ["Inactive Users", inactive],
    ],
    headStyles: {
      fillColor: [30, 58, 138],
    },
    styles: {
      fontSize: 11,
    },
  });

  // =============================
  // User Details
  // =============================

  const rows = users.map((u) => [
    u.email,
    u.role,
    u.is_active ? "Active" : "Inactive",
    new Date(u.created_at).toLocaleDateString(),
  ]);

  const finalY = doc.lastAutoTable.finalY + 12;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text("USER DETAILS", 14, finalY);

  autoTable(doc, {
    startY: finalY + 5,
    theme: "striped",
    head: [[
      "Email",
      "Role",
      "Status",
      "Joined",
    ]],
    body: rows,
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: 255,
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
  });

  // =============================
  // Footer
  // =============================

  const pageCount = doc.getNumberOfPages();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    doc.setDrawColor(180);
    doc.line(14, 195, 283, 195);

    doc.setFontSize(9);

    doc.text(
      "Generated by Student Opportunities Management System",
      14,
      202
    );

    doc.text(
      `Page ${i} of ${pageCount}`,
      283,
      202,
      {
        align: "right",
      }
    );
  }

  // =============================
  // Unique filename
  // =============================

  const timestamp = now
    .toISOString()
    .replace(/:/g, "-")
    .replace("T", "_")
    .split(".")[0];

  doc.save(`Users_Report_${timestamp}.pdf`);
};

const downloadExcelReport = () => {
  const headers = [
    "Email",
    "Role",
    "Status",
    "Joined Date",
  ];

  const rows = users.map((u) => [
    `"${u.email}"`,
    u.role,
    u.is_active ? "Active" : "Inactive",
    new Date(u.created_at).toLocaleDateString(),
  ]);

  const csv = [
    headers.join(","),
    ...rows.map((r) => r.join(","))
  ].join("\n");

  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8;",
  });

  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);

  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, "-");

  link.download = `Users_Report_${timestamp}.csv`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(link.href);
};

  return (
    <div style={{ fontFamily: 'var(--font-body-text), sans-serif' }}>
      <div
  style={{
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px'
  }}
>
  <h1
    style={{
      fontSize: '28px',
      fontWeight: '700',
      color: 'var(--color-ink)',
      margin: 0
    }}
  >
    User Management
  </h1>

  {users.length > 0 && (
    <button
      onClick={() => setReportOpen(true)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        backgroundColor: '#1e3a8a',
        color: '#ffffff',
        border: 'none',
        padding: '10px 18px',
        borderRadius: '10px',
        fontSize: '14px',
        fontWeight: '600',
        cursor: 'pointer',
        boxShadow: '0 4px 6px -1px rgba(30,58,138,0.2)',
        fontFamily: 'inherit',
      }}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>

      Download Report
    </button>
    )}
    <ReportModal
  open={reportOpen}
  onClose={() => setReportOpen(false)}
  title="Generate Users Report"
  onPDF={downloadReport}
  onExcel={() => {
    const headers = [
      "Email",
      "Role",
      "Status",
      "Joined Date"
    ];

    const rows = users.map((u) => [
      `"${u.email}"`,
      u.role,
      u.is_active ? "Active" : "Inactive",
      new Date(u.created_at).toLocaleDateString(),
    ]);

    const csv = [
      headers.join(","),
      ...rows.map(r => r.join(","))
    ].join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);

    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-");

    link.download = `Users_Report_${timestamp}.csv`;
    link.click();

    URL.revokeObjectURL(link.href);
  }}
/>
</div>

      {error && <p style={{ color: '#dc2626', fontWeight: '600', padding: '16px', backgroundColor: 'rgba(220,38,38,0.05)', borderRadius: '12px', marginBottom: '24px' }}>{error}</p>}

      {/* Control Bar */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '260px', position: 'relative' }}>
          <svg style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input
            type="text" placeholder="Search users by email…" value={search} onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', padding: '12px 16px 12px 42px', borderRadius: '12px', border: '1px solid var(--color-line)', backgroundColor: '#ffffff', fontSize: '14px', outline: 'none', color: 'var(--color-ink)', fontWeight: '500', fontFamily: 'inherit', boxSizing: 'border-box' }}
          />
        </div>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} style={{ padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--color-line)', backgroundColor: '#ffffff', fontSize: '14px', fontWeight: '600', color: 'var(--color-ink)', cursor: 'pointer', fontFamily: 'inherit' }}>
          <option value="all">All Roles</option><option value="student">Student</option><option value="organization">Organization</option><option value="admin">Admin</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--color-line)', backgroundColor: '#ffffff', fontSize: '14px', fontWeight: '600', color: 'var(--color-ink)', cursor: 'pointer', fontFamily: 'inherit' }}>
          <option value="all">All Statuses</option><option value="active">Active</option><option value="inactive">Inactive</option>
        </select>
      </div>

      <p style={{ fontSize: '13px', color: 'var(--color-muted)', fontWeight: '600', marginBottom: '16px' }}>Showing {filtered.length} user(s)</p>

      {/* Main Table */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid var(--color-line)', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ backgroundColor: 'var(--color-paper)', borderBottom: '1px solid var(--color-line)' }}>
            <tr>
              {['Email Address', 'Role', 'Status', 'Joined Date', 'Actions'].map(h => (
                <th key={h} style={{ padding: '16px 24px', fontSize: '11px', fontWeight: '700', color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan="5" style={{ padding: '48px', textAlign: 'center', color: 'var(--color-muted)', fontWeight: '500' }}>No users match your criteria.</td></tr>
            ) : filtered.map((u) => (
              <tr key={u.id} style={{ borderBottom: '1px solid var(--color-line)' }}>
                <td style={{ padding: '16px 24px', fontSize: '14px', fontWeight: '600', color: 'var(--color-ink)' }}>{u.email}</td>
                <td style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--color-muted)', fontWeight: '600', textTransform: 'capitalize' }}>{u.role}</td>
                <td style={{ padding: '16px 24px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '700', padding: '4px 10px', borderRadius: '6px', textTransform: 'uppercase', letterSpacing: '0.05em', backgroundColor: u.is_active ? '#f0fdf4' : '#fef2f2', color: u.is_active ? '#15803d' : '#b91c1c', border: `1px solid ${u.is_active ? '#bbf7d0' : '#fecaca'}` }}>
                    {u.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--color-muted)', fontWeight: '500' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                <td style={{ padding: '16px 24px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => toggleActive(u)} disabled={actionLoading === u.id} style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', backgroundColor: '#ffffff', border: `1px solid ${u.is_active ? '#fcd34d' : '#86efac'}`, color: u.is_active ? '#b45309' : '#15803d', fontFamily: 'inherit' }}>
                      {u.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    {u.role === 'student' && (
                      <button onClick={() => { setNotifyTarget(u); setNotifyMessage(''); setNotifyError(''); setNotifySuccess(''); }} style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', backgroundColor: '#ffffff', border: '1px solid #bfdbfe', color: '#1e3a8a', fontFamily: 'inherit' }}>
                        Notify
                      </button>
                    )}
                    <button onClick={() => deleteUser(u)} disabled={actionLoading === u.id} style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', backgroundColor: '#ffffff', border: '1px solid #fecaca', color: '#dc2626', fontFamily: 'inherit' }}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Notify Modal */}
      {notifyTarget && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.4)', padding: '16px' }}>
          <div style={{ width: '100%', maxWidth: '440px', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid var(--color-line)', padding: '32px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontFamily: 'var(--font-disp), sans-serif', fontSize: '20px', fontWeight: '700', color: 'var(--color-ink)', marginBottom: '8px' }}>Send Notification</h2>
            <p style={{ fontSize: '13px', color: 'var(--color-muted)', fontWeight: '500', marginBottom: '20px' }}>Target: <strong style={{ color: 'var(--color-ink)' }}>{notifyTarget.email}</strong></p>
            
            <textarea
              value={notifyMessage} onChange={(e) => setNotifyMessage(e.target.value)} placeholder="Type a message to push to this user's inbox..." rows={4}
              style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--color-line)', fontSize: '14px', fontFamily: 'inherit', resize: 'none', outline: 'none', marginBottom: '16px', boxSizing: 'border-box' }}
            />
            {notifyError && <p style={{ fontSize: '13px', color: '#dc2626', fontWeight: '600', marginBottom: '16px' }}>{notifyError}</p>}
            {notifySuccess && <p style={{ fontSize: '13px', color: '#10b981', fontWeight: '600', marginBottom: '16px' }}>{notifySuccess}</p>}
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button onClick={() => setNotifyTarget(null)} style={{ padding: '10px 20px', borderRadius: '10px', fontSize: '14px', fontWeight: '600', backgroundColor: '#ffffff', border: '1px solid var(--color-line)', color: 'var(--color-ink)', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
              <button onClick={sendNotification} style={{ padding: '10px 20px', borderRadius: '10px', fontSize: '14px', fontWeight: '600', backgroundColor: '#1e3a8a', border: 'none', color: '#ffffff', cursor: 'pointer', fontFamily: 'inherit' }}>Push Alert</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}