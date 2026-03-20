-- ============================================================
-- Migration 00011: Password Change Flag
-- ============================================================

ALTER TABLE profiles ADD COLUMN must_change_password BOOLEAN DEFAULT true;

-- The initial admin (from onboard-institution) shouldn't be forced to change password
-- but for safety, we'll keep it true and update the onboard function to set it to false.
-- This migration just adds the column.
