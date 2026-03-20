// supabase/functions/dashboard-stats/index.ts
// Returns aggregated stats for admin dashboard (bypasses RLS for speed)

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

    // Verify caller
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user: caller } } = await supabaseUser.auth.getUser();
    if (!caller) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const institutionId = caller.app_metadata?.institution_id;
    const role = caller.app_metadata?.role;

    if (!institutionId) {
      return new Response(
        JSON.stringify({ error: 'No institution' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use service role for aggregated queries (avoids RLS overhead)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    if (role === 'institution_admin') {
      // Admin dashboard stats
      const [students, teachers, classes, payments, todayAttendance] = await Promise.all([
        supabaseAdmin
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .eq('institution_id', institutionId)
          .eq('role', 'student')
          .eq('is_active', true),
        supabaseAdmin
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .eq('institution_id', institutionId)
          .eq('role', 'teacher')
          .eq('is_active', true),
        supabaseAdmin
          .from('classes')
          .select('id', { count: 'exact', head: true })
          .eq('institution_id', institutionId)
          .eq('is_active', true),
        supabaseAdmin
          .from('payments')
          .select('amount')
          .eq('institution_id', institutionId)
          .eq('status', 'recorded'),
        supabaseAdmin
          .from('attendance_records')
          .select('status, attendance_sessions!inner(institution_id, session_date)')
          .eq('attendance_sessions.institution_id', institutionId)
          .eq('attendance_sessions.session_date', new Date().toISOString().split('T')[0]),
      ]);

      const totalPaid = (payments.data ?? []).reduce((sum, p) => sum + Number(p.amount), 0);

      const todayRecords = todayAttendance.data ?? [];
      const todayPresent = todayRecords.filter((r: { status: string }) => r.status === 'present').length;
      const todayTotal = todayRecords.length;
      const attendanceRate = todayTotal > 0 ? Math.round((todayPresent / todayTotal) * 100) : 0;

      return new Response(
        JSON.stringify({
          total_students: students.count ?? 0,
          total_teachers: teachers.count ?? 0,
          total_classes: classes.count ?? 0,
          total_payments: totalPaid,
          today_attendance_rate: attendanceRate,
          today_attendance_total: todayTotal,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (role === 'teacher') {
      // Teacher: today's classes count
      const today = new Date()
        .toLocaleDateString('en-US', { weekday: 'long' })
        .toLowerCase();

      const { data: myClasses } = await supabaseAdmin
        .from('class_teachers')
        .select('class_id, classes(name, schedule_days, schedule_time)')
        .eq('teacher_id', caller.id);

      const todayClasses = (myClasses ?? []).filter((c: any) =>
        c.classes?.schedule_days?.includes(today)
      );

      return new Response(
        JSON.stringify({
          total_classes: myClasses?.length ?? 0,
          today_classes: todayClasses.length,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (role === 'student') {
      // Student: attendance rate + balance
      const [records, fees, paymentsData] = await Promise.all([
        supabaseAdmin
          .from('attendance_records')
          .select('status')
          .eq('student_id', caller.id),
        supabaseAdmin
          .from('enrollment_fees')
          .select('amount')
          .eq('student_id', caller.id)
          .eq('is_active', true),
        supabaseAdmin
          .from('payments')
          .select('amount')
          .eq('student_id', caller.id)
          .eq('status', 'recorded'),
      ]);

      const allRecords = records.data ?? [];
      const present = allRecords.filter((r: { status: string }) => r.status === 'present').length;
      const rate = allRecords.length > 0 ? Math.round((present / allRecords.length) * 100) : 0;

      const totalFees = (fees.data ?? []).reduce((s, f) => s + Number(f.amount), 0);
      const totalPaid = (paymentsData.data ?? []).reduce((s, p) => s + Number(p.amount), 0);

      return new Response(
        JSON.stringify({
          attendance_rate: rate,
          total_records: allRecords.length,
          total_fees: totalFees,
          total_paid: totalPaid,
          balance: totalFees - totalPaid,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Unknown role' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
