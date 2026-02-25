-- ==============================================================================
-- Block 8: Fix Foreign Keys for PostgREST joins
-- Change members and gym_staff to reference public.users instead of auth.users
-- This allows PostgREST to properly join `users(*)` from members/gym_staff.
-- ==============================================================================

-- 1. Fix members table
ALTER TABLE public.members
DROP CONSTRAINT IF EXISTS members_user_id_fkey;

ALTER TABLE public.members
ADD CONSTRAINT members_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- 2. Fix gym_staff table
ALTER TABLE public.gym_staff
DROP CONSTRAINT IF EXISTS gym_staff_user_id_fkey;

ALTER TABLE public.gym_staff
ADD CONSTRAINT gym_staff_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- End of schema
