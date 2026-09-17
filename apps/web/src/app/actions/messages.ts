'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const MessageSchema = z.object({
  subject: z.string().min(1).max(200),
  body: z.string().min(1),
  recipient_ids: z.array(z.string().uuid()).min(1),
});

async function getAuthedProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' as const };
  const admin = await createAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('id, role, institution_id')
    .eq('id', user.id)
    .single();
  if (!profile) return { error: 'Profile not found' as const };
  return { user, profile, admin };
}

export async function sendMessage(input: unknown) {
  const parsed = MessageSchema.safeParse(input);
  if (!parsed.success) return { error: 'Invalid input' };

  const auth = await getAuthedProfile();
  if ('error' in auth) return { error: auth.error };

  const { data: message, error: messageError } = await auth.admin
    .from('messages')
    .insert({
      institution_id: auth.profile.institution_id,
      sender_id: auth.user.id,
      subject: parsed.data.subject,
      body: parsed.data.body,
    })
    .select('id')
    .single();

  if (messageError || !message) return { error: messageError?.message ?? 'Send failed' };

  const recipients = parsed.data.recipient_ids.map((user_id) => ({
    message_id: message.id,
    user_id,
    is_read: false,
  }));

  const { error: recipientsError } = await auth.admin
    .from('message_recipients')
    .insert(recipients);

  if (recipientsError) return { error: recipientsError.message };

  revalidatePath('/dashboard/messages');
  revalidatePath('/teacher/messages');
  revalidatePath('/student/messages');
  return { success: true };
}

export async function markMessageRead(messageId: string) {
  const auth = await getAuthedProfile();
  if ('error' in auth) return { error: auth.error };

  const { error } = await auth.admin
    .from('message_recipients')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('message_id', messageId)
    .eq('user_id', auth.user.id);

  if (error) return { error: error.message };
  revalidatePath('/dashboard/messages');
  return { success: true };
}
