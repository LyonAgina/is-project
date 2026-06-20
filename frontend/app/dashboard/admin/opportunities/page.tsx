// @ts-nocheck
'use client';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

export default function AdminOpportunities() {
  const [opps, setOpps] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const res = await apiFetch('/api/admin/opportunities');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load');
      setOpps(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await apiFetch(`/api/admin/opportunities/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      setOpps((prev) => prev.filter((o) => o.id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteExpired = async () => {
    try {
      const res = await apiFetch('/api/admin/opportunities/expired', { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete expired');
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const isExpired = (deadline) => deadline && new Date(deadline) < new Date();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-display text-2xl font-bold">All opportunities</h1>
        <button onClick={handleDeleteExpired} className="border border-[var(--color-line)] px-3 py-1.5 rounded-md text-sm">
          Delete all expired
        </button>
      </div>
      {error && <p className="text-red-600 mb-4">{error}</p>}
      <table className="w-full text-sm border border-[var(--color-line)] rounded-xl overflow-hidden">
        <thead className="bg-[var(--color-paper)] text-left">
          <tr>
            <th className="p-3">Title</th>
            <th className="p-3">Organization</th>
            <th className="p-3">Category</th>
            <th className="p-3">Status</th>
            <th className="p-3">Deadline</th>
            <th className="p-3"></th>
          </tr>
        </thead>
        <tbody>
          {opps.map((o) => (
            <tr key={o.id} className="border-t border-[var(--color-line)]">
              <td className="p-3">{o.title}</td>
              <td className="p-3">{o.organization_name}</td>
              <td className="p-3 capitalize">{o.category}</td>
              <td className="p-3 capitalize">{o.status}</td>
              <td className={`p-3 ${isExpired(o.deadline) ? 'text-red-600' : ''}`}>
                {o.deadline ? new Date(o.deadline).toLocaleDateString() : '—'}
              </td>
              <td className="p-3">
                <button onClick={() => handleDelete(o.id)} className="text-red-600 text-sm">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}