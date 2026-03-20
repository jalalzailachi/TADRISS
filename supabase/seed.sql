-- ============================================================
-- Seed Data for Development
-- ============================================================

-- NOTE: This seed file is meant to be run AFTER all migrations
-- and AFTER the onboard-institution Edge Function has created
-- the first admin user. It adds sample data for development.

-- We'll use the existing institution and admin created via signup.
-- This script adds teachers, students, classes, and sample data.

-- To run: npx supabase db execute --file supabase/seed.sql

-- For development, you should first create an institution via 
-- the signup page, then use the Supabase Dashboard to:
-- 1. Note the institution_id from the institutions table
-- 2. Replace the placeholder UUIDs below with real ones

-- SAMPLE SQL for reference (customize with real IDs):

/*
-- Insert sample classes
INSERT INTO classes (institution_id, name, subject, level) VALUES
  ('INSTITUTION_ID', 'CP1 Primaire', 'General', 'Primary'),
  ('INSTITUTION_ID', 'CE2 Primaire', 'General', 'Primary'),
  ('INSTITUTION_ID', '6ème Collège', 'General', 'Middle School');

-- After creating teacher/student profiles via the Edge Function,
-- assign them to classes:

-- INSERT INTO class_teachers (institution_id, class_id, teacher_id) VALUES ...
-- INSERT INTO class_students (institution_id, class_id, student_id) VALUES ...
*/
