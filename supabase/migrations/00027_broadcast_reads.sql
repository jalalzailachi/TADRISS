-- Track which broadcasts each user has read
CREATE TABLE broadcast_reads (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broadcast_id    UUID NOT NULL REFERENCES broadcasts(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  read_at         TIMESTAMPTZ DEFAULT now(),
  UNIQUE(broadcast_id, user_id)
);

CREATE INDEX idx_broadcast_reads_user ON broadcast_reads(user_id);

-- RLS
ALTER TABLE broadcast_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own broadcast_reads"
  ON broadcast_reads FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own broadcast_reads"
  ON broadcast_reads FOR INSERT
  WITH CHECK (user_id = auth.uid());
