const variants = {
  present: 'bg-success-soft text-on-success-soft',
  absent:  'bg-error-soft text-on-error-soft',
  late:    'bg-warning-soft text-on-warning-soft',
  paid:    'bg-success-soft text-on-success-soft',
  pending: 'bg-warning-soft text-on-warning-soft',
  voided:  'bg-surface-container-high text-outline',
  admin:   'bg-info-soft text-on-info-soft',
  teacher: 'bg-teacher-soft text-on-teacher-soft',
  student: 'bg-student-soft text-on-student-soft',
  active:  'bg-success-soft text-on-success-soft',
  primary: 'bg-primary/10 text-primary',
  neutral: 'bg-surface-container-high text-on-surface-variant',
  warning: 'bg-warning-soft text-on-warning-soft',
  success: 'bg-success-soft text-on-success-soft',
  danger:  'bg-error-soft text-on-error-soft',
}

export function Badge({ variant, label }: {
  variant: keyof typeof variants
  label: string
}) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full
                      text-xs font-semibold ${variants[variant]}`}>
      {label}
    </span>
  )
}
