import 'server-only';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

const NAV = [
  { label: 'Dashboard', href: '/super', icon: 'dashboard' },
  { label: 'Institutions', href: '/super/institutions', icon: 'domain' },
  { label: 'Users', href: '/super/users', icon: 'group' },
  { label: 'Audit log', href: '/super/audit', icon: 'history' },
];

export default async function SuperLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = await createAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('id, role, first_name, last_name')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'super_admin') redirect('/login');

  return (
    <div className="min-h-screen bg-background text-on-surface antialiased">
      <header className="sticky top-0 z-40 h-16 bg-surface-container-low border-b border-outline-variant/10 flex items-center px-6 gap-6">
        <Link href="/super" className="flex items-center gap-3">
          <div className="w-9 h-9 bg-on-surface text-white rounded-xl flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">
              shield
            </span>
          </div>
          <span className="text-lg font-black italic uppercase tracking-tighter text-on-surface">
            Tadriss Super
          </span>
        </Link>
        <nav className="flex items-center gap-1 ms-6">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-on-surface-variant hover:bg-surface-container-high transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">
                {item.icon}
              </span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="ms-auto text-sm text-on-surface-variant">
          {profile.first_name} {profile.last_name}
        </div>
      </header>
      <main className="px-6 md:px-12 py-8">{children}</main>
    </div>
  );
}
