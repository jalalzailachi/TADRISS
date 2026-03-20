export const ATTENDANCE_STATUS = {
  PRESENT: 'present',
  ABSENT: 'absent',
  LATE: 'late',
} as const;

export type AttendanceStatus =
  (typeof ATTENDANCE_STATUS)[keyof typeof ATTENDANCE_STATUS];

export const PAYMENT_STATUS = {
  RECORDED: 'recorded',
  VOIDED: 'voided',
} as const;

export type PaymentStatus =
  (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS];

export const PAYMENT_METHODS = {
  CASH: 'cash',
  TRANSFER: 'transfer',
  CHECK: 'check',
  OTHER: 'other',
} as const;

export type PaymentMethod =
  (typeof PAYMENT_METHODS)[keyof typeof PAYMENT_METHODS];

export const SUBSCRIPTION_TIERS = {
  FREE: 'free',
  STARTER: 'starter',
  PRO: 'pro',
} as const;

export type SubscriptionTier =
  (typeof SUBSCRIPTION_TIERS)[keyof typeof SUBSCRIPTION_TIERS];

export const PERIOD_TYPES = {
  MONTHLY: 'monthly',
  SEMESTER: 'semester',
  ANNUAL: 'annual',
  ONE_TIME: 'one_time',
} as const;

export type PeriodType =
  (typeof PERIOD_TYPES)[keyof typeof PERIOD_TYPES];
