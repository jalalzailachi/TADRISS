import { createClient, createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = await createAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('id, role, institution_id')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'institution_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const body = await req.json();
  const { email, first_name, last_name, role } = body;

  if (!email || !first_name || !last_name || !role) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  if (!['teacher', 'student'].includes(role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
  }

  const { data: newUser, error: createError } =
    await admin.auth.admin.createUser({
      email,
      password: 'Tadriss@2024',
      email_confirm: true,
      app_metadata: {
        institution_id: profile.institution_id,
        role,
      },
    });

  if (createError) {
    return NextResponse.json({ error: createError.message }, { status: 400 });
  }

  if (newUser?.user) {
    await admin.from('profiles').upsert({
      id: newUser.user.id,
      email,
      first_name,
      last_name,
      role,
      institution_id: profile.institution_id,
      is_active: true,
      requires_password_change: true,
    });
  }

  return NextResponse.json({ success: true });
}
