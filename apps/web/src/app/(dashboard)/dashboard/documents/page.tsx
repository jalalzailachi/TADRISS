import 'server-only';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { DocumentsClient } from './DocumentsClient';

export const metadata: Metadata = {
  title: 'Documents | Tadriss',
  description: 'Upload and manage institution documents',
};

export default async function DocumentsPage() {
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

  const [docsRes, studentsRes] = await Promise.all([
    admin
      .from('documents')
      .select('id, name, file_url, file_type, size_bytes, category, uploaded_at, student_id')
      .eq('institution_id', profile.institution_id)
      .order('uploaded_at', { ascending: false }),
    admin
      .from('profiles')
      .select('id, first_name, last_name')
      .eq('institution_id', profile.institution_id)
      .eq('role', 'student')
      .eq('is_active', true),
  ]);

  return (
    <DocumentsClient
      documents={(docsRes.data ?? []) as never[]}
      students={(studentsRes.data ?? []) as never[]}
    />
  );
}
