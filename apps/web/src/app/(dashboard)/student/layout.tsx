import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function StudentAreaLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = await createAdminClient();
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role === 'institution_admin') redirect('/dashboard');
  if (profile?.role === 'teacher') redirect('/teacher');
  if (profile?.role !== 'student') redirect('/login');
  
  return <>{children}</>;
}
