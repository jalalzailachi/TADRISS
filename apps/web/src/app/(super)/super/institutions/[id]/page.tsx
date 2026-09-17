import 'server-only';
import { createAdminClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Institution Detail | Tadriss Super',
};

export default async function InstitutionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const admin = await createAdminClient();

  const [instRes, profilesRes, classesRes] = await Promise.all([
    admin
      .from('institutions')
      .select('id, name, city, phone, is_active, created_at, max_students, max_teachers')
      .eq('id', id)
      .single(),
    admin
      .from('profiles')
      .select('id, first_name, last_name, role, is_active, email')
      .eq('institution_id', id)
      .order('role'),
    admin
      .from('classes')
      .select('id, name, grade_level', { count: 'exact' })
      .eq('institution_id', id),
  ]);

  if (!instRes.data) notFound();
  const inst = instRes.data;
  const profiles = profilesRes.data ?? [];
  const classCount = classesRes.count ?? 0;

  const admins = profiles.filter((p) => p.role === 'institution_admin');
  const teachers = profiles.filter((p) => p.role === 'teacher');
  const students = profiles.filter((p) => p.role === 'student');

  return (
    <>
      <Link
        href="/super/institutions"
        className="inline-flex items-center gap-1 text-sm text-on-surface-variant hover:text-primary mb-4"
      >
        <span className="material-symbols-outlined text-[16px]">
          arrow_back
        </span>
        Back
      </Link>

      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
          <span className="material-symbols-outlined text-primary text-[28px]">
            domain
          </span>
        </div>
        <div>
          <h1 className="font-headline text-2xl font-bold text-on-surface">
            {inst.name}
          </h1>
          <p className="text-sm text-on-surface-variant">
            {inst.city ?? 'No city'} · Created{' '}
            {new Date(inst.created_at).toLocaleDateString()}
          </p>
        </div>
        <span
          className={`ms-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
            inst.is_active
              ? 'bg-success-soft text-on-success-soft'
              : 'bg-error-soft text-on-error-soft'
          }`}
        >
          {inst.is_active ? 'Active' : 'Suspended'}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Stat label="Admins" value={admins.length} />
        <Stat label="Teachers" value={teachers.length} limit={inst.max_teachers} />
        <Stat label="Students" value={students.length} limit={inst.max_students} />
        <Stat label="Classes" value={classCount} />
      </div>

      <div className="card-premium overflow-hidden">
        <div className="bg-surface-container-low px-6 py-3">
          <h2 className="text-sm font-semibold text-on-surface">
            Users ({profiles.length})
          </h2>
        </div>
        <table className="w-full text-sm">
          <thead className="text-xs uppercase tracking-wider text-on-surface-variant">
            <tr>
              <th className="px-6 py-2 text-start font-semibold">Name</th>
              <th className="px-6 py-2 text-start font-semibold">Email</th>
              <th className="px-6 py-2 text-start font-semibold">Role</th>
              <th className="px-6 py-2 text-start font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/20">
            {profiles.map((p) => (
              <tr key={p.id} className="hover:bg-surface-container-low/40">
                <td className="px-6 py-3 font-medium text-on-surface">
                  {p.first_name} {p.last_name}
                </td>
                <td className="px-6 py-3 text-on-surface-variant">{p.email}</td>
                <td className="px-6 py-3 text-on-surface-variant capitalize">
                  {p.role.replace('_', ' ')}
                </td>
                <td className="px-6 py-3">
                  <span
                    className={`text-xs font-semibold ${
                      p.is_active ? 'text-success' : 'text-error'
                    }`}
                  >
                    {p.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function Stat({
  label,
  value,
  limit,
}: {
  label: string;
  value: number;
  limit?: number | null;
}) {
  return (
    <div className="card-premium p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
        {label}
      </p>
      <p className="mt-1 font-headline text-2xl font-bold text-on-surface">
        {value}
        {limit != null && (
          <span className="text-sm font-normal text-on-surface-variant">
            {' '}
            / {limit}
          </span>
        )}
      </p>
    </div>
  );
}
