// supabase/functions/generate-receipt/index.ts
// Generates a PDF receipt for a payment, uploads to Storage, saves to receipts table

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

    // Verify caller is admin
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user: caller } } = await supabaseUser.auth.getUser();
    if (!caller || caller.app_metadata?.role !== 'institution_admin') {
      return new Response(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const institutionId = caller.app_metadata.institution_id;
    const { payment_id } = await req.json();

    if (!payment_id) {
      return new Response(
        JSON.stringify({ error: 'Missing payment_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if receipt already exists
    const { data: existingReceipt } = await supabaseAdmin
      .from('receipts')
      .select('id, receipt_number, file_url')
      .eq('payment_id', payment_id)
      .single();

    if (existingReceipt) {
      return new Response(
        JSON.stringify({ receipt: existingReceipt }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch payment + student + institution data
    const { data: payment, error: payErr } = await supabaseAdmin
      .from('payments')
      .select('*, profiles:student_id(first_name, last_name)')
      .eq('id', payment_id)
      .eq('institution_id', institutionId)
      .single();

    if (payErr || !payment) {
      return new Response(
        JSON.stringify({ error: 'Payment not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: institution } = await supabaseAdmin
      .from('institutions')
      .select('name, slug, receipt_sequence')
      .eq('id', institutionId)
      .single();

    // Increment receipt sequence atomically
    const newSequence = (institution?.receipt_sequence ?? 0) + 1;
    await supabaseAdmin
      .from('institutions')
      .update({ receipt_sequence: newSequence })
      .eq('id', institutionId);

    const year = new Date().getFullYear();
    const receiptNumber = `${institution?.slug?.toUpperCase().slice(0, 5) ?? 'TAD'}-${year}-${String(newSequence).padStart(5, '0')}`;

    // Build receipt HTML → PDF
    // For MVP: generate a simple HTML receipt that can be printed/saved as PDF
    const studentName = `${payment.profiles?.first_name ?? ''} ${payment.profiles?.last_name ?? ''}`;
    const receiptHtml = `
<!DOCTYPE html>
<html dir="ltr" lang="fr">
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 40px; max-width: 600px; margin: 0 auto; }
    .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
    .header h1 { margin: 0; font-size: 22px; }
    .header p { margin: 4px 0; color: #666; font-size: 13px; }
    .receipt-number { text-align: right; font-size: 14px; color: #666; margin-bottom: 20px; }
    .details { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    .details td { padding: 10px 0; border-bottom: 1px solid #eee; }
    .details td:first-child { font-weight: bold; width: 40%; color: #333; }
    .amount { font-size: 24px; text-align: center; padding: 20px; background: #f5f5f5; border-radius: 8px; margin: 20px 0; }
    .footer { text-align: center; font-size: 11px; color: #999; margin-top: 40px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${institution?.name ?? 'Institution'}</h1>
    <p>Reçu de paiement</p>
  </div>
  <div class="receipt-number">N° ${receiptNumber}</div>
  <table class="details">
    <tr><td>Étudiant</td><td>${studentName}</td></tr>
    <tr><td>Montant</td><td>${payment.amount} ${payment.currency}</td></tr>
    <tr><td>Date de paiement</td><td>${payment.payment_date}</td></tr>
    <tr><td>Mode de paiement</td><td>${payment.payment_method}</td></tr>
    <tr><td>Période</td><td>${payment.period_label ?? '—'}</td></tr>
  </table>
  <div class="amount">${payment.amount} ${payment.currency}</div>
  <div class="footer">
    <p>Généré le ${new Date().toLocaleDateString('fr-FR')}</p>
    <p>${receiptNumber}</p>
  </div>
</body>
</html>`;

    // Upload HTML receipt to storage (clients can render/print this)
    const filePath = `${institutionId}/receipts/${receiptNumber}.html`;
    const { error: uploadErr } = await supabaseAdmin.storage
      .from('documents')
      .upload(filePath, new Blob([receiptHtml], { type: 'text/html' }), {
        contentType: 'text/html',
        upsert: false,
      });

    if (uploadErr) throw uploadErr;

    const { data: urlData } = supabaseAdmin.storage
      .from('documents')
      .getPublicUrl(filePath);

    // Save receipt record
    const { data: receipt, error: receiptErr } = await supabaseAdmin
      .from('receipts')
      .insert({
        institution_id: institutionId,
        payment_id,
        receipt_number: receiptNumber,
        file_url: urlData.publicUrl,
      })
      .select()
      .single();

    if (receiptErr) throw receiptErr;

    return new Response(
      JSON.stringify({ receipt }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
