import 'server-only';
import { createAdminClient } from '@/lib/supabase/server';
import type { Metadata } from 'next';
import { UsersClient } from './UsersClient';

export const metadata: Metadata = {
  title: 'Users | Tadriss Super',
};

export default async function SuperUsersPage() {
  const admin = await createAdminClient();

  const { data } = await admin
    .from('profiles')
    .select(
      'id, first_name, last_name, email, role, is_active, institution_id, institutions(name)'
    )
    .order('created_at', { ascending: false })
    .limit(200);

  return <UsersClient users={(data ?? []) as never[]} />;
}
