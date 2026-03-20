-- ============================================================
-- Migration 00007: enrollment_fees + payments + receipts
-- ============================================================

-- Enrollment fees: defines what students owe
CREATE TABLE enrollment_fees (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id  UUID NOT NULL REFERENCES institutions(id) ON DELETE RESTRICT,
  student_id      UUID NOT NULL REFERENCES profiles(id),
  class_id        UUID REFERENCES classes(id),
  amount          DECIMAL(10,2) NOT NULL,
  period_type     TEXT NOT NULL CHECK (period_type IN ('monthly', 'semester', 'annual', 'one_time')),
  label           TEXT,
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_enrollment_fees_student ON enrollment_fees(institution_id, student_id);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON enrollment_fees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Payments: append-only (no UPDATE/DELETE allowed via RLS)
CREATE TABLE payments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id  UUID NOT NULL REFERENCES institutions(id) ON DELETE RESTRICT,
  student_id      UUID NOT NULL REFERENCES profiles(id),
  amount          DECIMAL(10,2) NOT NULL,
  currency        TEXT DEFAULT 'MAD',
  payment_date    DATE NOT NULL,
  payment_method  TEXT CHECK (payment_method IN ('cash', 'transfer', 'check', 'other')),
  period_label    TEXT,
  notes           TEXT,
  status          TEXT DEFAULT 'recorded'
                  CHECK (status IN ('recorded', 'voided')),
  recorded_by     UUID REFERENCES profiles(id),
  voided_at       TIMESTAMPTZ,
  voided_by       UUID REFERENCES profiles(id),
  void_reason     TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
  -- NO updated_at: payments are immutable
);

CREATE INDEX idx_payments_student ON payments(student_id);
CREATE INDEX idx_payments_institution ON payments(institution_id);
CREATE INDEX idx_payments_inst_student ON payments(institution_id, student_id);
CREATE INDEX idx_payments_inst_date ON payments(institution_id, payment_date);

-- Receipts
CREATE TABLE receipts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id  UUID NOT NULL REFERENCES institutions(id) ON DELETE RESTRICT,
  payment_id      UUID NOT NULL REFERENCES payments(id) ON DELETE RESTRICT,
  receipt_number  TEXT NOT NULL,
  file_url        TEXT,
  generated_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(institution_id, receipt_number)
);
