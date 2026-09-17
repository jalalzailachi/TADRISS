-- ============================================================
-- Tadriss Seed Data — Demo Institution "Excellence Academy"
-- ============================================================
-- Run after all migrations: npx supabase db reset
-- This file seeds public-schema rows only.
-- Auth users are created by seed-auth.ts (see package.json db:seed).

-- Fixed UUIDs for reproducibility
DO $$
DECLARE
  v_inst_id uuid := '00000000-0000-0000-0000-000000000001';
BEGIN

-- Institution
INSERT INTO institutions (id, name, slug, city, phone, address, is_active, max_students, max_teachers)
VALUES (
  v_inst_id,
  'Excellence Academy',
  'excellence-academy',
  'Casablanca',
  '+212 522 123 456',
  '123 Boulevard Mohammed V, Casablanca 20000',
  true,
  200,
  30
) ON CONFLICT (id) DO NOTHING;

-- Classes (3 classes, different grade levels)
INSERT INTO classes (id, institution_id, name, grade_level, subject, is_active) VALUES
  ('00000000-0000-0000-0001-000000000001', v_inst_id, 'CP1 - Primaire', 'CP1', 'General', true),
  ('00000000-0000-0000-0001-000000000002', v_inst_id, 'CE2 - Primaire', 'CE2', 'General', true),
  ('00000000-0000-0000-0001-000000000003', v_inst_id, '6ème - Collège', '6ème', 'General', true)
ON CONFLICT (id) DO NOTHING;

-- Grading scale
INSERT INTO grading_scales (id, institution_id, name, is_default, scale) VALUES
  ('00000000-0000-0000-0002-000000000001', v_inst_id, 'Default Scale', true,
   '[{"letter":"A+","min":90},{"letter":"A","min":85},{"letter":"B+","min":80},{"letter":"B","min":75},{"letter":"C+","min":70},{"letter":"C","min":65},{"letter":"D","min":60},{"letter":"F","min":0}]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Broadcasts / Announcements
INSERT INTO broadcasts (id, institution_id, title, message, role_target, audience, is_pinned, created_at) VALUES
  ('00000000-0000-0000-0003-000000000001', v_inst_id, 'Welcome to the new school year!',
   '<p>Dear community, we are excited to welcome everyone to the 2024-2025 academic year. Please check your schedules and contact your teachers if you have questions.</p>',
   'all', 'all', true, NOW() - interval '7 days'),
  ('00000000-0000-0000-0003-000000000002', v_inst_id, 'Parent-Teacher Conference',
   '<p>The annual parent-teacher conference will be held on Saturday, October 12th from 9:00 AM to 1:00 PM. All parents are encouraged to attend.</p>',
   'all', 'all', false, NOW() - interval '3 days'),
  ('00000000-0000-0000-0003-000000000003', v_inst_id, 'Exam Schedule Published',
   '<p>The midterm exam schedule has been published. Please review and prepare accordingly. Teachers should submit their exam papers by Friday.</p>',
   'teachers', 'teachers', false, NOW() - interval '1 day')
ON CONFLICT (id) DO NOTHING;

END $$;
