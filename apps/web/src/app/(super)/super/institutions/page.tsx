import 'server-only';
import { createAdminClient } from '@/lib/supabase/server';
import type { Metadata } from 'next';
import { InstitutionsClient } from './InstitutionsClient';

export const metadata: Metadata = {
  title: 'Institutions | Tadriss Super',
};

export default async function InstitutionsPage() {
  const admin = await createAdminClient();

  const { data } = await admin
    .from('institutions')
    .select('id, name, city, phone, is_active, created_at, max_students, max_teachers')
    .order('created_at', { ascending: false });

  return <InstitutionsClient institutions={(data ?? []) as never[]} />;
}
