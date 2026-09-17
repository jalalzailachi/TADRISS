import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function AdminAreaLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = await createAdminClient();
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role === 'teacher') redirect('/teacher');
  if (profile?.role === 'student') redirect('/student');
  if (profile?.role !== 'institution_admin') redirect('/login');
  
  return <>{children}</>;
}
