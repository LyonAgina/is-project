// @ts-nocheck
'use client';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

export default function TagPicker({ selectedIds, onChange }) {
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState('');
  const [newType, setNewType] = useState('skill');

  useEffect(() => {
    apiFetch('/api/tags').then((res) => res.json()).then(setTags).catch(() => {});
  }, []);

  const toggle = (id) => {
    onChange(selectedIds.includes(id) ? selectedIds.filter((t) => t !== id) : [...selectedIds, id]);
  };

  const addTag = async () => {
    if (!newTag.trim()) return;
    const res = await apiFetch('/api/tags', { method: 'POST', body: JSON.stringify({ name: newTag.trim(), type: newType }) });
    const tag = await res.json();
    setTags((prev) => (prev.find((t) => t.id === tag.id) ? prev : [...prev, tag]));
    onChange([...selectedIds, tag.id]);
    setNewTag('');
  };

  const renderGroup = (type, accentVar) => (
    <div>
      <p className="text-sm font-medium mb-2 capitalize">{type}s</p>
      <div className="flex flex-wrap gap-2">
        {tags.filter((t) => t.type === type).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => toggle(t.id)}
            className={`text-xs px-3 py-1.5 rounded-full border ${
              selectedIds.includes(t.id)
                ? `text-white border-transparent`
                : 'border-[var(--color-line)] text-[var(--color-muted)]'
            }`}
            style={selectedIds.includes(t.id) ? { backgroundColor: accentVar } : {}}
          >
            {t.name}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {renderGroup('skill', 'var(--color-ink)')}
      {renderGroup('interest', 'var(--color-accent-2)')}
      <div className="flex gap-2 items-center pt-1">
        <input
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          placeholder="Add a tag not listed"
          className="border border-[var(--color-line)] rounded-md px-2 py-1 text-sm flex-1"
        />
        <select value={newType} onChange={(e) => setNewType(e.target.value)} className="border border-[var(--color-line)] rounded-md px-2 py-1 text-sm">
          <option value="skill">Skill</option>
          <option value="interest">Interest</option>
        </select>
        <button type="button" onClick={addTag} className="text-sm border border-[var(--color-line)] px-3 py-1 rounded-md">
          Add
        </button>
      </div>
    </div>
  );
}