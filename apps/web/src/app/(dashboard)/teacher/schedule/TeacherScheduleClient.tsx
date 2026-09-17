'use client';

import { useMemo } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';

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
  room: string | null;
}
interface Class {
  id: string;
  name: string;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function TeacherScheduleClient({
  periods,
  schedules,
  classes,
}: {
  periods: Period[];
  schedules: ScheduleEntry[];
  classes: Class[];
}) {
  const classMap = useMemo(
    () => new Map(classes.map((c) => [c.id, c])),
    [classes]
  );

  const lookup = useMemo(() => {
    const m = new Map<string, ScheduleEntry>();
    schedules.forEach((s) => m.set(`${s.period_id}-${s.day_of_week}`, s));
    return m;
  }, [schedules]);

  return (
    <div className="px-6 md:px-12 py-8">
      <PageHeader title="My Schedule" subtitle="Your weekly timetable" />

      <div className="mt-6 card-premium overflow-x-auto">
        {periods.length === 0 || schedules.length === 0 ? (
          <EmptyState
            icon="schedule"
            title="No schedule assigned"
            description="Your admin will set up the timetable."
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
                    const cls = entry ? classMap.get(entry.class_id) : null;
                    return (
                      <td key={dow} className="px-1 py-1 text-center">
                        {entry ? (
                          <div className="rounded-lg bg-primary-container/10 p-2">
                            <p className="text-xs font-semibold text-on-surface">
                              {entry.subject_text || '—'}
                            </p>
                            {cls && (
                              <p className="text-[10px] text-on-surface-variant">
                                {cls.name}
                              </p>
                            )}
                            {entry.room && (
                              <p className="text-[10px] text-outline">
                                {entry.room}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px] text-outline">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
