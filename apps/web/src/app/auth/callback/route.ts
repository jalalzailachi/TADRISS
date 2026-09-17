import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';
  const token_hash = searchParams.get('token_hash');
  const type = (searchParams.get('type') as 'invite' | 'recovery' | 'signup' | 'email_change' | null) || 'invite';

  // Use origin (request URL) or fallback to configured APP_URL
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || origin;
  const redirectUrl = appUrl.endsWith('/') ? appUrl.slice(0, -1) : appUrl;

  const supabase = await createClient();

  if (token_hash) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as import('@supabase/supabase-js').EmailOtpType
    });
    if (!error) {
      return NextResponse.redirect(`${redirectUrl}${next}`);
    }
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${redirectUrl}${next}`);
    }
  }

  return NextResponse.redirect(`${redirectUrl}/login?error=invalid_invite_link`);
}
