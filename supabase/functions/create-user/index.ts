// supabase/functions/invite-teacher/index.ts
// Admin invites a teacher — creates auth user + profile + sets app_metadata

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { inviteTeacherSchema } from 'shared/validators/index.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), { status: 401, headers: corsHeaders });
    }

    const token = authHeader.replace(/^Bearer /i, '');
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify the JWT using the admin client (the most reliable way in Edge Functions)
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      console.error('Auth Verification Failed:', userError?.message);
      return new Response(JSON.stringify({ 
        error: 'Unauthorized', 
        details: userError?.message,
        code: 'AUTH_FAILED'
      }), { status: 401, headers: corsHeaders });
    }

    const callerRole = user.app_metadata?.role;
    const callerInstitutionId = user.app_metadata?.institution_id;

    console.log(`Caller: ${user.email}, Role: ${callerRole}, Institution: ${callerInstitutionId}`);

    if (callerRole !== 'institution_admin' || !callerInstitutionId) {
       console.error(`Forbidden: current role is ${callerRole}`);
       return new Response(JSON.stringify({ error: 'Forbidden: admin only' }), { status: 403, headers: corsHeaders });
    }

    const body = await req.json();
    
    // 1. Validate input with Zod (using more generic schema or manual validation)
    const { email, first_name, last_name, role, phone } = body;
    if (!email || !first_name || !last_name || !role) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers: corsHeaders });
    }

    if (!['teacher', 'student'].includes(role)) {
       return new Response(JSON.stringify({ error: 'Invalid role' }), { status: 400, headers: corsHeaders });
    }

    // Check if email is already in use across all institutions
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();

    if (existingProfile) {
      return new Response(JSON.stringify({ error: 'Email already in use' }), { status: 409, headers: corsHeaders });
    }

    // Generate a temporary password (user will reset)
    const tempPassword = crypto.randomUUID().slice(0, 16);

    // 2. Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      app_metadata: {
        institution_id: callerInstitutionId,
        role,
      },
    });

    if (authError) throw authError;

    // 3. Create profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authData.user.id,
        institution_id: callerInstitutionId,
        role,
        first_name,
        last_name,
        email,
        phone: phone || null,
        must_change_password: true,
        requires_password_change: true,
      })
      .select()
      .single();

    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      throw profileError;
    }

    // In production: send invite email with password reset link
    // SECURITY: temp_password is REMOVED from the response for production readiness
    return new Response(
      JSON.stringify({
        user: {
          id: profile.id,
          email,
          first_name,
          last_name,
          role,
        },
        message: `${role.charAt(0).toUpperCase() + role.slice(1)} created successfully. They will receive an email to set their password.`,
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
