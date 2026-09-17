-- ============================================================
-- Migration 00030: direct messaging (messages + recipients)
-- ============================================================

CREATE TABLE messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id  UUID NOT NULL REFERENCES institutions(id) ON DELETE RESTRICT,
  sender_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  subject         TEXT NOT NULL,
  body            TEXT NOT NULL,
  sent_at         TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_messages_institution_sent ON messages(institution_id, sent_at DESC);
CREATE INDEX idx_messages_sender ON messages(sender_id, sent_at DESC);

CREATE TABLE message_recipients (
  message_id      UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  is_read         BOOLEAN DEFAULT false,
  read_at         TIMESTAMPTZ,
  PRIMARY KEY (message_id, user_id)
);

CREATE INDEX idx_message_recipients_user ON message_recipients(user_id, is_read);

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "member_read_own_messages" ON messages
  FOR SELECT USING (
    institution_id = public.get_institution_id()
    AND (
      sender_id = auth.uid()
      OR id IN (SELECT message_id FROM message_recipients WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "member_send_messages" ON messages
  FOR INSERT WITH CHECK (
    institution_id = public.get_institution_id()
    AND sender_id = auth.uid()
  );

ALTER TABLE message_recipients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "recipient_read_own_entries" ON message_recipients
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "sender_read_recipients" ON message_recipients
  FOR SELECT USING (
    message_id IN (SELECT id FROM messages WHERE sender_id = auth.uid())
  );

CREATE POLICY "sender_insert_recipients" ON message_recipients
  FOR INSERT WITH CHECK (
    message_id IN (SELECT id FROM messages WHERE sender_id = auth.uid())
  );

CREATE POLICY "recipient_update_read_state" ON message_recipients
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
