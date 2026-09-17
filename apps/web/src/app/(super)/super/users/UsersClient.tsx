'use client';

import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  is_active: boolean;
  institution_id: string | null;
  institutions: { name: string } | null;
}

export function UsersClient({ users }: { users: User[] }) {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const filtered = useMemo(() => {
    let list = users;
    if (roleFilter) list = list.filter((u) => u.role === roleFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (u) =>
          u.first_name.toLowerCase().includes(q) ||
          u.last_name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q)
      );
    }
    return list;
  }, [users, search, roleFilter]);

  return (
    <>
      <PageHeader
        title="Users"
        subtitle={`${users.length} total across all institutions`}
      />

      <div className="mt-6 flex flex-wrap gap-3 items-end">
        <div className="min-w-[240px]">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email…"
          />
        </div>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="">All roles</option>
          <option value="institution_admin">Admin</option>
          <option value="teacher">Teacher</option>
          <option value="student">Student</option>
          <option value="super_admin">Super Admin</option>
        </select>
      </div>

      <div className="mt-4 card-premium overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState
            icon="person_search"
            title="No users found"
            description="Try a different search or filter."
          />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-surface-container-low text-xs uppercase tracking-wider text-on-surface-variant">
              <tr>
                <th className="px-6 py-3 text-start font-semibold">Name</th>
                <th className="px-6 py-3 text-start font-semibold">Email</th>
                <th className="px-6 py-3 text-start font-semibold">Role</th>
                <th className="px-6 py-3 text-start font-semibold">Institution</th>
                <th className="px-6 py-3 text-start font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-surface-container-low/50">
                  <td className="px-6 py-3 font-medium text-on-surface">
                    {u.first_name} {u.last_name}
                  </td>
                  <td className="px-6 py-3 text-on-surface-variant">{u.email}</td>
                  <td className="px-6 py-3 text-on-surface-variant capitalize">
                    {u.role.replace('_', ' ')}
                  </td>
                  <td className="px-6 py-3 text-on-surface-variant">
                    {u.institutions?.name ?? '—'}
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className={`text-xs font-semibold ${
                        u.is_active ? 'text-success' : 'text-error'
                      }`}
                    >
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
