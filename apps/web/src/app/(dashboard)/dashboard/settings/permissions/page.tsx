import 'server-only';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { PermissionsClient } from './PermissionsClient';

export const metadata: Metadata = {
  title: 'Permissions | Settings | Tadriss',
};

export default async function PermissionsPage() {
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

  const { data: permissions } = await admin
    .from('role_permissions')
    .select('id, role, page_key, can_view, can_edit')
    .eq('institution_id', profile.institution_id);

  return <PermissionsClient permissions={(permissions ?? []) as never[]} />;
}
