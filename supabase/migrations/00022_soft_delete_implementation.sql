-- ============================================================
-- Migration 00022: Soft-Delete Implementation
-- ============================================================

-- 1. Add deleted_at column to core tables
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE classes ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE attendance_sessions ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE homework ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- 2. Update RLS policies to respect soft-deletion
-- Note: We need to update existing policies to include "AND deleted_at IS NULL"
-- Instead of dropping and recreating all, we can modify the view or just add a global filter if using views, 
-- but since we use direct table access with RLS, we must update the policies.

-- Profiles
DROP POLICY IF EXISTS "Users can view profiles in their institution" ON profiles;
CREATE POLICY "Users can view profiles in their institution" ON profiles
  FOR SELECT USING (
    institution_id = (SELECT institution_id FROM profiles WHERE id = auth.uid())
    AND deleted_at IS NULL
  );

-- Classes
DROP POLICY IF EXISTS "Users can view classes in their institution" ON classes;
CREATE POLICY "Users can view classes in their institution" ON classes
  FOR SELECT USING (
    institution_id = (SELECT institution_id FROM profiles WHERE id = auth.uid())
    AND deleted_at IS NULL
  );

-- Attendance Sessions
DROP POLICY IF EXISTS "Users can view attendance sessions in their institution" ON attendance_sessions;
CREATE POLICY "Users can view attendance sessions in their institution" ON attendance_sessions
  FOR SELECT USING (
    institution_id = (SELECT institution_id FROM profiles WHERE id = auth.uid())
    AND deleted_at IS NULL
  );

-- Homework
DROP POLICY IF EXISTS "Users can view homework in their institution" ON homework;
CREATE POLICY "Users can view homework in their institution" ON homework
  FOR SELECT USING (
    institution_id = (SELECT institution_id FROM profiles WHERE id = auth.uid())
    AND deleted_at IS NULL
  );

-- 3. Refactor delete_class_cascade to perform soft-delete
CREATE OR REPLACE FUNCTION delete_class_cascade(p_class_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Soft delete the class
  UPDATE classes SET deleted_at = now() WHERE id = p_class_id;
  
  -- Soft delete associated attendance sessions
  UPDATE attendance_sessions SET deleted_at = now() WHERE class_id = p_class_id;
  
  -- Soft delete associated homework
  UPDATE homework SET deleted_at = now() WHERE class_id = p_class_id;
  
  -- Log the action
  INSERT INTO audit_log (institution_id, actor_id, action, entity_type, entity_id, metadata)
  SELECT institution_id, auth.uid(), 'class.deleted_cascade', 'class', p_class_id, jsonb_build_object('class_id', p_class_id)
  FROM classes WHERE id = p_class_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
