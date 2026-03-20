'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { TakeAttendanceModal } from '@/components/ui/TakeAttendanceModal';
import { AttendanceDetailsModal } from '@/components/ui/AttendanceDetailsModal';

interface AttendanceSession {
  id: string;
  session_date: string;
  class_name: string;
  teacher_name: string;
  present: number;
  absent: number;
  late: number;
  total: number;
}

export default function AttendancePage() {
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<{id: string, name: string}[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<AttendanceSession | null>(null);
  const [userId, setUserId] = useState('');
  const supabase = createClient();

  async function loadSessions() {
    setLoading(true);
    const { data: clsData } = await supabase.from('classes').select('id, name');
    setClasses(clsData || []);

    const { data } = await supabase
      .from('attendance_sessions')
      .select(`
        id, session_date, notes,
        classes(name),
        teacher:profiles!attendance_sessions_teacher_id_fkey(first_name, last_name),
        attendance_records(status)
      `)
      .order('session_date', { ascending: false })
      .limit(50);

    const mapped = (data ?? []).map((s: any) => {
      const records = s.attendance_records ?? [];
      return {
        id: s.id,
        session_date: s.session_date,
        class_name: s.classes?.name ?? '—',
        teacher_name: s.teacher ? `${s.teacher.first_name} ${s.teacher.last_name}` : '—',
        present: records.filter((r: any) => r.status === 'present').length,
        absent: records.filter((r: any) => r.status === 'absent').length,
        late: records.filter((r: any) => r.status === 'late').length,
        total: records.length,
      };
    });
    setSessions(mapped);
    setLoading(false);
  }

  useEffect(() => { 
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id || ''));
    loadSessions(); 
  }, []);

  const columns = [
    {
      key: 'session_date',
      label: 'Date',
      sortable: true,
      render: (row: AttendanceSession) => new Date(row.session_date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }),
    },
    { key: 'class_name', label: 'Class', sortable: true },
    { key: 'teacher_name', label: 'Teacher', sortable: true },
    {
      key: 'present',
      label: 'Attendance',
      render: (row: AttendanceSession) => (
        <div className="flex items-center gap-2">
          <Badge variant="success">{row.present} present</Badge>
          {row.late > 0 && <Badge variant="warning">{row.late} late</Badge>}
          {row.absent > 0 && <Badge variant="danger">{row.absent} absent</Badge>}
        </div>
      ),
    },
    {
      key: 'total',
      label: 'Rate',
      render: (row: AttendanceSession) => {
        const rate = row.total > 0 ? Math.round(((row.present + row.late) / row.total) * 100) : 0;
        return (
          <div className="flex items-center gap-2">
            <div className="w-16 bg-slate-200 rounded-full h-1.5">
              <div className={`h-1.5 rounded-full ${rate >= 80 ? 'bg-emerald-500' : rate >= 60 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${rate}%` }} />
            </div>
            <span className="text-xs font-semibold text-slate-600">{rate}%</span>
          </div>
        );
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row: AttendanceSession) => (
        <button 
          onClick={() => {
            setSelectedSession(row);
            setDetailsOpen(true);
          }}
          className="p-1 px-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold border border-blue-100 shadow-sm"
        >
          <span className="material-symbols-outlined text-sm">visibility</span>
          View
        </button>
      )
    }
  ];

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400">Loading...</div>;

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Attendance</h1>
          <p className="text-sm text-slate-500 mt-1">View attendance sessions and records</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg flex items-center gap-2 transition-colors shadow-sm cursor-pointer">
          <span className="material-symbols-outlined text-lg">add</span>
          Record Attendance
        </button>
      </div>
      <DataTable
        columns={columns}
        data={sessions}
        searchPlaceholder="Search by class or teacher..."
        emptyMessage="No attendance sessions recorded yet."
      />
      <TakeAttendanceModal 
        open={modalOpen} 
        onClose={() => setModalOpen(false)} 
        onSuccess={() => {
          setModalOpen(false);
          loadSessions();
        }} 
        classes={classes} 
        userId={userId} 
      />
      <AttendanceDetailsModal
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        sessionId={selectedSession?.id || null}
        sessionDate={selectedSession?.session_date || ''}
        className={selectedSession?.class_name || ''}
      />
    </>
  );
}
