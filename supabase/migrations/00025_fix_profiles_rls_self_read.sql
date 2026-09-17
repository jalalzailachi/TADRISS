-- Fix: Users must always be able to read their own profile.
-- The previous policies (profiles_select_policy from 00013, and
-- "Users can view profiles in their institution" from 00022) both depend on
-- get_institution_id() or a subquery on profiles, creating a circular dependency
-- that prevents users from reading their own profile row.
--
-- Solution: Re-add the simple "id = auth.uid()" self-read policy.
-- This is safe: a user reading their own profile is always allowed.

-- Re-add the self-read policy (was dropped in 00013)
DROP POLICY IF EXISTS "user_read_self" ON profiles;
CREATE POLICY "user_read_self" ON profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());
