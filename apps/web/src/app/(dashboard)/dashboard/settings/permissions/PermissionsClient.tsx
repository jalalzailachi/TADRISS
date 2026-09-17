'use client';

import { useMemo, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/ui/PageHeader';
import { bulkUpdatePermissions } from '@/app/actions/permissions';
import Link from 'next/link';

interface Permission {
  id: string;
  role: string;
  page_key: string;
  can_view: boolean;
  can_edit: boolean;
}

const ROLES = ['institution_admin', 'teacher', 'student'] as const;
const ROLE_LABELS: Record<string, string> = {
  institution_admin: 'Admin',
  teacher: 'Teacher',
  student: 'Student',
};

const PAGES = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'classes', label: 'Classes' },
  { key: 'students', label: 'Students' },
  { key: 'teachers', label: 'Teachers' },
  { key: 'attendance', label: 'Attendance' },
  { key: 'homework', label: 'Homework' },
  { key: 'grades', label: 'Grades' },
  { key: 'schedule', label: 'Schedule' },
  { key: 'payments', label: 'Payments' },
  { key: 'messages', label: 'Messages' },
  { key: 'announcements', label: 'Announcements' },
  { key: 'documents', label: 'Documents' },
  { key: 'settings', label: 'Settings' },
];

type Matrix = Record<string, Record<string, { can_view: boolean; can_edit: boolean }>>;

export function PermissionsClient({
  permissions,
}: {
  permissions: Permission[];
}) {
  const [isPending, startTransition] = useTransition();

  const initial = useMemo(() => {
    const m: Matrix = {};
    ROLES.forEach((r) => {
      m[r] = {};
      PAGES.forEach((p) => {
        m[r][p.key] = { can_view: false, can_edit: false };
      });
    });
    permissions.forEach((p) => {
      if (m[p.role]?.[p.page_key]) {
        m[p.role][p.page_key] = { can_view: p.can_view, can_edit: p.can_edit };
      }
    });
    return m;
  }, [permissions]);

  const [matrix, setMatrix] = useState<Matrix>(initial);

  const toggle = (role: string, page: string, field: 'can_view' | 'can_edit') => {
    setMatrix((prev) => {
      const next = { ...prev };
      next[role] = { ...next[role] };
      next[role][page] = {
        ...next[role][page],
        [field]: !next[role][page][field],
      };
      if (field === 'can_edit' && next[role][page].can_edit) {
        next[role][page].can_view = true;
      }
      if (field === 'can_view' && !next[role][page].can_view) {
        next[role][page].can_edit = false;
      }
      return next;
    });
  };

  const save = () => {
    const entries: Array<{
      role: string;
      page_key: string;
      can_view: boolean;
      can_edit: boolean;
    }> = [];
    ROLES.forEach((r) => {
      PAGES.forEach((p) => {
        entries.push({
          role: r,
          page_key: p.key,
          ...matrix[r][p.key],
        });
      });
    });
    startTransition(async () => {
      const res = await bulkUpdatePermissions(entries);
      if (res.error) toast.error(res.error);
      else toast.success('Permissions saved');
    });
  };

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
        title="Permissions"
        subtitle="Control which pages each role can access"
        action={
          <button
            type="button"
            onClick={save}
            disabled={isPending}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-on-primary shadow-sm hover:bg-primary-container transition-colors disabled:opacity-60"
          >
            {isPending ? 'Saving…' : 'Save changes'}
          </button>
        }
      />

      <div className="mt-6 card-premium overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface-container-low text-xs uppercase tracking-wider text-on-surface-variant">
            <tr>
              <th className="px-6 py-3 text-start font-semibold w-40">Page</th>
              {ROLES.map((r) => (
                <th key={r} className="px-4 py-3 text-center font-semibold" colSpan={2}>
                  {ROLE_LABELS[r]}
                </th>
              ))}
            </tr>
            <tr className="text-[10px]">
              <th />
              {ROLES.map((r) => (
                <Fragment key={r}>
                  <th className="px-2 py-1 text-center text-on-surface-variant">View</th>
                  <th className="px-2 py-1 text-center text-on-surface-variant">Edit</th>
                </Fragment>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/20">
            {PAGES.map((p) => (
              <tr key={p.key} className="hover:bg-surface-container-low/40">
                <td className="px-6 py-3 font-medium text-on-surface">
                  {p.label}
                </td>
                {ROLES.map((r) => {
                  const cell = matrix[r]?.[p.key];
                  return (
                    <Fragment key={r}>
                      <td className="px-2 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={cell?.can_view ?? false}
                          onChange={() => toggle(r, p.key, 'can_view')}
                          className="h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary"
                        />
                      </td>
                      <td className="px-2 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={cell?.can_edit ?? false}
                          onChange={() => toggle(r, p.key, 'can_edit')}
                          className="h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary"
                        />
                      </td>
                    </Fragment>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function Fragment({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
