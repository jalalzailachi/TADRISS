'use client';

import { useMemo, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/ui/PageHeader';
import { SlideOver } from '@/components/ui/SlideOver';
import { EmptyState } from '@/components/ui/EmptyState';
import { createExam, upsertGrades, deleteExam } from '@/app/actions/grades';

interface Class {
  id: string;
  name: string;
  grade_level: string | null;
}
interface Exam {
  id: string;
  class_id: string;
  subject_text: string | null;
  academic_term: string | null;
  name: string;
  exam_date: string;
  max_score: number;
  weight: number;
}
interface Student {
  id: string;
  first_name: string;
  last_name: string;
}
interface Enrollment {
  class_id: string;
  student: Student | null;
}
interface Grade {
  id: string;
  exam_id: string;
  student_id: string;
  score: number;
  comment: string | null;
}

function letterFor(pct: number) {
  if (pct >= 90) return 'A+';
  if (pct >= 85) return 'A';
  if (pct >= 80) return 'B+';
  if (pct >= 75) return 'B';
  if (pct >= 70) return 'C+';
  if (pct >= 65) return 'C';
  if (pct >= 60) return 'D';
  return 'F';
}

export function GradesClient({
  classes,
  exams,
  enrollments,
  grades,
}: {
  classes: Class[];
  exams: Exam[];
  enrollments: Enrollment[];
  grades: Grade[];
}) {
  const [classId, setClassId] = useState<string>(classes[0]?.id ?? '');
  const [examId, setExamId] = useState<string>('');
  const [composeOpen, setComposeOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [examName, setExamName] = useState('');
  const [examSubject, setExamSubject] = useState('');
  const [examDate, setExamDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [examMax, setExamMax] = useState(100);

  const classExams = useMemo(
    () => exams.filter((e) => e.class_id === classId),
    [exams, classId]
  );

  const selectedExam = exams.find((e) => e.id === examId) ?? null;

  const classStudents = useMemo(
    () =>
      enrollments
        .filter((e) => e.class_id === classId && e.student)
        .map((e) => e.student as Student),
    [enrollments, classId]
  );

  const [scores, setScores] = useState<Record<string, string>>({});

  const currentGrades = useMemo(() => {
    const map = new Map<string, Grade>();
    grades
      .filter((g) => g.exam_id === examId)
      .forEach((g) => map.set(g.student_id, g));
    return map;
  }, [grades, examId]);

  const effectiveScore = (studentId: string) => {
    if (scores[studentId] !== undefined) return scores[studentId];
    const g = currentGrades.get(studentId);
    return g ? String(g.score) : '';
  };

  const saveGrades = () => {
    if (!selectedExam) return;
    const entries = classStudents
      .map((s) => {
        const raw = effectiveScore(s.id);
        if (raw === '') return null;
        const score = Number(raw);
        if (Number.isNaN(score)) return null;
        return {
          exam_id: selectedExam.id,
          class_id: selectedExam.class_id,
          student_id: s.id,
          score,
        };
      })
      .filter(Boolean) as Array<{
      exam_id: string;
      class_id: string;
      student_id: string;
      score: number;
    }>;

    if (entries.length === 0) {
      toast.error('Enter at least one score');
      return;
    }

    startTransition(async () => {
      const res = await upsertGrades(entries);
      if (res.error) toast.error(res.error);
      else {
        toast.success(`Saved ${entries.length} grades`);
        setScores({});
      }
    });
  };

  const submitExam = () => {
    if (!examName.trim() || !classId) {
      toast.error('Name and class required');
      return;
    }
    startTransition(async () => {
      const res = await createExam({
        class_id: classId,
        name: examName,
        subject_text: examSubject || undefined,
        exam_date: examDate,
        max_score: examMax,
      });
      if (res.error) toast.error(res.error);
      else {
        toast.success('Exam created');
        setExamName('');
        setExamSubject('');
        setComposeOpen(false);
      }
    });
  };

  const onDeleteExam = (id: string) => {
    if (!confirm('Delete this exam and all its grades?')) return;
    startTransition(async () => {
      const res = await deleteExam(id);
      if (res.error) toast.error(res.error);
      else {
        toast.success('Exam deleted');
        if (examId === id) setExamId('');
      }
    });
  };

  const stats = useMemo(() => {
    if (!selectedExam) return null;
    const vals = classStudents
      .map((s) => {
        const raw = effectiveScore(s.id);
        return raw === '' ? null : Number(raw);
      })
      .filter((n): n is number => n !== null && !Number.isNaN(n));
    if (vals.length === 0) return null;
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    const max = Math.max(...vals);
    const min = Math.min(...vals);
    const pass = vals.filter((v) => v / selectedExam.max_score >= 0.6).length;
    return { avg, max, min, pass, total: vals.length };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedExam, classStudents, scores, currentGrades]);

  return (
    <div className="px-6 md:px-12 py-8">
      <PageHeader
        title="Grades"
        subtitle="Exams and student scores"
        action={
          <button
            type="button"
            onClick={() => setComposeOpen(true)}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-on-primary shadow-sm hover:bg-primary-container transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            New exam
          </button>
        }
      />

      <div className="mt-6 card-premium p-4 flex flex-wrap gap-3 items-end">
        <div className="min-w-[200px]">
          <label className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant mb-1 block">
            Class
          </label>
          <select
            value={classId}
            onChange={(e) => {
              setClassId(e.target.value);
              setExamId('');
            }}
          >
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.grade_level ? ` · ${c.grade_level}` : ''}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-[240px]">
          <label className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant mb-1 block">
            Exam
          </label>
          <select value={examId} onChange={(e) => setExamId(e.target.value)}>
            <option value="">— Select exam —</option>
            {classExams.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name} · {new Date(e.exam_date).toLocaleDateString()}
              </option>
            ))}
          </select>
        </div>
        {selectedExam && (
          <button
            type="button"
            onClick={() => onDeleteExam(selectedExam.id)}
            className="h-11 rounded-xl border border-error/40 text-error px-4 text-sm font-semibold hover:bg-error-soft"
          >
            Delete exam
          </button>
        )}
      </div>

      {stats && (
        <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatTile label="Average" value={stats.avg.toFixed(1)} />
          <StatTile label="Highest" value={String(stats.max)} />
          <StatTile label="Lowest" value={String(stats.min)} />
          <StatTile label="Pass rate" value={`${Math.round((stats.pass / stats.total) * 100)}%`} />
          <StatTile label="Entered" value={`${stats.total}/${classStudents.length}`} />
        </div>
      )}

      <div className="mt-6 card-premium overflow-hidden">
        {!selectedExam ? (
          <EmptyState
            icon="grading"
            title="Select an exam"
            description="Pick a class and exam to enter grades, or create a new exam."
          />
        ) : classStudents.length === 0 ? (
          <EmptyState
            icon="group"
            title="No students in class"
            description="Enroll students to begin grading."
          />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-surface-container-low text-xs uppercase tracking-wider text-on-surface-variant">
              <tr>
                <th className="px-6 py-3 text-start font-semibold">Student</th>
                <th className="px-6 py-3 text-start font-semibold w-40">
                  Score / {selectedExam.max_score}
                </th>
                <th className="px-6 py-3 text-start font-semibold w-24">%</th>
                <th className="px-6 py-3 text-start font-semibold w-24">Letter</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {classStudents.map((s) => {
                const val = effectiveScore(s.id);
                const num = val === '' ? null : Number(val);
                const pct =
                  num !== null && !Number.isNaN(num)
                    ? (num / selectedExam.max_score) * 100
                    : null;
                return (
                  <tr key={s.id} className="hover:bg-surface-container-low/40">
                    <td className="px-6 py-3 font-medium text-on-surface">
                      {s.first_name} {s.last_name}
                    </td>
                    <td className="px-6 py-3">
                      <input
                        type="number"
                        min={0}
                        max={selectedExam.max_score}
                        value={val}
                        onChange={(e) =>
                          setScores((prev) => ({ ...prev, [s.id]: e.target.value }))
                        }
                        className="h-9 w-28"
                      />
                    </td>
                    <td className="px-6 py-3 font-mono text-xs text-on-surface-variant">
                      {pct !== null ? pct.toFixed(1) : '—'}
                    </td>
                    <td className="px-6 py-3 font-semibold text-on-surface">
                      {pct !== null ? letterFor(pct) : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {selectedExam && classStudents.length > 0 && (
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={saveGrades}
            disabled={isPending}
            className="h-11 rounded-xl bg-primary px-6 text-sm font-semibold text-on-primary disabled:opacity-60"
          >
            {isPending ? 'Saving…' : 'Save grades'}
          </button>
        </div>
      )}

      <SlideOver
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        title="New exam"
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setComposeOpen(false)}
              className="h-11 rounded-xl border border-outline-variant/40 px-4 text-sm font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={submitExam}
              disabled={isPending}
              className="h-11 rounded-xl bg-primary px-5 text-sm font-semibold text-on-primary disabled:opacity-60"
            >
              {isPending ? 'Saving…' : 'Create'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
              Class
            </label>
            <select value={classId} onChange={(e) => setClassId(e.target.value)}>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
              Name
            </label>
            <input
              value={examName}
              onChange={(e) => setExamName(e.target.value)}
              placeholder="Midterm 1"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
              Subject
            </label>
            <input
              value={examSubject}
              onChange={(e) => setExamSubject(e.target.value)}
              placeholder="Math"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
              Date
            </label>
            <input
              type="date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
              Max score
            </label>
            <input
              type="number"
              value={examMax}
              onChange={(e) => setExamMax(Number(e.target.value))}
            />
          </div>
        </div>
      </SlideOver>
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="card-premium p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
        {label}
      </p>
      <p className="mt-1 font-headline text-2xl font-bold text-on-surface">
        {value}
      </p>
    </div>
  );
}
