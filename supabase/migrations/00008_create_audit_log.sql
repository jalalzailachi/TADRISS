-- ============================================================
-- Migration 00008: audit_log (insert-only)
-- ============================================================

CREATE TABLE audit_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id  UUID NOT NULL,
  actor_id        UUID NOT NULL,
  action          TEXT NOT NULL,
  entity_type     TEXT NOT NULL,
  entity_id       UUID NOT NULL,
  metadata        JSONB,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_audit_institution ON audit_log(institution_id);
CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id);

-- Trigger: auto-log payment inserts
CREATE OR REPLACE FUNCTION log_payment_insert()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_log (institution_id, actor_id, action, entity_type, entity_id, metadata)
  VALUES (
    NEW.institution_id,
    COALESCE(NEW.recorded_by, auth.uid()),
    'payment.created',
    'payment',
    NEW.id,
    jsonb_build_object(
      'amount', NEW.amount,
      'student_id', NEW.student_id,
      'payment_method', NEW.payment_method
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER audit_payment_insert
  AFTER INSERT ON payments
  FOR EACH ROW EXECUTE FUNCTION log_payment_insert();
