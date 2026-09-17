'use client';

import { useMemo } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';

interface Exam {
  id: string;
  class_id: string;
  subject_text: string | null;
  name: string;
  exam_date: string;
  max_score: number;
  weight: number;
}
interface Grade {
  id: string;
  exam_id: string;
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

function gradeColor(pct: number) {
  if (pct >= 80) return 'text-success';
  if (pct >= 60) return 'text-warning';
  return 'text-error';
}

export function StudentGradesClient({
  grades,
  exams,
}: {
  grades: Grade[];
  exams: Exam[];
}) {
  const examMap = useMemo(
    () => new Map(exams.map((e) => [e.id, e])),
    [exams]
  );

  const rows = useMemo(
    () =>
      grades
        .map((g) => {
          const exam = examMap.get(g.exam_id);
          if (!exam) return null;
          const pct = (g.score / exam.max_score) * 100;
          return { ...g, exam, pct, letter: letterFor(pct) };
        })
        .filter(Boolean) as Array<
        Grade & { exam: Exam; pct: number; letter: string }
      >,
    [grades, examMap]
  );

  const bySubject = useMemo(() => {
    const map = new Map<string, typeof rows>();
    rows.forEach((r) => {
      const key = r.exam.subject_text || 'Other';
      const arr = map.get(key) ?? [];
      arr.push(r);
      map.set(key, arr);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [rows]);

  const gpa = useMemo(() => {
    if (rows.length === 0) return null;
    let totalWeighted = 0;
    let totalWeight = 0;
    rows.forEach((r) => {
      totalWeighted += r.pct * r.exam.weight;
      totalWeight += r.exam.weight;
    });
    return totalWeight > 0 ? totalWeighted / totalWeight : null;
  }, [rows]);

  return (
    <div className="px-6 md:px-12 py-8">
      <PageHeader title="My Grades" subtitle="Exam results and GPA" />

      {gpa !== null && (
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="card-premium p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
              Weighted average
            </p>
            <p className={`mt-1 font-headline text-2xl font-bold ${gradeColor(gpa)}`}>
              {gpa.toFixed(1)}%
            </p>
          </div>
          <div className="card-premium p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
              Letter grade
            </p>
            <p className={`mt-1 font-headline text-2xl font-bold ${gradeColor(gpa)}`}>
              {letterFor(gpa)}
            </p>
          </div>
          <div className="card-premium p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
              Exams taken
            </p>
            <p className="mt-1 font-headline text-2xl font-bold text-on-surface">
              {rows.length}
            </p>
          </div>
          <div className="card-premium p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
              Subjects
            </p>
            <p className="mt-1 font-headline text-2xl font-bold text-on-surface">
              {bySubject.length}
            </p>
          </div>
        </div>
      )}

      <div className="mt-6 space-y-6">
        {bySubject.length === 0 ? (
          <div className="card-premium">
            <EmptyState
              icon="school"
              title="No grades yet"
              description="Your grades will appear here once exams are graded."
            />
          </div>
        ) : (
          bySubject.map(([subject, subRows]) => (
            <div key={subject} className="card-premium overflow-hidden">
              <div className="bg-surface-container-low px-6 py-3">
                <h3 className="text-sm font-semibold text-on-surface">
                  {subject}
                </h3>
              </div>
              <table className="w-full text-sm">
                <thead className="text-xs uppercase tracking-wider text-on-surface-variant">
                  <tr>
                    <th className="px-6 py-2 text-start font-semibold">Exam</th>
                    <th className="px-6 py-2 text-start font-semibold">Date</th>
                    <th className="px-6 py-2 text-start font-semibold">Score</th>
                    <th className="px-6 py-2 text-start font-semibold">%</th>
                    <th className="px-6 py-2 text-start font-semibold">Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {subRows.map((r) => (
                    <tr key={r.id} className="hover:bg-surface-container-low/40">
                      <td className="px-6 py-3 font-medium text-on-surface">
                        {r.exam.name}
                      </td>
                      <td className="px-6 py-3 text-xs text-on-surface-variant">
                        {new Date(r.exam.exam_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-3 font-mono text-on-surface">
                        {r.score}/{r.exam.max_score}
                      </td>
                      <td className={`px-6 py-3 font-mono ${gradeColor(r.pct)}`}>
                        {r.pct.toFixed(1)}
                      </td>
                      <td className={`px-6 py-3 font-semibold ${gradeColor(r.pct)}`}>
                        {r.letter}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
