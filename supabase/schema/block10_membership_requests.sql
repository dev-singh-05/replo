-- ============================================================
-- REPLO — Block 10: Gym Membership Requests
-- Enables cross-gym membership with approval system
-- Run in Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Create the requests table
CREATE TABLE IF NOT EXISTS public.gym_membership_requests (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gym_id        UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
    user_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    requested_by  UUID NOT NULL REFERENCES public.users(id),
    status        TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Prevent duplicate pending requests for same gym+user
CREATE UNIQUE INDEX IF NOT EXISTS unique_pending_gym_request
    ON public.gym_membership_requests (gym_id, user_id)
    WHERE status = 'pending';

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_gym_requests_gym_id ON public.gym_membership_requests(gym_id);
CREATE INDEX IF NOT EXISTS idx_gym_requests_user_id ON public.gym_membership_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_gym_requests_status ON public.gym_membership_requests(status);

-- 4. Enable RLS
ALTER TABLE public.gym_membership_requests ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies

-- Staff/Owner can view requests for their gym
CREATE POLICY gym_requests_select_staff ON public.gym_membership_requests
    FOR SELECT USING (
        is_gym_staff(gym_id, auth.uid())
        OR is_gym_owner(gym_id, auth.uid())
    );

-- Target user can view their own requests
CREATE POLICY gym_requests_select_own ON public.gym_membership_requests
    FOR SELECT USING (user_id = auth.uid());

-- Staff/Owner can create requests (invite members)
CREATE POLICY gym_requests_insert_staff ON public.gym_membership_requests
    FOR INSERT WITH CHECK (
        is_gym_staff(gym_id, auth.uid())
        OR is_gym_owner(gym_id, auth.uid())
    );

-- Target user can update their own requests (accept/reject)
CREATE POLICY gym_requests_update_own ON public.gym_membership_requests
    FOR UPDATE USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Staff/Owner can also update requests (cancel)
CREATE POLICY gym_requests_update_staff ON public.gym_membership_requests
    FOR UPDATE USING (
        is_gym_staff(gym_id, auth.uid())
        OR is_gym_owner(gym_id, auth.uid())
    );

-- 6. Trigger for updated_at
CREATE TRIGGER trg_gym_membership_requests_updated_at
    BEFORE UPDATE ON public.gym_membership_requests
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- DONE! The gym_membership_requests table is ready.
-- ============================================================
