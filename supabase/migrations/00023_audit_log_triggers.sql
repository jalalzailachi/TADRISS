-- ============================================================
-- Migration 00023: Audit Log Triggers
-- ============================================================

-- Function to log profile changes
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

CREATE TRIGGER audit_profile_changes
  AFTER INSERT OR UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION log_profile_changes();

-- Function to log class changes
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

CREATE TRIGGER audit_class_changes
  AFTER INSERT OR UPDATE ON classes
  FOR EACH ROW EXECUTE FUNCTION log_class_changes();
