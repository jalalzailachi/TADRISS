// supabase/functions/onboard-institution/index.ts
// Creates institution + admin profile + sets JWT app_metadata on signup

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { institutionSchema } from 'shared/validators/index.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // SECURITY: Protect onboarding with a secret key to prevent spam
    const onboardingToken = req.headers.get('X-Onboarding-Token');
    const secretToken = Deno.env.get('ONBOARDING_SECRET');
    
    if (secretToken && onboardingToken !== secretToken) {
      console.error('Invalid onboarding token');
      return new Response(
        JSON.stringify({ error: 'Forbidden: Invalid onboarding token' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    console.log('Onboarding request for:', body.email);
    
    // 1. Validate basic institution data
    const validatedInst = institutionSchema.safeParse(body);
    if (!validatedInst.success) {
      console.error('Validation error:', validatedInst.error);
      return new Response(
        JSON.stringify({ error: 'Validation failed', details: validatedInst.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const { name, slug, email } = validatedInst.data;
    // Profile data validation
    const { first_name, last_name, password } = body;
    if (!password || !first_name || !last_name) {
      return new Response(
        JSON.stringify({ error: 'Missing user profile fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check slug availability
    const { data: existingInst } = await supabase
      .from('institutions')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existingInst) {
      return new Response(
        JSON.stringify({ error: 'Institution slug already taken' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Create institution
    const { data: institution, error: instError } = await supabase
      .from('institutions')
      .insert({ name, slug, email })
      .select()
      .single();

    if (instError) throw instError;

    // 2. Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata: {
        institution_id: institution.id,
        role: 'institution_admin',
      },
    });

    if (authError) {
      // Rollback institution
      await supabase.from('institutions').delete().eq('id', institution.id);
      throw authError;
    }

    // 3. Create profile
    const { error: profileError } = await supabase.from('profiles').insert({
      id: authData.user.id,
      institution_id: institution.id,
      role: 'institution_admin',
      first_name,
      last_name,
      email,
      must_change_password: false,
      requires_password_change: false,
    });

    if (profileError) {
      // Rollback
      await supabase.auth.admin.deleteUser(authData.user.id);
      await supabase.from('institutions').delete().eq('id', institution.id);
      throw profileError;
    }

    return new Response(
      JSON.stringify({
        institution: { id: institution.id, slug: institution.slug },
        user: { id: authData.user.id, email: authData.user.email },
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
