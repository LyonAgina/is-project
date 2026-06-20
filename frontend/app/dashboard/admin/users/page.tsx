// @ts-nocheck
'use client';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch('/api/admin/users')
      .then((res) => res.json())
      .then(setUsers)
      .catch(() => setError('Failed to load users'));
  }, []);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold mb-6">All users</h1>
      {error && <p className="text-red-600">{error}</p>}
      <table className="w-full text-sm border border-[var(--color-line)] rounded-xl overflow-hidden">
        <thead className="bg-[var(--color-paper)] text-left">
          <tr>
            <th className="p-3">Email</th>
            <th className="p-3">Role</th>
            <th className="p-3">Active</th>
            <th className="p-3">Joined</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-t border-[var(--color-line)]">
              <td className="p-3">{u.email}</td>
              <td className="p-3 capitalize">{u.role}</td>
              <td className="p-3">{u.is_active ? 'Yes' : 'No'}</td>
              <td className="p-3">{new Date(u.created_at).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}