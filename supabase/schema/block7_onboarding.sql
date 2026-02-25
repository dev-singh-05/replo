-- ==============================================================================
-- Block 7: Onboarding & Role Selection Flow
-- Adds tracking fields to `public.users` to support the initial app flow.
-- ==============================================================================

ALTER TABLE public.users
ADD COLUMN role TEXT CHECK (role IN ('owner', 'staff', 'member')),
ADD COLUMN gym_id UUID REFERENCES public.gyms(id),
ADD COLUMN profile_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN first_login_completed BOOLEAN DEFAULT FALSE;

-- End of schema
