'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { StatsCard } from '@/components/ui/StatsCard';
import { ForcePasswordChangeCard } from '@/components/ForcePasswordChangeCard';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

interface DashboardStats {
  total_students: number;
  total_teachers: number;
  total_classes: number;
  monthly_revenue: number;
  pending_payments: number;
}

interface ActivityItem {
  id: string;
  action: string;
  actor_name: string;
  created_at: string;
}

const enrollmentData = [
  { month: 'Oct', students: 12 },
  { month: 'Nov', students: 28 },
  { month: 'Dec', students: 35 },
  { month: 'Jan', students: 42 },
  { month: 'Feb', students: 48 },
  { month: 'Mar', students: 52 },
];

// TODO: Replace with real data from API (e.g., query profiles created_at grouped by month)
const attendanceData = [
  { day: 'Mon', rate: 92 },
  { day: 'Tue', rate: 88 },
  { day: 'Wed', rate: 95 },
  { day: 'Thu', rate: 90 },
  { day: 'Fri', rate: 85 },
];

export function AdminDashboard({ userId }: { userId: string }) {
  const [stats, setStats] = useState<DashboardStats>({
    total_students: 0,
    total_teachers: 0,
    total_classes: 0,
    monthly_revenue: 0,
    pending_payments: 0,
  });
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [requiresPasswordChange, setRequiresPasswordChange] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function loadDashboard() {
      const [studentsRes, teachersRes, classesRes, paymentsRes, activityRes, profileRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'teacher'),
        supabase.from('classes').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('payments').select('amount, status'),
        supabase.from('audit_log').select('id, action, created_at').order('created_at', { ascending: false }).limit(10),
        supabase.from('profiles').select('requires_password_change, must_change_password').eq('id', userId).single(),
      ]);

      const profile = profileRes.data;
      setRequiresPasswordChange(profile?.requires_password_change ?? profile?.must_change_password ?? false);

      const payments = paymentsRes.data ?? [];
      const revenue = payments
        .filter((p: any) => p.status === 'recorded' || p.status === 'paid')
        .reduce((sum: number, p: any) => sum + Number(p.amount), 0);
      const pending = payments.filter((p: any) => p.status === 'pending').length;

      setStats({
        total_students: studentsRes.count ?? 0,
        total_teachers: teachersRes.count ?? 0,
        total_classes: classesRes.count ?? 0,
        monthly_revenue: revenue,
        pending_payments: pending,
      });

      setActivities(
        (activityRes.data ?? []).map((a: any) => ({
          id: a.id,
          action: a.action,
          actor_name: 'Admin',
          created_at: a.created_at,
        }))
      );

      setLoading(false);
    }
    loadDashboard();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {requiresPasswordChange && <ForcePasswordChangeCard />}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Operator Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Welcome back. Here&apos;s a global overview of your institution.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatsCard label="Total Students" value={stats.total_students.toLocaleString()} icon="school" iconBg="bg-blue-50" iconColor="text-blue-600" />
        <StatsCard label="Total Teachers" value={stats.total_teachers} icon="person" iconBg="bg-purple-50" iconColor="text-purple-600" />
        <StatsCard label="Active Classes" value={stats.total_classes} icon="class" iconBg="bg-emerald-50" iconColor="text-emerald-600" />
        <StatsCard label="Monthly Revenue" value={`${stats.monthly_revenue.toLocaleString('fr-FR')} MAD`} icon="account_balance_wallet" iconBg="bg-amber-50" iconColor="text-amber-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Student Enrollment (6 months)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={enrollmentData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }} />
              <Line type="monotone" dataKey="students" stroke="#002147" strokeWidth={2.5} dot={{ fill: '#002147', r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Weekly Attendance Rate (%)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={attendanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }} formatter={(value: any) => [`${value}%`, 'Attendance']} />
              <Bar dataKey="rate" fill="#002147" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Recent Activity</h3>
          {activities.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">No activity recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {activities.map((a) => (
                <div key={a.id} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                  <div className="p-1.5 bg-slate-100 rounded-lg">
                    <span className="material-symbols-outlined text-slate-500 text-base">history</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">{a.action}</p>
                    <p className="text-xs text-slate-400">by {a.actor_name}</p>
                  </div>
                  <span className="text-xs text-slate-400 shrink-0">
                    {new Date(a.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Quick Summary</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Pending Payments</span>
              <span className="text-sm font-bold text-amber-600">{stats.pending_payments}</span>
            </div>
            <div className="border-t border-slate-100" />
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Student/Teacher Ratio</span>
              <span className="text-sm font-bold text-slate-700">
                {stats.total_teachers > 0 ? `${Math.round(stats.total_students / stats.total_teachers)}:1` : '—'}
              </span>
            </div>
            <div className="border-t border-slate-100" />
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Avg Students/Class</span>
              <span className="text-sm font-bold text-slate-700">
                {stats.total_classes > 0 ? Math.round(stats.total_students / stats.total_classes) : '—'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
