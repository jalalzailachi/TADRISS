import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { StudentPaymentsClient, type Payment } from './PaymentsClient'

export default async function StudentPaymentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [paymentsRes, feesRes] = await Promise.all([
    supabase
      .from('payments')
      .select('id, amount, status, notes, payment_date')
      .eq('student_id', user.id)
      .order('payment_date', { ascending: false }),
    supabase
      .from('enrollment_fees')
      .select('id')
      .eq('student_id', user.id)
      .eq('is_active', true),
  ])

  return (
    <StudentPaymentsClient
      payments={(paymentsRes.data || []) as unknown as Payment[]}
      outstandingFeesCount={feesRes.data?.length ?? 0}
    />
  )
}
