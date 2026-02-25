-- ============================================================
-- REPLO — Block 1: SAFE PATCH 001
-- Fixes structural issues without breaking existing data
-- ============================================================

BEGIN;

-- ============================================================
-- ISSUE 1 — equipment_reports.reported_by FK contradiction
-- NOT NULL conflicts with ON DELETE SET NULL
-- Fix: Drop NOT NULL, keep ON DELETE SET NULL
-- ============================================================

ALTER TABLE public.equipment_reports
    ALTER COLUMN reported_by DROP NOT NULL;

-- ============================================================
-- ISSUE 2 — Enforce Gym Consistency in subscriptions
-- Prevent cross-gym contamination: member and plan must
-- belong to the same gym_id as the subscription
-- ============================================================

CREATE OR REPLACE FUNCTION public.fn_check_subscription_gym_consistency()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_member_gym_id UUID;
    v_plan_gym_id   UUID;
BEGIN
    SELECT gym_id INTO v_member_gym_id
    FROM public.members
    WHERE id = NEW.member_id;

    IF v_member_gym_id IS NULL THEN
        RAISE EXCEPTION 'subscription_gym_check: member_id % does not exist', NEW.member_id;
    END IF;

    IF v_member_gym_id IS DISTINCT FROM NEW.gym_id THEN
        RAISE EXCEPTION 'subscription_gym_check: member.gym_id (%) != subscription.gym_id (%)',
            v_member_gym_id, NEW.gym_id;
    END IF;

    SELECT gym_id INTO v_plan_gym_id
    FROM public.plans
    WHERE id = NEW.plan_id;

    IF v_plan_gym_id IS NULL THEN
        RAISE EXCEPTION 'subscription_gym_check: plan_id % does not exist', NEW.plan_id;
    END IF;

    IF v_plan_gym_id IS DISTINCT FROM NEW.gym_id THEN
        RAISE EXCEPTION 'subscription_gym_check: plan.gym_id (%) != subscription.gym_id (%)',
            v_plan_gym_id, NEW.gym_id;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_subscription_gym_consistency ON public.subscriptions;

CREATE CONSTRAINT TRIGGER trg_subscription_gym_consistency
    AFTER INSERT OR UPDATE ON public.subscriptions
    DEFERRABLE INITIALLY IMMEDIATE
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_check_subscription_gym_consistency();

-- ============================================================
-- ISSUE 3 — Owner Authority Standardization
-- Owner checks must rely ONLY on gyms.owner_id
-- Remove 'owner' from gym_staff.role IN (...) checks
-- Affected policies: plans_insert, plans_update,
--   equipment_insert, equipment_update
-- ============================================================

-- 3a. plans_insert — remove 'owner' from gym_staff role check
DROP POLICY IF EXISTS plans_insert ON public.plans;

CREATE POLICY plans_insert ON public.plans
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.gyms g
            WHERE g.id = plans.gym_id
              AND g.owner_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.gym_staff gs
            WHERE gs.gym_id = plans.gym_id
              AND gs.user_id = auth.uid()
              AND gs.role = 'manager'
              AND gs.is_active = TRUE
        )
    );

-- 3b. plans_update — remove 'owner' from gym_staff role check
DROP POLICY IF EXISTS plans_update ON public.plans;

CREATE POLICY plans_update ON public.plans
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.gyms g
            WHERE g.id = plans.gym_id
              AND g.owner_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.gym_staff gs
            WHERE gs.gym_id = plans.gym_id
              AND gs.user_id = auth.uid()
              AND gs.role = 'manager'
              AND gs.is_active = TRUE
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.gyms g
            WHERE g.id = plans.gym_id
              AND g.owner_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.gym_staff gs
            WHERE gs.gym_id = plans.gym_id
              AND gs.user_id = auth.uid()
              AND gs.role = 'manager'
              AND gs.is_active = TRUE
        )
    );

-- 3c. equipment_insert — remove 'owner' from gym_staff role check
DROP POLICY IF EXISTS equipment_insert ON public.equipment;

CREATE POLICY equipment_insert ON public.equipment
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.gyms g
            WHERE g.id = equipment.gym_id
              AND g.owner_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.gym_staff gs
            WHERE gs.gym_id = equipment.gym_id
              AND gs.user_id = auth.uid()
              AND gs.role = 'manager'
              AND gs.is_active = TRUE
        )
    );

-- 3d. equipment_update — remove 'owner' from gym_staff role check
DROP POLICY IF EXISTS equipment_update ON public.equipment;

CREATE POLICY equipment_update ON public.equipment
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.gyms g
            WHERE g.id = equipment.gym_id
              AND g.owner_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.gym_staff gs
            WHERE gs.gym_id = equipment.gym_id
              AND gs.user_id = auth.uid()
              AND gs.role = 'manager'
              AND gs.is_active = TRUE
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.gyms g
            WHERE g.id = equipment.gym_id
              AND g.owner_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.gym_staff gs
            WHERE gs.gym_id = equipment.gym_id
              AND gs.user_id = auth.uid()
              AND gs.role = 'manager'
              AND gs.is_active = TRUE
        )
    );

-- ============================================================
-- ISSUE 4 — Performance Indexes for High-Volume Tables
-- ============================================================

-- subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_gym_member
    ON public.subscriptions (gym_id, member_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_gym_end_date
    ON public.subscriptions (gym_id, end_date);

-- attendance
CREATE INDEX IF NOT EXISTS idx_attendance_gym_member
    ON public.attendance (gym_id, member_id);

CREATE INDEX IF NOT EXISTS idx_attendance_gym_checkin_desc
    ON public.attendance (gym_id, check_in_at DESC);

-- slot_bookings
CREATE INDEX IF NOT EXISTS idx_slot_bookings_gym_member_date
    ON public.slot_bookings (gym_id, member_id, slot_date);

COMMIT;
