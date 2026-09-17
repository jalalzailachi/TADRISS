import 'server-only';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { AnnouncementsClient } from './AnnouncementsClient';

export const metadata: Metadata = {
  title: 'Announcements | Tadriss',
  description: 'Broadcast announcements to your institution',
};

export default async function AnnouncementsPage() {
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

  const { data: announcements } = await admin
    .from('broadcasts')
    .select('id, title, message, audience, is_pinned, created_at, sender_id')
    .eq('institution_id', profile.institution_id)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false });

  return <AnnouncementsClient items={(announcements ?? []) as never[]} />;
}
