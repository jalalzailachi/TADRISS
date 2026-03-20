// supabase/functions/void-payment/index.ts
// Admin voids a payment (append-only model — no DELETE/UPDATE via client)

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Verify caller
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user: caller } } = await supabaseUser.auth.getUser();
    if (!caller || caller.app_metadata?.role !== 'institution_admin') {
      return new Response(
        JSON.stringify({ error: 'Forbidden: admin only' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { payment_id, reason } = body;

    if (!payment_id || !reason) {
      return new Response(
        JSON.stringify({ error: 'Missing payment_id or reason' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify payment belongs to caller's institution and is not already voided
    const { data: payment, error: fetchErr } = await supabaseAdmin
      .from('payments')
      .select('id, status, institution_id')
      .eq('id', payment_id)
      .single();

    if (fetchErr || !payment) {
      return new Response(
        JSON.stringify({ error: 'Payment not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (payment.institution_id !== caller.app_metadata.institution_id) {
      return new Response(
        JSON.stringify({ error: 'Payment does not belong to your institution' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (payment.status === 'voided') {
      return new Response(
        JSON.stringify({ error: 'Payment already voided' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Void the payment
    const { data: updated, error: updateErr } = await supabaseAdmin
      .from('payments')
      .update({
        status: 'voided',
        voided_at: new Date().toISOString(),
        voided_by: caller.id,
        void_reason: reason,
      })
      .eq('id', payment_id)
      .select()
      .single();

    if (updateErr) throw updateErr;

    // Write audit log
    await supabaseAdmin.from('audit_log').insert({
      institution_id: caller.app_metadata.institution_id,
      actor_id: caller.id,
      action: 'payment.voided',
      entity_type: 'payment',
      entity_id: payment_id,
      metadata: { reason, amount: updated.amount, student_id: updated.student_id },
    });

    return new Response(
      JSON.stringify({ payment: updated }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
