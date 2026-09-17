-- ============================================================
-- Migration 00028: super_admin platform role
-- Extends profiles.role CHECK, adds is_super_admin() helper,
-- amends institution/profile/subscription/audit_log policies.
-- Super admin uses service-role admin client for cross-tenant
-- ops on other tables — we do not widen every policy.
-- ============================================================

-- 1. Extend profiles.role CHECK to allow 'super_admin'
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('institution_admin', 'teacher', 'student', 'super_admin'));

-- 2. Allow super_admin profiles to have NULL institution_id
--    (super admins are platform-level, not tied to a tenant)
ALTER TABLE profiles ALTER COLUMN institution_id DROP NOT NULL;
ALTER TABLE profiles ADD CONSTRAINT profiles_institution_required_unless_super
  CHECK (role = 'super_admin' OR institution_id IS NOT NULL);

-- 3. Helper: is_super_admin() — zero-query, JWT-based
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claims', true)::jsonb
      -> 'app_metadata' ->> 'role' = 'super_admin',
    false
  )
$$ LANGUAGE sql STABLE;

-- 4. Amend institutions policies: super_admin sees all
CREATE POLICY "super_admin_manage_institutions" ON institutions
  FOR ALL USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- 5. Amend profiles policies: super_admin sees all
CREATE POLICY "super_admin_manage_profiles" ON profiles
  FOR ALL USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- 6. Amend subscriptions policies: super_admin sees all
--    (subscriptions table exists from 00020)
CREATE POLICY "super_admin_manage_subscriptions" ON subscriptions
  FOR ALL USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- 7. audit_log: grant super_admin SELECT across all tenants
CREATE POLICY "super_admin_read_audit_log" ON audit_log
  FOR SELECT USING (public.is_super_admin());
