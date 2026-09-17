import 'server-only';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { MessagesClient } from './MessagesClient';

export const metadata: Metadata = {
  title: 'Messages | Tadriss',
};

export default async function MessagesPage() {
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

  const [inboxRes, sentRes, usersRes] = await Promise.all([
    admin
      .from('message_recipients')
      .select(
        'message_id, is_read, read_at, message:messages(id, subject, body, sent_at, sender_id)'
      )
      .eq('user_id', user.id)
      .order('message_id', { ascending: false })
      .limit(100),
    admin
      .from('messages')
      .select('id, subject, body, sent_at')
      .eq('institution_id', profile.institution_id)
      .eq('sender_id', user.id)
      .order('sent_at', { ascending: false })
      .limit(100),
    admin
      .from('profiles')
      .select('id, first_name, last_name, role')
      .eq('institution_id', profile.institution_id)
      .eq('is_active', true)
      .neq('id', user.id),
  ]);

  return (
    <MessagesClient
      currentUserId={user.id}
      inbox={(inboxRes.data ?? []) as never[]}
      sent={(sentRes.data ?? []) as never[]}
      users={(usersRes.data ?? []) as never[]}
    />
  );
}
