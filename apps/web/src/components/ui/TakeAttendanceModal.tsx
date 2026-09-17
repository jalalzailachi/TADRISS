'use client';
import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
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

type AttendanceStatus = 'present' | 'absent' | 'late';

export function TakeAttendanceModal({ open, onClose, onSuccess, classes, userId }: TakeAttendanceModalProps) {
  const t = useTranslations('attendance');
  const tc = useTranslations('common');
  const [selectedClass, setSelectedClass] = useState('');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setDate(new Date().toISOString().split('T')[0]);
    } else {
      setSelectedClass('');
      setNotes('');
      setStudents([]);
      setAttendance({});
      setError('');
    }
  }

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
        const mapped = (data as unknown as { profiles: Student }[]).map((d) => d.profiles).filter(Boolean);
        setStudents(mapped);
        const initialMap: Record<string, AttendanceStatus> = {};
        mapped.forEach((s) => (initialMap[s.id] = 'present'));
        setAttendance(initialMap);
      }
      setLoading(false);
    }
    loadStudents();
  }, [selectedClass, supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedClass || students.length === 0) return;
    setSubmitting(true);
    setError('');

    const { data: clsData } = await supabase
      .from('classes')
      .select('institution_id')
      .eq('id', selectedClass)
      .single();

    if (!clsData) {
      setError(t('errorResolveInstitution'));
      setSubmitting(false);
      return;
    }

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
      setError(sessionErr?.message || t('errorCreateSession'));
      setSubmitting(false);
      return;
    }

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
      router.refresh();
    }
    setSubmitting(false);
  }

  const handleStatus = (studentId: string, status: AttendanceStatus) => {
    setAttendance((prev) => ({ ...prev, [studentId]: status }));
  };

  return (
    <Modal open={open} onClose={onClose} title={t('takeAttendance')} size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 bg-error-soft text-on-error-soft font-medium rounded-xl text-sm border border-on-error-soft/10 flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">error</span>
            {error}
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[11px] font-black text-outline uppercase tracking-widest ps-1">{t('selectClass')}</label>
            <select
              required
              className="w-full h-11 px-4 bg-surface-container-low border border-outline-variant/20 rounded-xl text-sm font-bold focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              disabled={submitting}
            >
              <option value="" disabled>{t('chooseClass')}</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-black text-outline uppercase tracking-widest ps-1">{t('sessionDate')}</label>
            <input
              type="date"
              required
              className="w-full h-11 px-4 bg-surface-container-low border border-outline-variant/20 rounded-xl text-sm font-bold focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={submitting || !selectedClass}
            />
          </div>
        </div>

        {selectedClass && (
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 overflow-hidden shadow-sm">
            <div className="bg-surface-container-low px-4 py-3 border-b border-outline-variant/10 flex items-center justify-between">
              <span className="text-sm font-bold text-on-surface">{t('enrolledStudents')}</span>
              <span className="text-[10px] font-bold text-outline bg-surface-container-high px-2 py-1 rounded-lg uppercase tracking-wider">{students.length} {t('headcount')}</span>
            </div>

            {loading ? (
              <div className="p-8 flex flex-col items-center justify-center gap-3">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
                <span className="text-outline text-sm font-medium">{tc('loading')}</span>
              </div>
            ) : students.length === 0 ? (
               <div className="p-8 text-center text-outline text-sm font-medium">{t('noStudentsInClass')}</div>
            ) : (
              <div className="max-h-[350px] overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <tbody className="divide-y divide-outline-variant/10">
                    {students.map((student) => (
                      <tr key={student.id} className="hover:bg-surface-container-low transition-colors">
                        <td className="p-4 text-sm font-bold text-on-surface">
                          {student.first_name} {student.last_name}
                        </td>
                        <td className="p-4 text-right">
                          <div className="inline-flex rounded-xl bg-surface-container-low p-1 border border-outline-variant/10 shadow-inner">
                            <button
                              type="button"
                              onClick={() => handleStatus(student.id, 'present')}
                              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all
                                ${attendance[student.id] === 'present' ? 'bg-tertiary text-on-tertiary shadow-md' : 'text-outline hover:text-on-surface hover:bg-surface-container-high'}`}
                            >
                              {t('present')}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStatus(student.id, 'late')}
                              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all mx-0.5
                                ${attendance[student.id] === 'late' ? 'bg-secondary text-on-secondary shadow-md' : 'text-outline hover:text-on-surface hover:bg-surface-container-high'}`}
                            >
                              {t('late')}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStatus(student.id, 'absent')}
                              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all
                                ${attendance[student.id] === 'absent' ? 'bg-error text-on-error shadow-md' : 'text-outline hover:text-on-surface hover:bg-surface-container-high'}`}
                            >
                              {t('absent')}
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
          <label className="text-[11px] font-black text-outline uppercase tracking-widest ps-1">{t('sessionNotes')} <span className="font-normal text-outline/50">— {tc('optional')}</span></label>
          <input
            type="text"
            className="w-full h-11 px-4 bg-surface-container-low border border-outline-variant/20 rounded-xl text-sm font-bold focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none"
            placeholder={t('sessionNotesPlaceholder')}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={submitting}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-6 border-t border-outline-variant/10">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="h-11 px-6 rounded-xl text-[10px] font-black text-outline uppercase tracking-widest hover:bg-surface-container-high transition-all"
          >
            {tc('cancel')}
          </button>
          <button
            type="submit"
            disabled={submitting || students.length === 0}
            className="h-11 px-8 bg-on-surface text-surface rounded-xl font-black uppercase tracking-widest text-xs shadow-xl shadow-on-surface/10 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 min-w-[160px] disabled:opacity-40"
          >
            {submitting && <div className="w-4 h-4 border-2 border-surface/30 border-t-surface rounded-full animate-spin"/>}
            {t('saveAttendance')}
          </button>
        </div>
      </form>
    </Modal>
  );
}
