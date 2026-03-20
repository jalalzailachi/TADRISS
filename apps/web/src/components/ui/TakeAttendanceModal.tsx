'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Modal } from '@/components/ui/Modal';

interface TakeAttendanceModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  classes: { id: string; name: string }[];
  userId: string;
}

interface Student {
  id: string;
  first_name: string;
  last_name: string;
}

export function TakeAttendanceModal({ open, onClose, onSuccess, classes, userId }: TakeAttendanceModalProps) {
  const [selectedClass, setSelectedClass] = useState('');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Record<string, 'present' | 'absent' | 'late'>>({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const supabase = createClient();

  useEffect(() => {
    if (open) {
      setDate(new Date().toISOString().split('T')[0]); // Reset date on open
    } else {
      setSelectedClass('');
      setNotes('');
      setStudents([]);
      setAttendance({});
      setError('');
    }
  }, [open]);

  useEffect(() => {
    if (!selectedClass) return;
    async function loadStudents() {
      setLoading(true);
      const { data } = await supabase
        .from('class_students')
        .select(`
          profiles:student_id (
            id, first_name, last_name
          )
        `)
        .eq('class_id', selectedClass);

      if (data) {
        const mapped = data.map((d: any) => d.profiles as Student).filter(Boolean);
        setStudents(mapped);
        const initialMap: Record<string, any> = {};
        mapped.forEach((s) => (initialMap[s.id] = 'present'));
        setAttendance(initialMap);
      }
      setLoading(false);
    }
    loadStudents();
  }, [selectedClass]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedClass || students.length === 0) return;
    setSubmitting(true);
    setError('');

    // Fetch institution_id dynamically
    const { data: clsData } = await supabase
      .from('classes')
      .select('institution_id')
      .eq('id', selectedClass)
      .single();

    if (!clsData) {
      setError('Failed to resolve institution alignment.');
      setSubmitting(false);
      return;
    }

    // Phase 1: Burn the Session Ledger Node
    const { data: session, error: sessionErr } = await supabase
      .from('attendance_sessions')
      .insert({
        institution_id: clsData.institution_id,
        class_id: selectedClass,
        teacher_id: userId,
        session_date: date,
        notes: notes || null
      })
      .select('id')
      .single();

    if (sessionErr || !session) {
      setError(sessionErr?.message || 'Failed to create tracking session.');
      setSubmitting(false);
      return;
    }

    // Phase 2: Execute Massive Bulk Record Injection
    const records = students.map((s) => ({
      session_id: session.id,
      student_id: s.id,
      status: attendance[s.id]
    }));

    const { error: recordsErr } = await supabase.from('attendance_records').insert(records);

    if (recordsErr) {
      setError(recordsErr.message);
    } else {
      onSuccess();
      onClose();
    }
    setSubmitting(false);
  }

  const handleStatus = (studentId: string, status: 'present' | 'absent' | 'late') => {
    setAttendance((prev) => ({ ...prev, [studentId]: status }));
  };

  return (
    <Modal open={open} onClose={onClose} title="Take Attendance" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 bg-red-50 text-red-600 font-medium rounded-lg text-sm border border-red-100 flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">error</span>
            {error}
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Select Target Class</label>
            <select
              required
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              disabled={submitting}
            >
              <option value="" disabled>Choose a valid class...</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Session Date</label>
            <input
              type="date"
              required
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={submitting || !selectedClass}
            />
          </div>
        </div>

        {selectedClass && (
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <span className="text-sm font-bold text-slate-800">Enrolled Students</span>
              <span className="text-xs font-bold text-slate-500 bg-white border border-slate-200 px-2 py-1 rounded-md shadow-sm">{students.length} Headcount</span>
            </div>
            
            {loading ? (
              <div className="p-8 flex flex-col items-center justify-center gap-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-400" />
                <span className="text-slate-400 text-sm font-medium">Resolving student roster...</span>
              </div>
            ) : students.length === 0 ? (
               <div className="p-8 text-center text-slate-400 text-sm font-medium">Warning: No students are currently registered in this class block.</div>
            ) : (
              <div className="max-h-[350px] overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <tbody className="divide-y divide-slate-100">
                    {students.map((student) => (
                      <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 text-sm font-bold text-slate-700">
                          {student.first_name} {student.last_name}
                        </td>
                        <td className="p-4 text-right">
                          <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200/50 shadow-inner">
                            <button
                              type="button"
                              onClick={() => handleStatus(student.id, 'present')}
                              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all 
                                ${attendance[student.id] === 'present' ? 'bg-emerald-500 text-white shadow-md scale-105' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200'}`}
                            >
                              Present
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStatus(student.id, 'late')}
                              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all mx-0.5
                                ${attendance[student.id] === 'late' ? 'bg-amber-500 text-white shadow-md scale-105' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200'}`}
                            >
                              Late
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStatus(student.id, 'absent')}
                              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all 
                                ${attendance[student.id] === 'absent' ? 'bg-red-500 text-white shadow-md scale-105' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200'}`}
                            >
                              Absent
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">Session Notes <span className="font-normal text-slate-400">— Optional</span></label>
          <input
            type="text"
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="e.g. Midterm review day"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={submitting}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || students.length === 0}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-bold rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:scale-100 hover:-translate-y-0.5 flex items-center gap-2"
          >
            {submitting && <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"/>}
            Save Attendance
          </button>
        </div>
      </form>
    </Modal>
  );
}
