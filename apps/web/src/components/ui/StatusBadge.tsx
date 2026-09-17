import React from 'react'

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const configs: Record<string, { dot: string; bg: string; text: string; fallbackLabel: string }> = {
    present:  { dot: 'bg-tertiary',   bg: 'bg-success-soft',  text: 'text-on-success-soft',  fallbackLabel: status },
    active:   { dot: 'bg-tertiary',   bg: 'bg-success-soft',  text: 'text-on-success-soft',  fallbackLabel: status },
    paid:     { dot: 'bg-tertiary',   bg: 'bg-tertiary-fixed', text: 'text-on-tertiary-fixed-variant', fallbackLabel: status },
    recorded: { dot: 'bg-tertiary',   bg: 'bg-tertiary-fixed', text: 'text-on-tertiary-fixed-variant', fallbackLabel: status },
    absent:   { dot: 'bg-error',      bg: 'bg-error-soft',    text: 'text-on-error-soft',    fallbackLabel: status },
    inactive: { dot: 'bg-error',      bg: 'bg-error-container',text: 'text-on-error-container', fallbackLabel: status },
    overdue:  { dot: 'bg-error',      bg: 'bg-error-container',text: 'text-on-error-container', fallbackLabel: status },
    late:     { dot: 'bg-secondary',  bg: 'bg-warning-soft',  text: 'text-on-warning-soft',  fallbackLabel: status },
    pending:  { dot: 'bg-secondary-container', bg: 'bg-secondary-fixed', text: 'text-on-secondary-fixed-variant', fallbackLabel: status },
    voided:   { dot: 'bg-outline',    bg: 'bg-surface-variant',text: 'text-on-surface-variant', fallbackLabel: status },
    invite_pending: { dot: 'bg-secondary-container', bg: 'bg-secondary-container/20', text: 'text-on-secondary-container', fallbackLabel: status },
    institution_admin: { dot: 'bg-primary', bg: 'bg-primary-fixed', text: 'text-on-primary-fixed-variant', fallbackLabel: status },
    teacher:  { dot: 'bg-secondary',  bg: 'bg-teacher-soft',  text: 'text-on-teacher-soft',  fallbackLabel: status },
    student:  { dot: 'bg-primary',    bg: 'bg-student-soft',  text: 'text-on-student-soft',  fallbackLabel: status },
    excused:  { dot: 'bg-primary',    bg: 'bg-info-soft',     text: 'text-on-info-soft',     fallbackLabel: status },
  }
  const cfg = configs[status.toLowerCase()] ?? { dot: 'bg-outline', bg: 'bg-surface-variant', text: 'text-on-surface-variant', fallbackLabel: status }
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${cfg.bg} ${cfg.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${cfg.dot}`} />
      {label || cfg.fallbackLabel}
    </span>
  )
}
