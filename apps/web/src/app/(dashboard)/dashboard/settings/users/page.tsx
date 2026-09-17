import 'server-only';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { UsersSettingsClient } from './UsersSettingsClient';

export const metadata: Metadata = {
  title: 'Users | Settings | Tadriss',
};

export default async function UsersSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = await createAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('id, role, institution_id')
    .eq('id', user.id)
    .single();
  if (!profile || profile.role !== 'institution_admin') redirect('/login');

  const { data: users } = await admin
    .from('profiles')
    .select('id, first_name, last_name, email, role, is_active, created_at')
    .eq('institution_id', profile.institution_id)
    .order('created_at', { ascending: false });

  return (
    <UsersSettingsClient
      users={(users ?? []) as never[]}
      institutionId={profile.institution_id}
    />
  );
}
