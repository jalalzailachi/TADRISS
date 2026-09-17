import 'server-only'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { FinanceClient, type Fee } from './FinanceClient'


export const metadata: Metadata = {
  title: 'Finance | Tadriss',
  description: 'Manage fees and payments',
}
export default async function FinancePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; tab?: string }>
}) {
  const { q: query, page, tab } = await searchParams
  const currentPage = Number(page) || 1
  const pageSize = 12
  const offset = (currentPage - 1) * pageSize

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = await createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('id, role, institution_id')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'institution_admin') redirect('/login')

  // Fetch all data in parallel
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

  const [statsRes, paymentsRes, studentsRes, feesRes, classesRes, revenuePaymentsRes] = await Promise.all([
    admin.rpc('get_institution_stats', { p_institution_id: profile.institution_id }),

    // Payments with pagination
    (() => {
      let dbQuery = admin
        .from('payments')
        .select(`
          *,
          student:profiles!payments_student_id_fkey(id, first_name, last_name)
        `, { count: 'exact' })
        .eq('institution_id', profile.institution_id)

      if (query) {
        dbQuery = dbQuery.ilike('period_label', `%${query}%`)
      }

      return dbQuery
        .order('payment_date', { ascending: false })
        .range(offset, offset + pageSize - 1)
    })(),

    // Students for dropdowns
    admin
      .from('profiles')
      .select('id, first_name, last_name')
      .eq('institution_id', profile.institution_id)
      .eq('role', 'student')
      .is('deleted_at', null),

    // Enrollment fees with student and class info
    admin
      .from('enrollment_fees')
      .select(`
        id, label, amount, period_type, is_active, created_at, class_id, student_id,
        student:profiles!enrollment_fees_student_id_fkey(id, first_name, last_name),
        class:classes(id, name)
      `)
      .eq('institution_id', profile.institution_id)
      .order('created_at', { ascending: false }),

    // Classes for bulk fee assignment
    admin
      .from('classes')
      .select('id, name')
      .eq('institution_id', profile.institution_id)
      .eq('is_active', true)
      .is('deleted_at', null),

    // All payments from last 6 months for revenue chart
    admin
      .from('payments')
      .select('amount, payment_date, status')
      .eq('institution_id', profile.institution_id)
      .eq('status', 'recorded')
      .gte('payment_date', sixMonthsAgo.toISOString().split('T')[0]),
  ])

  if (paymentsRes.error) console.error('[FinancePage] payments:', paymentsRes.error)
  if (feesRes.error) console.error('[FinancePage] fees:', feesRes.error)

  // Compute monthly revenue for chart (last 6 months)
  const monthlyRevenue: { month: string; amount: number }[] = []
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const monthLabel = d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })
    const total = (revenuePaymentsRes.data || [])
      .filter((p: { payment_date: string }) => p.payment_date.startsWith(monthKey))
      .reduce((sum: number, p: { amount: number }) => sum + Number(p.amount), 0)
    monthlyRevenue.push({ month: monthLabel, amount: total })
  }

  // Compute collection stats
  const allFees = feesRes.data || []
  const activeFees = allFees.filter((f: { is_active: boolean }) => f.is_active)
  const paidFees = allFees.filter((f: { is_active: boolean }) => !f.is_active)
  const totalFeesAmount = allFees.reduce((s: number, f: { amount: number }) => s + Number(f.amount), 0)
  const paidFeesAmount = paidFees.reduce((s: number, f: { amount: number }) => s + Number(f.amount), 0)
  const collectionRate = totalFeesAmount > 0 ? Math.round((paidFeesAmount / totalFeesAmount) * 100) : 0

  return (
    <FinanceClient
      initialPayments={paymentsRes.data || []}
      totalCount={paymentsRes.count || 0}
      currentPage={currentPage}
      pageSize={pageSize}
      students={studentsRes.data || []}
      stats={statsRes.data || { active_students: 0, monthly_revenue: 0, attendance_rate: 0 }}
      fees={allFees as unknown as Fee[]}
      classes={classesRes.data || []}
      monthlyRevenue={monthlyRevenue}
      collectionRate={collectionRate}
      activeFeeCount={activeFees.length}
      initialTab={(tab as 'payments' | 'fees' | 'overview') || 'payments'}
    />
  )
}
