// @ts-nocheck
'use client';
import { useEffect, useState, useMemo } from 'react';
import { apiFetch } from '@/lib/api';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [notifyTarget, setNotifyTarget] = useState<null | { id: number; email: string }>(null);
  const [notifyMessage, setNotifyMessage] = useState('');
  const [notifyError, setNotifyError] = useState('');
  const [notifySuccess, setNotifySuccess] = useState('');
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setError('');
    try {
      const res = await apiFetch('/api/admin/users');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load users');
      setUsers(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const q = search.toLowerCase();
      const matchSearch = !q || u.email.toLowerCase().includes(q);
      const matchRole = roleFilter === 'all' || u.role === roleFilter;
      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && u.is_active) ||
        (statusFilter === 'inactive' && !u.is_active);
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
    } catch (e: any) {
      alert(e.message);
    } finally {
      setActionLoading(null);
    }
  };

  const deleteUser = async (u) => {
    if (!confirm(`Delete ${u.email}? This cannot be undone.`)) return;
    setActionLoading(u.id);
    try {
      const res = await apiFetch(`/api/admin/users/${u.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUsers((prev) => prev.filter((x) => x.id !== u.id));
    } catch (e: any) {
      alert(e.message);
    } finally {
      setActionLoading(null);
    }
  };

  const sendNotification = async () => {
    if (!notifyMessage.trim()) {
      setNotifyError('Message cannot be empty');
      return;
    }
    setNotifyError('');
    setNotifySuccess('');
    try {
      const res = await apiFetch(`/api/admin/users/${notifyTarget.id}/notify`, {
        method: 'POST',
        body: JSON.stringify({ message: notifyMessage }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setNotifySuccess('Notification sent!');
      setNotifyMessage('');
      setTimeout(() => { setNotifyTarget(null); setNotifySuccess(''); }, 1500);
    } catch (e: any) {
      setNotifyError(e.message);
    }
  };

  return (
    <div>
      <h1 className="font-display text-2xl font-bold mb-6">Users</h1>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            placeholder="Search by email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-[var(--color-line)] bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-ink)]"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-lg border border-[var(--color-line)] bg-transparent px-3 py-2 text-sm"
        >
          <option value="all">All roles</option>
          <option value="student">Student</option>
          <option value="organization">Organization</option>
          <option value="admin">Admin</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-[var(--color-line)] bg-transparent px-3 py-2 text-sm"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <p className="text-xs text-[var(--color-muted)] mb-3">{filtered.length} user{filtered.length !== 1 ? 's' : ''} shown</p>

      <div className="overflow-x-auto rounded-xl border border-[var(--color-line)]">
        <table className="w-full text-sm">
          <thead className="bg-[var(--color-paper)] text-left">
            <tr>
              <th className="p-3">Email</th>
              <th className="p-3">Role</th>
              <th className="p-3">Status</th>
              <th className="p-3">Joined</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id} className="border-t border-[var(--color-line)]">
                <td className="p-3 font-medium">{u.email}</td>
                <td className="p-3 capitalize">{u.role}</td>
                <td className="p-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${u.is_active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                    {u.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="p-3 text-[var(--color-muted)]">{new Date(u.created_at).toLocaleDateString()}</td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleActive(u)}
                      disabled={actionLoading === u.id}
                      className={`text-xs px-2 py-1 rounded border transition-colors disabled:opacity-40 ${u.is_active ? 'border-amber-300 text-amber-700 hover:bg-amber-50' : 'border-green-300 text-green-700 hover:bg-green-50'}`}
                    >
                      {u.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    {u.role === 'student' && (
                      <button
                        onClick={() => { setNotifyTarget(u); setNotifyMessage(''); setNotifyError(''); setNotifySuccess(''); }}
                        className="text-xs px-2 py-1 rounded border border-blue-200 text-blue-700 hover:bg-blue-50 transition-colors"
                      >
                        Notify
                      </button>
                    )}
                    <button
                      onClick={() => deleteUser(u)}
                      disabled={actionLoading === u.id}
                      className="text-xs px-2 py-1 rounded border border-red-200 text-red-700 hover:bg-red-50 transition-colors disabled:opacity-40"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-[var(--color-muted)]">No users found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Notify modal */}
      {notifyTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-[var(--color-line)] p-6 w-full max-w-md shadow-xl">
            <h2 className="font-semibold text-lg mb-1">Send notification</h2>
            <p className="text-sm text-[var(--color-muted)] mb-4">To: {notifyTarget.email}</p>
            <textarea
              value={notifyMessage}
              onChange={(e) => setNotifyMessage(e.target.value)}
              placeholder="Write a message…"
              rows={3}
              className="w-full rounded-lg border border-[var(--color-line)] bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-ink)] mb-3"
            />
            {notifyError && <p className="text-red-600 text-sm mb-2">{notifyError}</p>}
            {notifySuccess && <p className="text-green-600 text-sm mb-2">{notifySuccess}</p>}
            <div className="flex gap-3 justify-end">
              <button onClick={() => setNotifyTarget(null)} className="text-sm px-4 py-2 rounded-lg border border-[var(--color-line)] hover:bg-[var(--color-paper)]">
                Cancel
              </button>
              <button onClick={sendNotification} className="text-sm px-4 py-2 rounded-lg bg-[var(--color-ink)] text-white hover:opacity-90">
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}