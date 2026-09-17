-- ============================================================
-- Migration 00018: Fix payments RLS + Add Update/Delete
-- ============================================================

-- Allow admins to update payments (e.g. for voiding or notes)
CREATE POLICY "admin_update_payments" ON payments
  FOR UPDATE USING (
    institution_id = public.get_institution_id()
    AND public.get_user_role() = 'institution_admin'
  ) WITH CHECK (
    institution_id = public.get_institution_id()
    AND public.get_user_role() = 'institution_admin'
  );

-- Allow admins to delete payments if necessary (audit log will still track via triggers if configured)
CREATE POLICY "admin_delete_payments" ON payments
  FOR DELETE USING (
    institution_id = public.get_institution_id()
    AND public.get_user_role() = 'institution_admin'
  );

-- Ensure enrollment_fees also has update/delete for admins (already has "FOR ALL" but good to double check)
-- The original migration 00009 used "FOR ALL" for enrollment_fees, which covers UPDATE/DELETE.
-- However, payments only had INSERT and SELECT.
