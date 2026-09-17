-- ============================================================
-- Migration 00024: Fix audit_log actor_id NOT NULL constraint
-- When admin creates users via service role, auth.uid() is NULL
-- ============================================================

-- Make actor_id nullable to support admin/service-role operations
ALTER TABLE audit_log ALTER COLUMN actor_id DROP NOT NULL;

-- Recreate profile trigger to use COALESCE
CREATE OR REPLACE FUNCTION log_profile_changes()
RETURNS TRIGGER AS $$
DECLARE
  v_action TEXT;
  v_metadata JSONB;
BEGIN
  IF (TG_OP = 'INSERT') THEN
    v_action := 'profile.created';
    v_metadata := jsonb_build_object('new', to_jsonb(NEW));
  ELSIF (TG_OP = 'UPDATE') THEN
    IF (NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL) THEN
      v_action := 'profile.deleted';
    ELSE
      v_action := 'profile.updated';
    END IF;
    v_metadata := jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW));
  END IF;

  INSERT INTO audit_log (institution_id, actor_id, action, entity_type, entity_id, metadata)
  VALUES (NEW.institution_id, auth.uid(), v_action, 'profile', NEW.id, v_metadata);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate class trigger to use COALESCE
CREATE OR REPLACE FUNCTION log_class_changes()
RETURNS TRIGGER AS $$
DECLARE
  v_action TEXT;
  v_metadata JSONB;
BEGIN
  IF (TG_OP = 'INSERT') THEN
    v_action := 'class.created';
    v_metadata := jsonb_build_object('new', to_jsonb(NEW));
  ELSIF (TG_OP = 'UPDATE') THEN
    IF (NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL) THEN
      v_action := 'class.deleted';
    ELSE
      v_action := 'class.updated';
    END IF;
    v_metadata := jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW));
  END IF;

  INSERT INTO audit_log (institution_id, actor_id, action, entity_type, entity_id, metadata)
  VALUES (NEW.institution_id, auth.uid(), v_action, 'class', NEW.id, v_metadata);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
