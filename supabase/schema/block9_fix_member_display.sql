-- ============================================================
-- REPLO — Fix: Ensure FK from members → public.users for PostgREST joins
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- This migration ensures that the `members.user_id` FK points to
-- `public.users(id)` (not `auth.users`), which is required for
-- PostgREST to automatically resolve `users(*)` joins.
-- Without this, the `users(*)` join returns null → "Unknown" names.

-- Step 1: Re-apply FK fix (idempotent — safe to re-run)
ALTER TABLE public.members
DROP CONSTRAINT IF EXISTS members_user_id_fkey;

ALTER TABLE public.members
ADD CONSTRAINT members_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Step 2: Ensure gym_staff also references public.users (already in block8, re-applying for safety)
ALTER TABLE public.gym_staff
DROP CONSTRAINT IF EXISTS gym_staff_user_id_fkey;

ALTER TABLE public.gym_staff
ADD CONSTRAINT gym_staff_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Step 3: Add RLS policy so gym owners can read member user profiles
-- (The existing users_select_staff policy only covers gym_staff members.
--  This adds explicit coverage for owners via gyms.owner_id, as a safety net.)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'users'
          AND policyname = 'users_select_owner'
    ) THEN
        EXECUTE '
            CREATE POLICY users_select_owner ON public.users
                FOR SELECT USING (
                    EXISTS (
                        SELECT 1 FROM public.gyms g
                        JOIN public.members m ON m.gym_id = g.id
                        WHERE g.owner_id = auth.uid()
                          AND m.user_id = users.id
                    )
                )
        ';
    END IF;
END $$;

-- ============================================================
-- DONE! After running this:
-- 1. Refresh the Members list in the app
-- 2. Member names should now show correctly
-- 3. Member detail should show phone, name, and membership info
-- ============================================================
