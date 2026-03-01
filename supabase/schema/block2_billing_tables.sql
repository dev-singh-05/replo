-- ============================================================
-- REPLO — Block 2: Billing & Health Profile Tables
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- ============================================================
-- 1. ENUMS (safe: IF NOT EXISTS)
-- ============================================================
DO $$ BEGIN
    CREATE TYPE plan_type AS ENUM ('monthly', 'quarterly', 'yearly', 'custom');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE membership_status AS ENUM ('active', 'paused', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE cycle_status AS ENUM ('paid', 'unpaid', 'overdue');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- 2. TABLES
-- ============================================================

-- 2.1 Membership Contracts
CREATE TABLE IF NOT EXISTS public.membership_contracts (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id       UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    start_date      DATE NOT NULL,
    end_date        DATE NOT NULL,
    plan_type       plan_type NOT NULL,
    status          membership_status DEFAULT 'active',
    pause_start_date DATE,
    pause_end_date   DATE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT valid_contract_dates CHECK (end_date > start_date)
);

-- 2.2 Billing Cycles
CREATE TABLE IF NOT EXISTS public.membership_billing_cycles (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id       UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    contract_id     UUID NOT NULL REFERENCES public.membership_contracts(id) ON DELETE CASCADE,
    cycle_start     DATE NOT NULL,
    cycle_end       DATE NOT NULL,
    due_date        DATE NOT NULL,
    last_payment_date DATE,
    status          cycle_status DEFAULT 'unpaid',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.3 Member Health Profiles
CREATE TABLE IF NOT EXISTS public.member_health_profiles (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id       UUID UNIQUE NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    height          NUMERIC(5,2),
    weight          NUMERIC(5,2),
    allergies       TEXT,
    medical_conditions TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    medical_declaration_accepted BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 3. INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_contracts_member_id ON public.membership_contracts(member_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON public.membership_contracts(status);
CREATE INDEX IF NOT EXISTS idx_billing_cycles_member_id ON public.membership_billing_cycles(member_id);
CREATE INDEX IF NOT EXISTS idx_billing_cycles_contract_id ON public.membership_billing_cycles(contract_id);
CREATE INDEX IF NOT EXISTS idx_billing_cycles_status ON public.membership_billing_cycles(status);
CREATE INDEX IF NOT EXISTS idx_health_profiles_member_id ON public.member_health_profiles(member_id);

-- Unique index to prevent duplicate billing cycles
CREATE UNIQUE INDEX IF NOT EXISTS unique_billing_cycle
    ON public.membership_billing_cycles(contract_id, cycle_start);

-- ============================================================
-- 4. ENABLE RLS
-- ============================================================

ALTER TABLE public.membership_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_billing_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_health_profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 5. RLS POLICIES
-- ============================================================

-- ── membership_contracts ─────────────────────────────────────

-- Staff/Owner can view contracts for members in their gym
CREATE POLICY contracts_select_staff ON public.membership_contracts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.members m
            JOIN public.gym_staff gs ON gs.gym_id = m.gym_id
            WHERE m.id = membership_contracts.member_id
              AND gs.user_id = auth.uid()
              AND gs.is_active = TRUE
        )
        OR EXISTS (
            SELECT 1 FROM public.members m
            JOIN public.gyms g ON g.id = m.gym_id
            WHERE m.id = membership_contracts.member_id
              AND g.owner_id = auth.uid()
        )
    );

-- Members can view their own contracts
CREATE POLICY contracts_select_own ON public.membership_contracts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.members m
            WHERE m.id = membership_contracts.member_id
              AND m.user_id = auth.uid()
        )
    );

-- Staff/Owner can insert contracts
CREATE POLICY contracts_insert_staff ON public.membership_contracts
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.members m
            JOIN public.gym_staff gs ON gs.gym_id = m.gym_id
            WHERE m.id = membership_contracts.member_id
              AND gs.user_id = auth.uid()
              AND gs.is_active = TRUE
        )
        OR EXISTS (
            SELECT 1 FROM public.members m
            JOIN public.gyms g ON g.id = m.gym_id
            WHERE m.id = membership_contracts.member_id
              AND g.owner_id = auth.uid()
        )
    );

-- Staff/Owner can update contracts
CREATE POLICY contracts_update_staff ON public.membership_contracts
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.members m
            JOIN public.gym_staff gs ON gs.gym_id = m.gym_id
            WHERE m.id = membership_contracts.member_id
              AND gs.user_id = auth.uid()
              AND gs.is_active = TRUE
        )
        OR EXISTS (
            SELECT 1 FROM public.members m
            JOIN public.gyms g ON g.id = m.gym_id
            WHERE m.id = membership_contracts.member_id
              AND g.owner_id = auth.uid()
        )
    );

-- ── membership_billing_cycles ────────────────────────────────

-- Staff/Owner can view billing cycles
CREATE POLICY billing_select_staff ON public.membership_billing_cycles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.members m
            JOIN public.gym_staff gs ON gs.gym_id = m.gym_id
            WHERE m.id = membership_billing_cycles.member_id
              AND gs.user_id = auth.uid()
              AND gs.is_active = TRUE
        )
        OR EXISTS (
            SELECT 1 FROM public.members m
            JOIN public.gyms g ON g.id = m.gym_id
            WHERE m.id = membership_billing_cycles.member_id
              AND g.owner_id = auth.uid()
        )
    );

-- Members can view their own billing cycles
CREATE POLICY billing_select_own ON public.membership_billing_cycles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.members m
            WHERE m.id = membership_billing_cycles.member_id
              AND m.user_id = auth.uid()
        )
    );

-- Staff/Owner can insert billing cycles
CREATE POLICY billing_insert_staff ON public.membership_billing_cycles
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.members m
            JOIN public.gym_staff gs ON gs.gym_id = m.gym_id
            WHERE m.id = membership_billing_cycles.member_id
              AND gs.user_id = auth.uid()
              AND gs.is_active = TRUE
        )
        OR EXISTS (
            SELECT 1 FROM public.members m
            JOIN public.gyms g ON g.id = m.gym_id
            WHERE m.id = membership_billing_cycles.member_id
              AND g.owner_id = auth.uid()
        )
    );

-- Staff/Owner can update billing cycles
CREATE POLICY billing_update_staff ON public.membership_billing_cycles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.members m
            JOIN public.gym_staff gs ON gs.gym_id = m.gym_id
            WHERE m.id = membership_billing_cycles.member_id
              AND gs.user_id = auth.uid()
              AND gs.is_active = TRUE
        )
        OR EXISTS (
            SELECT 1 FROM public.members m
            JOIN public.gyms g ON g.id = m.gym_id
            WHERE m.id = membership_billing_cycles.member_id
              AND g.owner_id = auth.uid()
        )
    );

-- ── member_health_profiles ───────────────────────────────────

-- Staff/Owner can view health profiles
CREATE POLICY health_select_staff ON public.member_health_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.members m
            JOIN public.gym_staff gs ON gs.gym_id = m.gym_id
            WHERE m.id = member_health_profiles.member_id
              AND gs.user_id = auth.uid()
              AND gs.is_active = TRUE
        )
        OR EXISTS (
            SELECT 1 FROM public.members m
            JOIN public.gyms g ON g.id = m.gym_id
            WHERE m.id = member_health_profiles.member_id
              AND g.owner_id = auth.uid()
        )
    );

-- Members can view their own health profile
CREATE POLICY health_select_own ON public.member_health_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.members m
            WHERE m.id = member_health_profiles.member_id
              AND m.user_id = auth.uid()
        )
    );

-- Staff/Owner can insert health profiles
CREATE POLICY health_insert_staff ON public.member_health_profiles
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.members m
            JOIN public.gym_staff gs ON gs.gym_id = m.gym_id
            WHERE m.id = member_health_profiles.member_id
              AND gs.user_id = auth.uid()
              AND gs.is_active = TRUE
        )
        OR EXISTS (
            SELECT 1 FROM public.members m
            JOIN public.gyms g ON g.id = m.gym_id
            WHERE m.id = member_health_profiles.member_id
              AND g.owner_id = auth.uid()
        )
    );

-- Staff/Owner can update health profiles
CREATE POLICY health_update_staff ON public.member_health_profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.members m
            JOIN public.gym_staff gs ON gs.gym_id = m.gym_id
            WHERE m.id = member_health_profiles.member_id
              AND gs.user_id = auth.uid()
              AND gs.is_active = TRUE
        )
        OR EXISTS (
            SELECT 1 FROM public.members m
            JOIN public.gyms g ON g.id = m.gym_id
            WHERE m.id = member_health_profiles.member_id
              AND g.owner_id = auth.uid()
        )
    );

-- Members can update their own health profile
CREATE POLICY health_update_own ON public.member_health_profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.members m
            WHERE m.id = member_health_profiles.member_id
              AND m.user_id = auth.uid()
        )
    );

-- ============================================================
-- 6. TRIGGERS (updated_at)
-- ============================================================

CREATE TRIGGER trg_membership_contracts_updated_at
    BEFORE UPDATE ON public.membership_contracts
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_membership_billing_cycles_updated_at
    BEFORE UPDATE ON public.membership_billing_cycles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_member_health_profiles_updated_at
    BEFORE UPDATE ON public.member_health_profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- DONE! You can now create members with contracts and billing.
-- ============================================================
