-- ============================================================
-- REPLO — Block 12: Allow members to self-request gym membership
-- Run in Supabase Dashboard → SQL Editor
-- ============================================================

-- Members can insert requests for themselves (self-request to join a gym)
CREATE POLICY gym_requests_insert_self ON public.gym_membership_requests
    FOR INSERT WITH CHECK (
        user_id = auth.uid()
        AND requested_by = auth.uid()
    );

-- ============================================================
-- DONE! Members can now send their own gym join requests.
-- ============================================================
