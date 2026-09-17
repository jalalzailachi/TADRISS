import 'server-only';
import { createAdminClient } from '@/lib/supabase/server';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Super Admin | Tadriss',
};

export default async function SuperDashboard() {
  const admin = await createAdminClient();

  const [instRes, profilesRes, activeRes] = await Promise.all([
    admin.from('institutions').select('id', { count: 'exact', head: true }),
    admin.from('profiles').select('id', { count: 'exact', head: true }),
    admin
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true),
  ]);

  const stats = [
    {
      label: 'Institutions',
      value: instRes.count ?? 0,
      icon: 'domain',
    },
    {
      label: 'Total users',
      value: profilesRes.count ?? 0,
      icon: 'group',
    },
    {
      label: 'Active users',
      value: activeRes.count ?? 0,
      icon: 'person_check',
    },
  ];

  return (
    <>
      <h1 className="font-headline text-3xl font-bold text-on-surface">
        Platform overview
      </h1>
      <p className="text-on-surface-variant mt-1">Super admin console</p>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="card-premium p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-[20px]">
                  {s.icon}
                </span>
              </div>
              <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                {s.label}
              </p>
            </div>
            <p className="font-headline text-3xl font-bold text-on-surface">
              {s.value}
            </p>
          </div>
        ))}
      </div>
    </>
  );
}
