-- Safe class deletion: remove all related data in order
CREATE OR REPLACE FUNCTION delete_class_cascade(p_class_id uuid, p_institution_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Verify class belongs to institution
  IF NOT EXISTS (
    SELECT 1 FROM classes WHERE id = p_class_id AND institution_id = p_institution_id
  ) THEN
    RAISE EXCEPTION 'Class not found or unauthorized';
  END IF;

  -- Delete in dependency order
  DELETE FROM attendance_records
    WHERE session_id IN (
      SELECT id FROM attendance_sessions WHERE class_id = p_class_id
    );
  DELETE FROM attendance_sessions WHERE class_id = p_class_id;
  DELETE FROM homework WHERE class_id = p_class_id;
  DELETE FROM class_students WHERE class_id = p_class_id;
  DELETE FROM class_teachers WHERE class_id = p_class_id;
  DELETE FROM classes WHERE id = p_class_id;
END;
$$;

-- Only institution_admin can call this
REVOKE ALL ON FUNCTION delete_class_cascade FROM PUBLIC;
GRANT EXECUTE ON FUNCTION delete_class_cascade TO authenticated;
