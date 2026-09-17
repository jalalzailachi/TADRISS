'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/ui/PageHeader';
import { SlideOver } from '@/components/ui/SlideOver';
import { EmptyState } from '@/components/ui/EmptyState';
import Link from 'next/link';

interface UserRow {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export function UsersSettingsClient({
  users,
  institutionId,
}: {
  users: UserRow[];
  institutionId: string;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState<'teacher' | 'student'>('teacher');

  const reset = () => {
    setEmail('');
    setFirstName('');
    setLastName('');
    setRole('teacher');
  };

  const invite = () => {
    if (!email.trim() || !firstName.trim() || !lastName.trim()) {
      toast.error('All fields required');
      return;
    }
    startTransition(async () => {
      try {
        const res = await fetch('/api/invite-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            first_name: firstName,
            last_name: lastName,
            role,
            institution_id: institutionId,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to invite');
        toast.success('User invited');
        reset();
        setOpen(false);
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Failed to invite');
      }
    });
  };

  const admins = users.filter((u) => u.role === 'institution_admin');
  const teachers = users.filter((u) => u.role === 'teacher');
  const students = users.filter((u) => u.role === 'student');

  return (
    <>
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/dashboard/settings"
          className="inline-flex items-center gap-1 text-sm text-on-surface-variant hover:text-primary"
        >
          <span className="material-symbols-outlined text-[16px]">
            arrow_back
          </span>
          Settings
        </Link>
      </div>

      <PageHeader
        title="Users"
        subtitle={`${users.length} total`}
        action={
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-on-primary shadow-sm hover:bg-primary-container transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">
              person_add
            </span>
            Invite user
          </button>
        }
      />

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard label="Admins" count={admins.length} icon="shield" />
        <StatCard label="Teachers" count={teachers.length} icon="badge" />
        <StatCard label="Students" count={students.length} icon="school" />
      </div>

      <div className="card-premium overflow-hidden">
        {users.length === 0 ? (
          <EmptyState
            icon="group"
            title="No users"
            description="Invite teachers and students to get started."
          />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-surface-container-low text-xs uppercase tracking-wider text-on-surface-variant">
              <tr>
                <th className="px-6 py-3 text-start font-semibold">Name</th>
                <th className="px-6 py-3 text-start font-semibold">Email</th>
                <th className="px-6 py-3 text-start font-semibold">Role</th>
                <th className="px-6 py-3 text-start font-semibold">Status</th>
                <th className="px-6 py-3 text-start font-semibold">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-surface-container-low/50">
                  <td className="px-6 py-3 font-medium text-on-surface">
                    {u.first_name} {u.last_name}
                  </td>
                  <td className="px-6 py-3 text-on-surface-variant">
                    {u.email}
                  </td>
                  <td className="px-6 py-3 text-on-surface-variant capitalize">
                    {u.role.replace('_', ' ')}
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        u.is_active
                          ? 'bg-success-soft text-on-success-soft'
                          : 'bg-error-soft text-on-error-soft'
                      }`}
                    >
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-xs text-on-surface-variant">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <SlideOver
        open={open}
        onClose={() => setOpen(false)}
        title="Invite user"
        description="Send an invitation to a new teacher or student"
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="h-11 rounded-xl border border-outline-variant/40 px-4 text-sm font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={invite}
              disabled={isPending}
              className="h-11 rounded-xl bg-primary px-5 text-sm font-semibold text-on-primary disabled:opacity-60"
            >
              {isPending ? 'Inviting…' : 'Send invite'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'teacher' | 'student')}
            >
              <option value="teacher">Teacher</option>
              <option value="student">Student</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
              First name
            </label>
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
              Last name
            </label>
            <input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>
      </SlideOver>
    </>
  );
}

function StatCard({
  label,
  count,
  icon,
}: {
  label: string;
  count: number;
  icon: string;
}) {
  return (
    <div className="card-premium p-4 flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
        <span className="material-symbols-outlined text-primary text-[20px]">
          {icon}
        </span>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
          {label}
        </p>
        <p className="font-headline text-xl font-bold text-on-surface">
          {count}
        </p>
      </div>
    </div>
  );
}
