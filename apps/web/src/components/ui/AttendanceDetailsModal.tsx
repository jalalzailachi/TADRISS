'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';

interface AttendanceDetailsModalProps {
  open: boolean;
  onClose: () => void;
  sessionId: string | null;
  sessionDate: string;
  className: string;
}

interface Record {
  id: string;
  status: 'present' | 'absent' | 'late';
  student: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

export function AttendanceDetailsModal({ open, onClose, sessionId, sessionDate, className }: AttendanceDetailsModalProps) {
  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (open && sessionId) {
      loadRecords();
    }
  }, [open, sessionId]);

  async function loadRecords() {
    setLoading(true);
    const { data, error } = await supabase
      .from('attendance_records')
      .select(`
        id, status,
        student:profiles!attendance_records_student_id_fkey(first_name, last_name, email)
      `)
      .eq('session_id', sessionId);

    if (data) {
      setRecords(data as any);
    }
    setLoading(false);
  }

  return (
    <Modal open={open} onClose={onClose} title={`Attendance: ${className}`} size="lg">
      <div className="space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <p className="text-sm font-medium text-slate-500">Session Date</p>
            <p className="text-base font-bold text-slate-900">
              {new Date(sessionDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-slate-500">Stats</p>
            <div className="flex gap-2 mt-1">
              <Badge variant="success">{records.filter(r => r.status === 'present').length} present</Badge>
              <Badge variant="warning">{records.filter(r => r.status === 'late').length} late</Badge>
              <Badge variant="danger">{records.filter(r => r.status === 'absent').length} absent</Badge>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-8 flex flex-col items-center justify-center gap-3 text-slate-400">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-400" />
            <span>Loading records...</span>
          </div>
        ) : records.length === 0 ? (
          <div className="p-8 text-center text-slate-400 italic">No records found for this session.</div>
        ) : (
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Student</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Email</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 text-sm font-bold text-slate-700">
                      {Array.isArray(record.student) ? record.student[0]?.first_name : record.student?.first_name} {Array.isArray(record.student) ? record.student[0]?.last_name : record.student?.last_name}
                    </td>
                    <td className="p-4 text-sm text-slate-500">
                      {Array.isArray(record.student) ? record.student[0]?.email : record.student?.email}
                    </td>
                    <td className="p-4 text-right">
                      <Badge variant={record.status === 'present' ? 'success' : record.status === 'late' ? 'warning' : 'danger'}>
                        {record.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex justify-end pt-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-xl shadow-lg transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}
