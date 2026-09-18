'use client';

import { useMemo, useState, useTransition } from 'react';
import { useLocale } from 'next-intl';
import { toast } from 'sonner';
import { PageHeader } from '@/components/ui/PageHeader';
import { SlideOver } from '@/components/ui/SlideOver';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  upsertSchedule,
  deleteSchedule,
  upsertPeriod,
  deletePeriod,
} from '@/app/actions/schedules';

interface Class {
  id: string;
  name: string;
  grade_level: string | null;
}
interface Period {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  sort_order: number;
}
interface ScheduleEntry {
  id: string;
  class_id: string;
  period_id: string;
  day_of_week: number;
  subject_text: string | null;
  teacher_id: string | null;
  room: string | null;
}
interface Teacher {
  id: string;
  first_name: string;
  last_name: string;
}

// Localized short weekday names, index 0 = Sunday (2023-01-01 was a Sunday),
// matching the numeric day_of_week (0..6) stored on schedule entries.
const localizedDays = (locale: string) =>
  Array.from({ length: 7 }, (_, i) =>
    new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(new Date(Date.UTC(2023, 0, 1 + i)))
  );

export function ScheduleClient({
  classes,
  periods,
  schedules,
  teachers,
}: {
  classes: Class[];
  periods: Period[];
  schedules: ScheduleEntry[];
  teachers: Teacher[];
}) {
  const locale = useLocale();
  const DAYS = localizedDays(locale);
  const [classId, setClassId] = useState<string>(classes[0]?.id ?? '');
  const [isPending, startTransition] = useTransition();
  const [cellOpen, setCellOpen] = useState(false);
  const [periodOpen, setPeriodOpen] = useState(false);

  const [editPeriodId, setEditPeriodId] = useState<string | null>(null);
  const [editDow, setEditDow] = useState(1);
  const [subject, setSubject] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [room, setRoom] = useState('');

  const [pName, setPName] = useState('');
  const [pStart, setPStart] = useState('08:00');
  const [pEnd, setPEnd] = useState('08:55');
  const [pSort, setPSort] = useState(0);
  const [editingPeriodId, setEditingPeriodId] = useState<string | null>(null);

  const classSchedules = useMemo(
    () => schedules.filter((s) => s.class_id === classId),
    [schedules, classId]
  );

  const lookup = useMemo(() => {
    const m = new Map<string, ScheduleEntry>();
    classSchedules.forEach((s) =>
      m.set(`${s.period_id}-${s.day_of_week}`, s)
    );
    return m;
  }, [classSchedules]);

  const teacherMap = useMemo(
    () => new Map(teachers.map((t) => [t.id, t])),
    [teachers]
  );

  const openCell = (periodId: string, dow: number) => {
    setEditPeriodId(periodId);
    setEditDow(dow);
    const existing = lookup.get(`${periodId}-${dow}`);
    setSubject(existing?.subject_text ?? '');
    setTeacherId(existing?.teacher_id ?? '');
    setRoom(existing?.room ?? '');
    setCellOpen(true);
  };

  const saveCell = () => {
    if (!editPeriodId) return;
    startTransition(async () => {
      const res = await upsertSchedule({
        class_id: classId,
        period_id: editPeriodId,
        day_of_week: editDow,
        subject_text: subject || undefined,
        teacher_id: teacherId || null,
        room: room || undefined,
      });
      if (res.error) toast.error(res.error);
      else {
        toast.success('Saved');
        setCellOpen(false);
      }
    });
  };

  const clearCell = () => {
    if (!editPeriodId) return;
    const existing = lookup.get(`${editPeriodId}-${editDow}`);
    if (!existing) return;
    startTransition(async () => {
      const res = await deleteSchedule(existing.id);
      if (res.error) toast.error(res.error);
      else {
        toast.success('Cleared');
        setCellOpen(false);
      }
    });
  };

  const openPeriodForm = (p?: Period) => {
    if (p) {
      setEditingPeriodId(p.id);
      setPName(p.name);
      setPStart(p.start_time);
      setPEnd(p.end_time);
      setPSort(p.sort_order);
    } else {
      setEditingPeriodId(null);
      setPName('');
      setPStart('08:00');
      setPEnd('08:55');
      setPSort(periods.length);
    }
    setPeriodOpen(true);
  };

  const savePeriod = () => {
    if (!pName.trim()) {
      toast.error('Period name required');
      return;
    }
    startTransition(async () => {
      const res = await upsertPeriod(editingPeriodId, {
        name: pName,
        start_time: pStart,
        end_time: pEnd,
        sort_order: pSort,
      });
      if (res.error) toast.error(res.error);
      else {
        toast.success('Period saved');
        setPeriodOpen(false);
      }
    });
  };

  const removePeriod = (id: string) => {
    if (!confirm('Delete this period?')) return;
    startTransition(async () => {
      const res = await deletePeriod(id);
      if (res.error) toast.error(res.error);
      else toast.success('Period deleted');
    });
  };

  return (
    <div className="px-6 md:px-12 py-8">
      <PageHeader title="Schedule" subtitle="Weekly timetable" />

      <div className="mt-6 flex flex-wrap gap-3 items-end">
        <div className="min-w-[200px]">
          <label className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant mb-1 block">
            Class
          </label>
          <select
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
          >
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.grade_level ? ` · ${c.grade_level}` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-4">
        <section className="lg:col-span-9 card-premium overflow-x-auto">
          {periods.length === 0 ? (
            <EmptyState
              icon="schedule"
              title="No periods"
              description="Add periods in the sidebar to build a timetable."
            />
          ) : (
            <table className="w-full text-sm min-w-[700px]">
              <thead className="bg-surface-container-low text-xs uppercase tracking-wider text-on-surface-variant">
                <tr>
                  <th className="px-3 py-3 text-start font-semibold w-28">
                    Period
                  </th>
                  {DAYS.map((d, i) => (
                    <th key={i} className="px-2 py-3 text-center font-semibold">
                      {d}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {periods.map((p) => (
                  <tr key={p.id}>
                    <td className="px-3 py-2">
                      <p className="font-medium text-on-surface text-xs">
                        {p.name}
                      </p>
                      <p className="text-[10px] text-on-surface-variant">
                        {p.start_time} – {p.end_time}
                      </p>
                    </td>
                    {DAYS.map((_d, dow) => {
                      const entry = lookup.get(`${p.id}-${dow}`);
                      const teacher = entry?.teacher_id
                        ? teacherMap.get(entry.teacher_id)
                        : null;
                      return (
                        <td key={dow} className="px-1 py-1">
                          <button
                            type="button"
                            onClick={() => openCell(p.id, dow)}
                            className="w-full rounded-lg p-2 text-start hover:bg-primary-container/10 transition-colors min-h-[56px]"
                          >
                            {entry ? (
                              <>
                                <p className="text-xs font-semibold text-on-surface truncate">
                                  {entry.subject_text || '—'}
                                </p>
                                {teacher && (
                                  <p className="text-[10px] text-on-surface-variant truncate">
                                    {teacher.first_name} {teacher.last_name[0]}.
                                  </p>
                                )}
                                {entry.room && (
                                  <p className="text-[10px] text-outline truncate">
                                    {entry.room}
                                  </p>
                                )}
                              </>
                            ) : (
                              <span className="text-[10px] text-outline">+</span>
                            )}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <aside className="lg:col-span-3 card-premium p-4 h-fit space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-on-surface">Periods</h3>
            <button
              type="button"
              onClick={() => openPeriodForm()}
              className="rounded-lg p-1.5 hover:bg-primary-container/15 text-primary"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
            </button>
          </div>
          <ul className="space-y-1.5">
            {periods.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between rounded-lg bg-surface-container-low/50 px-3 py-2"
              >
                <div>
                  <p className="text-xs font-semibold text-on-surface">
                    {p.name}
                  </p>
                  <p className="text-[10px] text-on-surface-variant">
                    {p.start_time} – {p.end_time}
                  </p>
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => openPeriodForm(p)}
                    className="rounded p-1 hover:bg-surface-container-low text-outline"
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      edit
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => removePeriod(p.id)}
                    className="rounded p-1 hover:bg-error-soft text-outline hover:text-on-error-soft"
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      delete
                    </span>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </aside>
      </div>

      {/* Edit cell */}
      <SlideOver
        open={cellOpen}
        onClose={() => setCellOpen(false)}
        title={`${DAYS[editDow]} · ${periods.find((p) => p.id === editPeriodId)?.name ?? ''}`}
        footer={
          <div className="flex justify-between">
            <button
              type="button"
              onClick={clearCell}
              disabled={isPending}
              className="h-11 rounded-xl border border-error/40 text-error px-4 text-sm font-semibold hover:bg-error-soft disabled:opacity-60"
            >
              Clear
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCellOpen(false)}
                className="h-11 rounded-xl border border-outline-variant/40 px-4 text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveCell}
                disabled={isPending}
                className="h-11 rounded-xl bg-primary px-5 text-sm font-semibold text-on-primary disabled:opacity-60"
              >
                {isPending ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
              Subject
            </label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Math"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
              Teacher
            </label>
            <select
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
            >
              <option value="">— None —</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.first_name} {t.last_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
              Room
            </label>
            <input
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              placeholder="B-102"
            />
          </div>
        </div>
      </SlideOver>

      {/* Edit period */}
      <SlideOver
        open={periodOpen}
        onClose={() => setPeriodOpen(false)}
        title={editingPeriodId ? 'Edit period' : 'New period'}
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setPeriodOpen(false)}
              className="h-11 rounded-xl border border-outline-variant/40 px-4 text-sm font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={savePeriod}
              disabled={isPending}
              className="h-11 rounded-xl bg-primary px-5 text-sm font-semibold text-on-primary disabled:opacity-60"
            >
              {isPending ? 'Saving…' : 'Save'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
              Name
            </label>
            <input
              value={pName}
              onChange={(e) => setPName(e.target.value)}
              placeholder="Period 1"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
              Start time
            </label>
            <input
              type="time"
              value={pStart}
              onChange={(e) => setPStart(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
              End time
            </label>
            <input
              type="time"
              value={pEnd}
              onChange={(e) => setPEnd(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
              Sort order
            </label>
            <input
              type="number"
              value={pSort}
              onChange={(e) => setPSort(Number(e.target.value))}
            />
          </div>
        </div>
      </SlideOver>
    </div>
  );
}
