'use client'

import { useTranslations } from 'next-intl'

const DAYS = [
  { short: 'Mon', key: 'Monday' },
  { short: 'Tue', key: 'Tuesday' },
  { short: 'Wed', key: 'Wednesday' },
  { short: 'Thu', key: 'Thursday' },
  { short: 'Fri', key: 'Friday' },
  { short: 'Sat', key: 'Saturday' },
  { short: 'Sun', key: 'Sunday' },
] as const

type Slot = { day: string; time: string; raw: string }

function parseSchedule(schedule: string): Slot[] {
  return schedule
    .split(';')
    .map(s => s.trim())
    .filter(Boolean)
    .map(raw => {
      const parts = raw.split(/\s+/)
      const day = parts[0] || ''
      const time = parts.slice(1).join(' ')
      return { day, time, raw }
    })
}

export function ScheduleGrid({
  schedule,
  compact = false,
}: {
  schedule: string | null
  compact?: boolean
}) {
  const t = useTranslations('classes')

  if (!schedule) {
    return (
      <div className="py-6 text-center border-dashed border-2 border-outline-variant/20 rounded-2xl bg-surface-container-low/30">
        <span className="material-symbols-outlined text-outline/20 text-3xl mb-2 block">event_busy</span>
        <p className="text-[10px] font-black text-outline uppercase tracking-widest opacity-40">
          {t('noSlots')}
        </p>
      </div>
    )
  }

  const slots = parseSchedule(schedule)
  const slotsByDay = DAYS.reduce<Record<string, { key: string; slots: Slot[] }>>((acc, { short, key }) => {
    const matched = slots.filter(s => s.day.toLowerCase().startsWith(short.toLowerCase().slice(0, 3)))
    if (matched.length > 0) acc[short] = { key, slots: matched }
    return acc
  }, {})

  const activeDays = Object.keys(slotsByDay)

  if (activeDays.length === 0) {
    return (
      <div className="space-y-2">
        {slots.map((slot, i) => (
          <div key={i} className="p-3 rounded-xl bg-surface-container-low/50 border border-outline-variant/10 flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-[18px]">schedule</span>
            <span className="text-xs font-bold text-on-surface">{slot.raw}</span>
          </div>
        ))}
      </div>
    )
  }

  if (compact) {
    return (
      <div className="flex flex-wrap gap-2">
        {activeDays.map(day => (
          <div key={day} className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/5 border border-primary/10">
            <span className="text-[10px] font-black text-primary uppercase tracking-widest">
              {t(`days.${slotsByDay[day].key}`)}
            </span>
            <span className="text-[10px] font-bold text-on-surface-variant">
              {slotsByDay[day].slots.map(s => s.time).join(', ')}
            </span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {activeDays.map(day => (
        <div key={day} className="p-4 rounded-2xl bg-surface-container-low/50 border border-outline-variant/10 hover:border-primary/30 transition-all">
          <p className="text-[9px] font-black text-outline uppercase tracking-widest mb-2 opacity-50">
            {t(`days.${slotsByDay[day].key}`)}
          </p>
          {slotsByDay[day].slots.map((slot, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[16px]">schedule</span>
              <span className="text-xs font-black text-on-surface tracking-tight">{slot.time}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
