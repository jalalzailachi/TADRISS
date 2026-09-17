'use client';

type Status = 'present' | 'absent' | 'late' | 'excused' | null;

export interface HeatmapDay {
  date: string;
  status: Status;
}

interface AttendanceHeatmapProps {
  days: HeatmapDay[];
  weeks?: number;
}

const cellBg: Record<NonNullable<Status>, string> = {
  present: 'bg-success-soft border-success/40',
  absent: 'bg-error-soft border-error/40',
  late: 'bg-warning-soft border-warning/40',
  excused: 'bg-info-soft border-info/40',
};

const statusLabel: Record<NonNullable<Status>, string> = {
  present: 'Present',
  absent: 'Absent',
  late: 'Late',
  excused: 'Excused',
};

export function AttendanceHeatmap({ days, weeks = 12 }: AttendanceHeatmapProps) {
  const byDate = new Map(days.map((d) => [d.date, d.status] as const));

  const today = new Date();
  const cells: HeatmapDay[] = [];
  const totalDays = weeks * 7;
  for (let i = totalDays - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    cells.push({ date: iso, status: byDate.get(iso) ?? null });
  }

  return (
    <div className="overflow-x-auto">
      <div
        className="grid gap-1"
        style={{
          gridTemplateColumns: `repeat(${weeks}, minmax(12px, 1fr))`,
          gridAutoFlow: 'column',
          gridTemplateRows: 'repeat(7, 12px)',
        }}
      >
        {cells.map((c) => (
          <div
            key={c.date}
            title={`${c.date} — ${c.status ? statusLabel[c.status] : 'No data'}`}
            className={`h-3 w-3 rounded-sm border ${
              c.status
                ? cellBg[c.status]
                : 'bg-surface-container border-outline-variant/30'
            }`}
          />
        ))}
      </div>
      <div className="mt-3 flex items-center gap-3 text-xs text-on-surface-variant">
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded-sm bg-success-soft border border-success/40" />
          Present
        </span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded-sm bg-error-soft border border-error/40" />
          Absent
        </span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded-sm bg-warning-soft border border-warning/40" />
          Late
        </span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded-sm bg-info-soft border border-info/40" />
          Excused
        </span>
      </div>
    </div>
  );
}
