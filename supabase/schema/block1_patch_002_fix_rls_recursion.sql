-- ============================================================
-- REPLO — Block 1 Patch 002: Fix gym_staff infinite recursion
-- 
-- Problem: gym_staff_select policy references gym_staff inside
-- its own RLS check, causing Postgres infinite recursion.
--
-- Fix: Create a SECURITY DEFINER helper function that bypasses
-- RLS to check gym membership, then rewrite the policy.
--
-- Must be run in Supabase SQL Editor.
-- ============================================================

-- 1. Create helper function (SECURITY DEFINER bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_gym_staff(p_gym_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.gym_staff
    WHERE gym_id = p_gym_id
      AND user_id = p_user_id
      AND is_active = TRUE
  );
$$;

-- 2. Also add an ownership check helper
CREATE OR REPLACE FUNCTION public.is_gym_owner(p_gym_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.gyms
    WHERE id = p_gym_id
      AND owner_id = p_user_id
  );
$$;

-- 3. Drop the broken gym_staff_select policy
DROP POLICY IF EXISTS gym_staff_select ON public.gym_staff;

-- 4. Recreate using the helper function (no self-reference)
CREATE POLICY gym_staff_select ON public.gym_staff
    FOR SELECT USING (
        user_id = auth.uid()
        OR is_gym_staff(gym_id, auth.uid())
    );

-- 5. Fix members_select_staff (also references gym_staff via EXISTS)
DROP POLICY IF EXISTS members_select_staff ON public.members;
CREATE POLICY members_select_staff ON public.members
    FOR SELECT USING (
        is_gym_staff(gym_id, auth.uid())
        OR is_gym_owner(gym_id, auth.uid())
    );

-- 6. Fix members_insert
DROP POLICY IF EXISTS members_insert ON public.members;
CREATE POLICY members_insert ON public.members
    FOR INSERT WITH CHECK (
        is_gym_staff(gym_id, auth.uid())
        OR is_gym_owner(gym_id, auth.uid())
    );

-- 7. Fix members_update
DROP POLICY IF EXISTS members_update ON public.members;
CREATE POLICY members_update ON public.members
    FOR UPDATE USING (
        is_gym_staff(gym_id, auth.uid())
        OR is_gym_owner(gym_id, auth.uid())
    ) WITH CHECK (
        is_gym_staff(gym_id, auth.uid())
        OR is_gym_owner(gym_id, auth.uid())
    );

-- 8. Fix members_delete
DROP POLICY IF EXISTS members_delete ON public.members;
CREATE POLICY members_delete ON public.members
    FOR DELETE USING (
        is_gym_staff(gym_id, auth.uid())
        OR is_gym_owner(gym_id, auth.uid())
    );

-- 9. Fix subscriptions policies (same pattern)
DROP POLICY IF EXISTS subscriptions_select_staff ON public.subscriptions;
CREATE POLICY subscriptions_select_staff ON public.subscriptions
    FOR SELECT USING (
        is_gym_staff(gym_id, auth.uid())
        OR is_gym_owner(gym_id, auth.uid())
    );

DROP POLICY IF EXISTS subscriptions_insert ON public.subscriptions;
CREATE POLICY subscriptions_insert ON public.subscriptions
    FOR INSERT WITH CHECK (
        is_gym_staff(gym_id, auth.uid())
        OR is_gym_owner(gym_id, auth.uid())
    );

DROP POLICY IF EXISTS subscriptions_update ON public.subscriptions;
CREATE POLICY subscriptions_update ON public.subscriptions
    FOR UPDATE USING (
        is_gym_staff(gym_id, auth.uid())
        OR is_gym_owner(gym_id, auth.uid())
    ) WITH CHECK (
        is_gym_staff(gym_id, auth.uid())
        OR is_gym_owner(gym_id, auth.uid())
    );

-- 10. Fix plans select policy
DROP POLICY IF EXISTS plans_select_staff ON public.plans;
CREATE POLICY plans_select_staff ON public.plans
    FOR SELECT USING (
        is_gym_staff(gym_id, auth.uid())
        OR is_gym_owner(gym_id, auth.uid())
    );

-- 11. Fix attendance select
DROP POLICY IF EXISTS attendance_select_staff ON public.attendance;
CREATE POLICY attendance_select_staff ON public.attendance
    FOR SELECT USING (
        is_gym_staff(gym_id, auth.uid())
        OR is_gym_owner(gym_id, auth.uid())
    );

-- 12. Fix equipment policies
DROP POLICY IF EXISTS equipment_select_staff ON public.equipment;
CREATE POLICY equipment_select_staff ON public.equipment
    FOR SELECT USING (
        is_gym_staff(gym_id, auth.uid())
        OR is_gym_owner(gym_id, auth.uid())
    );

-- 13. Fix equipment_reports policies
DROP POLICY IF EXISTS equipment_reports_select_staff ON public.equipment_reports;
CREATE POLICY equipment_reports_select_staff ON public.equipment_reports
    FOR SELECT USING (
        is_gym_staff(gym_id, auth.uid())
        OR is_gym_owner(gym_id, auth.uid())
    );

-- 14. Fix feedback policies
DROP POLICY IF EXISTS feedback_select_staff ON public.feedback;
CREATE POLICY feedback_select_staff ON public.feedback
    FOR SELECT USING (
        is_gym_staff(gym_id, auth.uid())
        OR is_gym_owner(gym_id, auth.uid())
    );
