export const ROLES = {
  INSTITUTION_ADMIN: 'institution_admin',
  TEACHER: 'teacher',
  STUDENT: 'student',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_LABELS: Record<Role, { fr: string; ar: string }> = {
  institution_admin: { fr: 'Administrateur', ar: 'مدير' },
  teacher: { fr: 'Enseignant', ar: 'أستاذ' },
  student: { fr: 'Étudiant', ar: 'طالب' },
};
