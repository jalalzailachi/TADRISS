import type { SupabaseClient } from '@supabase/supabase-js';

export async function recordPayment(
  client: SupabaseClient,
  data: {
    institution_id: string;
    student_id: string;
    amount: number;
    payment_date: string;
    payment_method: string;
    period_label?: string;
    notes?: string;
    recorded_by: string;
  }
) {
  return await client.from('payments').insert(data).select().single();
}

export async function getPayments(
  client: SupabaseClient,
  filters?: { student_id?: string; from?: string; to?: string; status?: string }
) {
  let query = client
    .from('payments')
    .select('id, institution_id, student_id, amount, currency, payment_date, payment_method, status, period_label, notes, receipt_url, created_at, profiles:student_id(first_name, last_name)')
    .order('payment_date', { ascending: false });

  if (filters?.student_id) query = query.eq('student_id', filters.student_id);
  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.from) query = query.gte('payment_date', filters.from);
  if (filters?.to) query = query.lte('payment_date', filters.to);
  return await query;
}

export async function getStudentBalance(client: SupabaseClient, studentId: string) {
  const [feesResult, paymentsResult] = await Promise.all([
    client
      .from('enrollment_fees')
      .select('amount')
      .eq('student_id', studentId)
      .eq('is_active', true),
    client
      .from('payments')
      .select('amount')
      .eq('student_id', studentId)
      .eq('status', 'recorded'),
  ]);

  const totalFees = (feesResult.data ?? []).reduce((sum, f) => sum + Number(f.amount), 0);
  const totalPaid = (paymentsResult.data ?? []).reduce((sum, p) => sum + Number(p.amount), 0);

  return {
    total_fees: totalFees,
    total_paid: totalPaid,
    balance: totalFees - totalPaid,
  };
}

// ----- Enrollment Fees -----

export async function getEnrollmentFees(client: SupabaseClient, studentId?: string) {
  let query = client.from('enrollment_fees').select('id, institution_id, student_id, class_id, amount, currency, period_type, label, is_active, created_at');
  if (studentId) query = query.eq('student_id', studentId);
  return await query.eq('is_active', true).order('created_at', { ascending: false });
}

export async function setEnrollmentFee(
  client: SupabaseClient,
  data: {
    institution_id: string;
    student_id: string;
    class_id?: string;
    amount: number;
    period_type: string;
    label?: string;
  }
) {
  return await client.from('enrollment_fees').insert(data).select().single();
}
