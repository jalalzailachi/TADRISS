'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/Badge';
import { StatsCard } from '@/components/ui/StatsCard';

interface ClassDetail {
  id: string;
  name: string;
  subject: string;
  level: string;
  students: { id: string; first_name: string; last_name: string; email: string }[];
  teachers: { id: string; first_name: string; last_name: string; email: string }[];
  homework: { id: string; title: string; due_date: string; file_url: string | null }[];
}

export default function ClassDetailPage() {
  const { id } = useParams() as { id: string };
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ClassDetail | null>(null);
  const [role, setRole] = useState<string>('');
  const supabase = createClient();

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      if (profile) setRole(profile.role);
    }

    const [classRes, studentsRes, teachersRes, homeworkRes] = await Promise.all([
      supabase.from('classes').select('*').eq('id', id).single(),
      supabase.from('class_students').select('profiles(id, first_name, last_name, email)').eq('class_id', id),
      supabase.from('class_teachers').select('profiles(id, first_name, last_name, email)').eq('class_id', id),
      supabase.from('homework').select('id, title, due_date, file_url').eq('class_id', id).order('created_at', { ascending: false })
    ]);

    if (classRes.data) {
      setData({
        ...classRes.data,
        students: (studentsRes.data ?? []).map((s: any) => s.profiles).filter(Boolean),
        teachers: (teachersRes.data ?? []).map((t: any) => t.profiles).filter(Boolean),
        homework: homeworkRes.data ?? []
      });
    }
    setLoading(false);
  }

  useEffect(() => { if (id) loadData(); }, [id]);

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400">Loading...</div>;
  if (!data) return <div className="p-8 text-center text-slate-500">Class not found or access denied.</div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{data.name}</h1>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="info">{data.subject}</Badge>
            <Badge variant="neutral">{data.level}</Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard label="Students" value={data.students.length} icon="school" iconBg="bg-blue-50" iconColor="text-blue-600" />
        <StatsCard label="Teachers" value={data.teachers.length} icon="person" iconBg="bg-purple-50" iconColor="text-purple-600" />
        <StatsCard label="Homework" value={data.homework.length} icon="menu_book" iconBg="bg-amber-50" iconColor="text-amber-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Homework Section */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900">Recent Homework</h3>
            <span className="material-symbols-outlined text-slate-400">history</span>
          </div>
          <div className="divide-y divide-slate-50">
            {data.homework.length === 0 ? (
              <p className="p-8 text-center text-sm text-slate-400">No active assignments</p>
            ) : (
              data.homework.map((h) => (
                <div key={h.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                  <div>
                    <p className="font-semibold text-sm text-slate-800">{h.title}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Due: {h.due_date ? new Date(h.due_date).toLocaleDateString() : 'No date'}
                    </p>
                  </div>
                  {h.file_url && (
                    <a href={h.file_url} target="_blank" rel="noreferrer" className="p-2 text-primary hover:bg-primary/5 rounded-lg transition-colors">
                      <span className="material-symbols-outlined">attach_file</span>
                    </a>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Members Section */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900">Class Members</h3>
            <span className="material-symbols-outlined text-slate-400">groups</span>
          </div>
          <div className="p-5 space-y-6">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Teachers</p>
              <div className="space-y-2">
                {data.teachers.map((t) => (
                  <div key={t.id} className="flex items-center gap-3">
                    <div className="size-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold">
                      {t.first_name[0]}{t.last_name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-700">{t.first_name} {t.last_name}</p>
                      <p className="text-xs text-slate-500">{t.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Recent Students</p>
              <div className="grid grid-cols-2 gap-3">
                {data.students.slice(0, 6).map((s) => (
                  <div key={s.id} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                    <div className="size-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold">
                      {s.first_name[0]}{s.last_name[0]}
                    </div>
                    <span className="text-xs font-medium text-slate-600 truncate">{s.first_name} {s.last_name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
