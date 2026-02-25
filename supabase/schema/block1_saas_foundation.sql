-- ============================================================
-- REPLO — Block 1: SaaS Foundation Schema
-- Production-Ready Multi-Tenant Gym Management System
-- Target: Supabase (Postgres + Auth + RLS)
-- ============================================================

-- ============================================================
-- 1. EXTENSIONS
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 2. TABLES
-- ============================================================

-- ----------------------------
-- 2.1 gyms
-- ----------------------------
CREATE TABLE public.gyms (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        TEXT NOT NULL,
    slug        TEXT NOT NULL UNIQUE,
    address     TEXT,
    city        TEXT,
    state       TEXT,
    country     TEXT DEFAULT 'IN',
    phone       TEXT,
    email       TEXT,
    logo_url    TEXT,
    timezone    TEXT DEFAULT 'Asia/Kolkata',
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    owner_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------
-- 2.2 users (profile extension of auth.users)
-- ----------------------------
CREATE TABLE public.users (
    id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name       TEXT NOT NULL,
    avatar_url      TEXT,
    phone           TEXT,
    date_of_birth   DATE,
    gender          TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------
-- 2.3 gym_staff
-- ----------------------------
CREATE TABLE public.gym_staff (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gym_id      UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role        TEXT NOT NULL CHECK (role IN ('owner', 'manager', 'trainer', 'receptionist')),
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (gym_id, user_id)
);

-- ----------------------------
-- 2.4 members
-- ----------------------------
CREATE TABLE public.members (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gym_id              UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
    user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    membership_number   TEXT,
    emergency_contact   TEXT,
    health_notes        TEXT,
    status              TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'expired')),
    joined_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (gym_id, user_id),
    UNIQUE (gym_id, membership_number)
);

-- ----------------------------
-- 2.5 plans
-- ----------------------------
CREATE TABLE public.plans (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gym_id          UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    description     TEXT,
    duration_days   INT NOT NULL CHECK (duration_days > 0),
    price           NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    currency        TEXT NOT NULL DEFAULT 'INR',
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (gym_id, name)
);

-- ----------------------------
-- 2.6 subscriptions
-- ----------------------------
CREATE TABLE public.subscriptions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gym_id          UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
    member_id       UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    plan_id         UUID NOT NULL REFERENCES public.plans(id) ON DELETE RESTRICT,
    start_date      DATE NOT NULL,
    end_date        DATE NOT NULL,
    amount_paid     NUMERIC(10, 2) NOT NULL CHECK (amount_paid >= 0),
    payment_method  TEXT CHECK (payment_method IN ('cash', 'upi', 'card', 'bank_transfer', 'other')),
    status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled', 'paused')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (end_date > start_date)
);

-- ----------------------------
-- 2.7 attendance
-- ----------------------------
CREATE TABLE public.attendance (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gym_id          UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
    member_id       UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    check_in_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    check_out_at    TIMESTAMPTZ,
    method          TEXT NOT NULL DEFAULT 'manual' CHECK (method IN ('manual', 'qr', 'biometric', 'app')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------
-- 2.8 equipment
-- ----------------------------
CREATE TABLE public.equipment (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gym_id              UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
    name                TEXT NOT NULL,
    category            TEXT NOT NULL CHECK (category IN ('cardio', 'strength', 'flexibility', 'functional', 'free_weights', 'machines', 'accessories', 'other')),
    brand               TEXT,
    model               TEXT,
    serial_number       TEXT,
    purchase_date       DATE,
    warranty_expiry     DATE,
    status              TEXT NOT NULL DEFAULT 'operational' CHECK (status IN ('operational', 'maintenance', 'out_of_order', 'retired')),
    location_in_gym     TEXT,
    quantity            INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (gym_id, serial_number)
);

-- ----------------------------
-- 2.9 equipment_reports
-- ----------------------------
CREATE TABLE public.equipment_reports (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gym_id          UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
    equipment_id    UUID NOT NULL REFERENCES public.equipment(id) ON DELETE CASCADE,
    reported_by     UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
    title           TEXT NOT NULL,
    description     TEXT,
    severity        TEXT NOT NULL DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    status          TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    resolved_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------
-- 2.10 traffic_logs
-- ----------------------------
CREATE TABLE public.traffic_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gym_id          UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
    recorded_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    headcount       INT NOT NULL CHECK (headcount >= 0),
    source          TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'sensor', 'camera', 'app')),
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------
-- 2.11 feedback
-- ----------------------------
CREATE TABLE public.feedback (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gym_id          UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
    member_id       UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    category        TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('general', 'facility', 'trainer', 'equipment', 'cleanliness', 'other')),
    rating          INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment         TEXT,
    is_anonymous    BOOLEAN NOT NULL DEFAULT FALSE,
    status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------
-- 2.12 slot_bookings
-- ----------------------------
CREATE TABLE public.slot_bookings (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gym_id          UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
    member_id       UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    slot_date       DATE NOT NULL,
    start_time      TIME NOT NULL,
    end_time        TIME NOT NULL,
    activity        TEXT,
    status          TEXT NOT NULL DEFAULT 'booked' CHECK (status IN ('booked', 'checked_in', 'cancelled', 'no_show')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (end_time > start_time)
);

-- ----------------------------
-- 2.13 workout_templates
-- ----------------------------
CREATE TABLE public.workout_templates (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gym_id          UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
    created_by      UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
    name            TEXT NOT NULL,
    description     TEXT,
    difficulty      TEXT NOT NULL DEFAULT 'intermediate' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced', 'expert')),
    duration_mins   INT CHECK (duration_mins > 0),
    target_muscles  TEXT[],
    exercises       JSONB NOT NULL DEFAULT '[]'::JSONB,
    is_public       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (gym_id, name)
);

-- ----------------------------
-- 2.14 diet_templates
-- ----------------------------
CREATE TABLE public.diet_templates (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gym_id          UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
    created_by      UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
    name            TEXT NOT NULL,
    description     TEXT,
    goal            TEXT NOT NULL DEFAULT 'maintenance' CHECK (goal IN ('weight_loss', 'muscle_gain', 'maintenance', 'endurance', 'general_health')),
    calories        INT CHECK (calories > 0),
    meals           JSONB NOT NULL DEFAULT '[]'::JSONB,
    is_public       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (gym_id, name)
);

-- ============================================================
-- 3. INDEXES
-- ============================================================

-- gyms
CREATE INDEX idx_gyms_owner_id ON public.gyms(owner_id);
CREATE INDEX idx_gyms_slug ON public.gyms(slug);
CREATE INDEX idx_gyms_is_active ON public.gyms(is_active);

-- users (PK is id, references auth.users — no extra gym_id index needed)

-- gym_staff
CREATE INDEX idx_gym_staff_gym_id ON public.gym_staff(gym_id);
CREATE INDEX idx_gym_staff_user_id ON public.gym_staff(user_id);
CREATE INDEX idx_gym_staff_gym_role ON public.gym_staff(gym_id, role);

-- members
CREATE INDEX idx_members_gym_id ON public.members(gym_id);
CREATE INDEX idx_members_user_id ON public.members(user_id);
CREATE INDEX idx_members_gym_status ON public.members(gym_id, status);

-- plans
CREATE INDEX idx_plans_gym_id ON public.plans(gym_id);
CREATE INDEX idx_plans_gym_active ON public.plans(gym_id, is_active);

-- subscriptions
CREATE INDEX idx_subscriptions_gym_id ON public.subscriptions(gym_id);
CREATE INDEX idx_subscriptions_member_id ON public.subscriptions(member_id);
CREATE INDEX idx_subscriptions_plan_id ON public.subscriptions(plan_id);
CREATE INDEX idx_subscriptions_gym_status ON public.subscriptions(gym_id, status);
CREATE INDEX idx_subscriptions_end_date ON public.subscriptions(end_date);

-- attendance
CREATE INDEX idx_attendance_gym_id ON public.attendance(gym_id);
CREATE INDEX idx_attendance_member_id ON public.attendance(member_id);
CREATE INDEX idx_attendance_gym_checkin ON public.attendance(gym_id, check_in_at DESC);

-- equipment
CREATE INDEX idx_equipment_gym_id ON public.equipment(gym_id);
CREATE INDEX idx_equipment_gym_status ON public.equipment(gym_id, status);
CREATE INDEX idx_equipment_gym_category ON public.equipment(gym_id, category);

-- equipment_reports
CREATE INDEX idx_equipment_reports_gym_id ON public.equipment_reports(gym_id);
CREATE INDEX idx_equipment_reports_equipment_id ON public.equipment_reports(equipment_id);
CREATE INDEX idx_equipment_reports_gym_status ON public.equipment_reports(gym_id, status);

-- traffic_logs
CREATE INDEX idx_traffic_logs_gym_id ON public.traffic_logs(gym_id);
CREATE INDEX idx_traffic_logs_gym_recorded ON public.traffic_logs(gym_id, recorded_at DESC);

-- feedback
CREATE INDEX idx_feedback_gym_id ON public.feedback(gym_id);
CREATE INDEX idx_feedback_member_id ON public.feedback(member_id);
CREATE INDEX idx_feedback_gym_category ON public.feedback(gym_id, category);

-- slot_bookings
CREATE INDEX idx_slot_bookings_gym_id ON public.slot_bookings(gym_id);
CREATE INDEX idx_slot_bookings_member_id ON public.slot_bookings(member_id);
CREATE INDEX idx_slot_bookings_gym_date ON public.slot_bookings(gym_id, slot_date);
CREATE INDEX idx_slot_bookings_gym_date_time ON public.slot_bookings(gym_id, slot_date, start_time);

-- workout_templates
CREATE INDEX idx_workout_templates_gym_id ON public.workout_templates(gym_id);
CREATE INDEX idx_workout_templates_created_by ON public.workout_templates(created_by);
CREATE INDEX idx_workout_templates_gym_difficulty ON public.workout_templates(gym_id, difficulty);

-- diet_templates
CREATE INDEX idx_diet_templates_gym_id ON public.diet_templates(gym_id);
CREATE INDEX idx_diet_templates_created_by ON public.diet_templates(created_by);
CREATE INDEX idx_diet_templates_gym_goal ON public.diet_templates(gym_id, goal);

-- ============================================================
-- 4. TRIGGER FUNCTION — auto-update updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- ============================================================
-- 5. TRIGGER ASSIGNMENTS
-- ============================================================

CREATE TRIGGER trg_gyms_updated_at
    BEFORE UPDATE ON public.gyms
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_gym_staff_updated_at
    BEFORE UPDATE ON public.gym_staff
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_members_updated_at
    BEFORE UPDATE ON public.members
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_plans_updated_at
    BEFORE UPDATE ON public.plans
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_subscriptions_updated_at
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_attendance_updated_at
    BEFORE UPDATE ON public.attendance
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_equipment_updated_at
    BEFORE UPDATE ON public.equipment
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_equipment_reports_updated_at
    BEFORE UPDATE ON public.equipment_reports
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_traffic_logs_updated_at
    BEFORE UPDATE ON public.traffic_logs
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_feedback_updated_at
    BEFORE UPDATE ON public.feedback
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_slot_bookings_updated_at
    BEFORE UPDATE ON public.slot_bookings
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_workout_templates_updated_at
    BEFORE UPDATE ON public.workout_templates
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_diet_templates_updated_at
    BEFORE UPDATE ON public.diet_templates
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- 6. ENABLE RLS ON ALL TABLES
-- ============================================================

ALTER TABLE public.gyms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gym_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.traffic_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slot_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diet_templates ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 7. RLS POLICIES
-- ============================================================

-- ============================================================
-- HELPER: Check if user is staff (owner/manager/trainer/receptionist) at a gym
-- We use EXISTS subqueries to avoid recursive policy issues.
-- ============================================================

-- ----------------------------
-- 7.1 gyms
-- ----------------------------

-- Owners can see their own gyms
CREATE POLICY gyms_select_owner ON public.gyms
    FOR SELECT USING (owner_id = auth.uid());

-- Staff can see gyms they belong to
CREATE POLICY gyms_select_staff ON public.gyms
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.gym_staff gs
            WHERE gs.gym_id = gyms.id
              AND gs.user_id = auth.uid()
              AND gs.is_active = TRUE
        )
    );

-- Members can see gyms they belong to
CREATE POLICY gyms_select_member ON public.gyms
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.members m
            WHERE m.gym_id = gyms.id
              AND m.user_id = auth.uid()
        )
    );

-- Only authenticated users can create a gym (they become the owner)
CREATE POLICY gyms_insert ON public.gyms
    FOR INSERT WITH CHECK (owner_id = auth.uid());

-- Only the owner can update their gym
CREATE POLICY gyms_update ON public.gyms
    FOR UPDATE USING (owner_id = auth.uid())
    WITH CHECK (owner_id = auth.uid());

-- Only the owner can delete their gym
CREATE POLICY gyms_delete ON public.gyms
    FOR DELETE USING (owner_id = auth.uid());

-- ----------------------------
-- 7.2 users
-- ----------------------------

-- Users can read their own profile
CREATE POLICY users_select_own ON public.users
    FOR SELECT USING (id = auth.uid());

-- Staff can read profiles of users in their gym (members + other staff)
CREATE POLICY users_select_staff ON public.users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.gym_staff gs
            WHERE gs.user_id = auth.uid()
              AND gs.is_active = TRUE
              AND (
                  EXISTS (
                      SELECT 1 FROM public.members m
                      WHERE m.gym_id = gs.gym_id
                        AND m.user_id = users.id
                  )
                  OR EXISTS (
                      SELECT 1 FROM public.gym_staff gs2
                      WHERE gs2.gym_id = gs.gym_id
                        AND gs2.user_id = users.id
                  )
              )
        )
    );

-- Users can insert their own profile
CREATE POLICY users_insert ON public.users
    FOR INSERT WITH CHECK (id = auth.uid());

-- Users can update their own profile
CREATE POLICY users_update ON public.users
    FOR UPDATE USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- Users cannot delete their profile (cascaded from auth.users deletion)
-- No delete policy needed — ON DELETE CASCADE handles it

-- ----------------------------
-- 7.3 gym_staff
-- ----------------------------

-- Staff can see other staff in their gym
CREATE POLICY gym_staff_select ON public.gym_staff
    FOR SELECT USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.gym_staff gs
            WHERE gs.gym_id = gym_staff.gym_id
              AND gs.user_id = auth.uid()
              AND gs.is_active = TRUE
        )
    );

-- Only gym owner can add staff
CREATE POLICY gym_staff_insert ON public.gym_staff
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.gyms g
            WHERE g.id = gym_staff.gym_id
              AND g.owner_id = auth.uid()
        )
    );

-- Only gym owner can update staff records
CREATE POLICY gym_staff_update ON public.gym_staff
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.gyms g
            WHERE g.id = gym_staff.gym_id
              AND g.owner_id = auth.uid()
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.gyms g
            WHERE g.id = gym_staff.gym_id
              AND g.owner_id = auth.uid()
        )
    );

-- Only gym owner can remove staff
CREATE POLICY gym_staff_delete ON public.gym_staff
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.gyms g
            WHERE g.id = gym_staff.gym_id
              AND g.owner_id = auth.uid()
        )
    );

-- ----------------------------
-- 7.4 members
-- ----------------------------

-- Staff/owner can see all members in their gym
CREATE POLICY members_select_staff ON public.members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.gym_staff gs
            WHERE gs.gym_id = members.gym_id
              AND gs.user_id = auth.uid()
              AND gs.is_active = TRUE
        )
        OR EXISTS (
            SELECT 1 FROM public.gyms g
            WHERE g.id = members.gym_id
              AND g.owner_id = auth.uid()
        )
    );

-- Members can see only their own record
CREATE POLICY members_select_own ON public.members
    FOR SELECT USING (user_id = auth.uid());

-- Staff/owner can add members
CREATE POLICY members_insert ON public.members
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.gym_staff gs
            WHERE gs.gym_id = members.gym_id
              AND gs.user_id = auth.uid()
              AND gs.is_active = TRUE
        )
        OR EXISTS (
            SELECT 1 FROM public.gyms g
            WHERE g.id = members.gym_id
              AND g.owner_id = auth.uid()
        )
    );

-- Staff/owner can update members
CREATE POLICY members_update ON public.members
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.gym_staff gs
            WHERE gs.gym_id = members.gym_id
              AND gs.user_id = auth.uid()
              AND gs.is_active = TRUE
        )
        OR EXISTS (
            SELECT 1 FROM public.gyms g
            WHERE g.id = members.gym_id
              AND g.owner_id = auth.uid()
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.gym_staff gs
            WHERE gs.gym_id = members.gym_id
              AND gs.user_id = auth.uid()
              AND gs.is_active = TRUE
        )
        OR EXISTS (
            SELECT 1 FROM public.gyms g
            WHERE g.id = members.gym_id
              AND g.owner_id = auth.uid()
        )
    );

-- Staff/owner can delete members
CREATE POLICY members_delete ON public.members
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.gym_staff gs
            WHERE gs.gym_id = members.gym_id
              AND gs.user_id = auth.uid()
              AND gs.is_active = TRUE
        )
        OR EXISTS (
            SELECT 1 FROM public.gyms g
            WHERE g.id = members.gym_id
              AND g.owner_id = auth.uid()
        )
    );

-- ----------------------------
-- 7.5 plans
-- ----------------------------

-- Staff/owner can see plans in their gym
CREATE POLICY plans_select_staff ON public.plans
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.gym_staff gs
            WHERE gs.gym_id = plans.gym_id
              AND gs.user_id = auth.uid()
              AND gs.is_active = TRUE
        )
        OR EXISTS (
            SELECT 1 FROM public.gyms g
            WHERE g.id = plans.gym_id
              AND g.owner_id = auth.uid()
        )
    );

-- Members can see active plans in their gym
CREATE POLICY plans_select_member ON public.plans
    FOR SELECT USING (
        plans.is_active = TRUE
        AND EXISTS (
            SELECT 1 FROM public.members m
            WHERE m.gym_id = plans.gym_id
              AND m.user_id = auth.uid()
        )
    );

-- Owner can create plans
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
              AND gs.role IN ('owner', 'manager')
              AND gs.is_active = TRUE
        )
    );

-- Owner/manager can update plans
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
              AND gs.role IN ('owner', 'manager')
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
              AND gs.role IN ('owner', 'manager')
              AND gs.is_active = TRUE
        )
    );

-- Owner can delete plans
CREATE POLICY plans_delete ON public.plans
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.gyms g
            WHERE g.id = plans.gym_id
              AND g.owner_id = auth.uid()
        )
    );

-- ----------------------------
-- 7.6 subscriptions
-- ----------------------------

-- Staff/owner can see all subscriptions in their gym
CREATE POLICY subscriptions_select_staff ON public.subscriptions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.gym_staff gs
            WHERE gs.gym_id = subscriptions.gym_id
              AND gs.user_id = auth.uid()
              AND gs.is_active = TRUE
        )
        OR EXISTS (
            SELECT 1 FROM public.gyms g
            WHERE g.id = subscriptions.gym_id
              AND g.owner_id = auth.uid()
        )
    );

-- Members can see only their own subscriptions
CREATE POLICY subscriptions_select_member ON public.subscriptions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.members m
            WHERE m.id = subscriptions.member_id
              AND m.user_id = auth.uid()
        )
    );

-- Staff/owner can create subscriptions
CREATE POLICY subscriptions_insert ON public.subscriptions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.gym_staff gs
            WHERE gs.gym_id = subscriptions.gym_id
              AND gs.user_id = auth.uid()
              AND gs.is_active = TRUE
        )
        OR EXISTS (
            SELECT 1 FROM public.gyms g
            WHERE g.id = subscriptions.gym_id
              AND g.owner_id = auth.uid()
        )
    );

-- Staff/owner can update subscriptions
CREATE POLICY subscriptions_update ON public.subscriptions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.gym_staff gs
            WHERE gs.gym_id = subscriptions.gym_id
              AND gs.user_id = auth.uid()
              AND gs.is_active = TRUE
        )
        OR EXISTS (
            SELECT 1 FROM public.gyms g
            WHERE g.id = subscriptions.gym_id
              AND g.owner_id = auth.uid()
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.gym_staff gs
            WHERE gs.gym_id = subscriptions.gym_id
              AND gs.user_id = auth.uid()
              AND gs.is_active = TRUE
        )
        OR EXISTS (
            SELECT 1 FROM public.gyms g
            WHERE g.id = subscriptions.gym_id
              AND g.owner_id = auth.uid()
        )
    );

-- Staff/owner can delete subscriptions
CREATE POLICY subscriptions_delete ON public.subscriptions
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.gyms g
            WHERE g.id = subscriptions.gym_id
              AND g.owner_id = auth.uid()
        )
    );

-- ----------------------------
-- 7.7 attendance
-- ----------------------------

-- Staff/owner can see all attendance in their gym
CREATE POLICY attendance_select_staff ON public.attendance
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.gym_staff gs
            WHERE gs.gym_id = attendance.gym_id
              AND gs.user_id = auth.uid()
              AND gs.is_active = TRUE
        )
        OR EXISTS (
            SELECT 1 FROM public.gyms g
            WHERE g.id = attendance.gym_id
              AND g.owner_id = auth.uid()
        )
    );

-- Members can see only their own attendance
CREATE POLICY attendance_select_member ON public.attendance
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.members m
            WHERE m.id = attendance.member_id
              AND m.user_id = auth.uid()
        )
    );

-- Staff/owner can insert attendance
CREATE POLICY attendance_insert ON public.attendance
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.gym_staff gs
            WHERE gs.gym_id = attendance.gym_id
              AND gs.user_id = auth.uid()
              AND gs.is_active = TRUE
        )
        OR EXISTS (
            SELECT 1 FROM public.gyms g
            WHERE g.id = attendance.gym_id
              AND g.owner_id = auth.uid()
        )
    );

-- Members can check themselves in (self-service via app)
CREATE POLICY attendance_insert_member ON public.attendance
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.members m
            WHERE m.id = attendance.member_id
              AND m.user_id = auth.uid()
              AND m.gym_id = attendance.gym_id
              AND m.status = 'active'
        )
    );

-- Staff/owner can update attendance
CREATE POLICY attendance_update ON public.attendance
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.gym_staff gs
            WHERE gs.gym_id = attendance.gym_id
              AND gs.user_id = auth.uid()
              AND gs.is_active = TRUE
        )
        OR EXISTS (
            SELECT 1 FROM public.gyms g
            WHERE g.id = attendance.gym_id
              AND g.owner_id = auth.uid()
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.gym_staff gs
            WHERE gs.gym_id = attendance.gym_id
              AND gs.user_id = auth.uid()
              AND gs.is_active = TRUE
        )
        OR EXISTS (
            SELECT 1 FROM public.gyms g
            WHERE g.id = attendance.gym_id
              AND g.owner_id = auth.uid()
        )
    );

-- Staff/owner can delete attendance records
CREATE POLICY attendance_delete ON public.attendance
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.gyms g
            WHERE g.id = attendance.gym_id
              AND g.owner_id = auth.uid()
        )
    );

-- ----------------------------
-- 7.8 equipment
-- ----------------------------

-- Staff/owner can see all equipment in their gym
CREATE POLICY equipment_select_staff ON public.equipment
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.gym_staff gs
            WHERE gs.gym_id = equipment.gym_id
              AND gs.user_id = auth.uid()
              AND gs.is_active = TRUE
        )
        OR EXISTS (
            SELECT 1 FROM public.gyms g
            WHERE g.id = equipment.gym_id
              AND g.owner_id = auth.uid()
        )
    );

-- Members can read equipment list (read-only)
CREATE POLICY equipment_select_member ON public.equipment
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.members m
            WHERE m.gym_id = equipment.gym_id
              AND m.user_id = auth.uid()
        )
    );

-- Owner/manager can create equipment
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
              AND gs.role IN ('owner', 'manager')
              AND gs.is_active = TRUE
        )
    );

-- Owner/manager can update equipment
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
              AND gs.role IN ('owner', 'manager')
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
              AND gs.role IN ('owner', 'manager')
              AND gs.is_active = TRUE
        )
    );

-- Owner can delete equipment
CREATE POLICY equipment_delete ON public.equipment
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.gyms g
            WHERE g.id = equipment.gym_id
              AND g.owner_id = auth.uid()
        )
    );

-- ----------------------------
-- 7.9 equipment_reports
-- ----------------------------

-- Staff/owner can see all reports in their gym
CREATE POLICY equipment_reports_select_staff ON public.equipment_reports
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.gym_staff gs
            WHERE gs.gym_id = equipment_reports.gym_id
              AND gs.user_id = auth.uid()
              AND gs.is_active = TRUE
        )
        OR EXISTS (
            SELECT 1 FROM public.gyms g
            WHERE g.id = equipment_reports.gym_id
              AND g.owner_id = auth.uid()
        )
    );

-- Members can see their own reports
CREATE POLICY equipment_reports_select_own ON public.equipment_reports
    FOR SELECT USING (reported_by = auth.uid());

-- Any gym user (staff or member) can create a report
CREATE POLICY equipment_reports_insert ON public.equipment_reports
    FOR INSERT WITH CHECK (
        reported_by = auth.uid()
        AND (
            EXISTS (
                SELECT 1 FROM public.gym_staff gs
                WHERE gs.gym_id = equipment_reports.gym_id
                  AND gs.user_id = auth.uid()
                  AND gs.is_active = TRUE
            )
            OR EXISTS (
                SELECT 1 FROM public.members m
                WHERE m.gym_id = equipment_reports.gym_id
                  AND m.user_id = auth.uid()
            )
            OR EXISTS (
                SELECT 1 FROM public.gyms g
                WHERE g.id = equipment_reports.gym_id
                  AND g.owner_id = auth.uid()
            )
        )
    );

-- Staff/owner can update reports (status changes, resolution)
CREATE POLICY equipment_reports_update ON public.equipment_reports
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.gym_staff gs
            WHERE gs.gym_id = equipment_reports.gym_id
              AND gs.user_id = auth.uid()
              AND gs.is_active = TRUE
        )
        OR EXISTS (
            SELECT 1 FROM public.gyms g
            WHERE g.id = equipment_reports.gym_id
              AND g.owner_id = auth.uid()
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.gym_staff gs
            WHERE gs.gym_id = equipment_reports.gym_id
              AND gs.user_id = auth.uid()
              AND gs.is_active = TRUE
        )
        OR EXISTS (
            SELECT 1 FROM public.gyms g
            WHERE g.id = equipment_reports.gym_id
              AND g.owner_id = auth.uid()
        )
    );

-- Owner can delete reports
CREATE POLICY equipment_reports_delete ON public.equipment_reports
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.gyms g
            WHERE g.id = equipment_reports.gym_id
              AND g.owner_id = auth.uid()
        )
    );

-- ----------------------------
-- 7.10 traffic_logs
-- ----------------------------

-- Staff/owner can see traffic logs
CREATE POLICY traffic_logs_select ON public.traffic_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.gym_staff gs
            WHERE gs.gym_id = traffic_logs.gym_id
              AND gs.user_id = auth.uid()
              AND gs.is_active = TRUE
        )
        OR EXISTS (
            SELECT 1 FROM public.gyms g
            WHERE g.id = traffic_logs.gym_id
              AND g.owner_id = auth.uid()
        )
    );

-- Staff/owner can insert traffic logs
CREATE POLICY traffic_logs_insert ON public.traffic_logs
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.gym_staff gs
            WHERE gs.gym_id = traffic_logs.gym_id
              AND gs.user_id = auth.uid()
              AND gs.is_active = TRUE
        )
        OR EXISTS (
            SELECT 1 FROM public.gyms g
            WHERE g.id = traffic_logs.gym_id
              AND g.owner_id = auth.uid()
        )
    );

-- Staff/owner can update traffic logs
CREATE POLICY traffic_logs_update ON public.traffic_logs
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.gym_staff gs
            WHERE gs.gym_id = traffic_logs.gym_id
              AND gs.user_id = auth.uid()
              AND gs.is_active = TRUE
        )
        OR EXISTS (
            SELECT 1 FROM public.gyms g
            WHERE g.id = traffic_logs.gym_id
              AND g.owner_id = auth.uid()
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.gym_staff gs
            WHERE gs.gym_id = traffic_logs.gym_id
              AND gs.user_id = auth.uid()
              AND gs.is_active = TRUE
        )
        OR EXISTS (
            SELECT 1 FROM public.gyms g
            WHERE g.id = traffic_logs.gym_id
              AND g.owner_id = auth.uid()
        )
    );

-- Owner can delete traffic logs
CREATE POLICY traffic_logs_delete ON public.traffic_logs
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.gyms g
            WHERE g.id = traffic_logs.gym_id
              AND g.owner_id = auth.uid()
        )
    );

-- ----------------------------
-- 7.11 feedback
-- ----------------------------

-- Staff/owner can see all feedback in their gym
CREATE POLICY feedback_select_staff ON public.feedback
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.gym_staff gs
            WHERE gs.gym_id = feedback.gym_id
              AND gs.user_id = auth.uid()
              AND gs.is_active = TRUE
        )
        OR EXISTS (
            SELECT 1 FROM public.gyms g
            WHERE g.id = feedback.gym_id
              AND g.owner_id = auth.uid()
        )
    );

-- Members can see their own feedback
CREATE POLICY feedback_select_own ON public.feedback
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.members m
            WHERE m.id = feedback.member_id
              AND m.user_id = auth.uid()
        )
    );

-- Members can create feedback for their gym
CREATE POLICY feedback_insert ON public.feedback
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.members m
            WHERE m.id = feedback.member_id
              AND m.user_id = auth.uid()
              AND m.gym_id = feedback.gym_id
        )
    );

-- Staff/owner can update feedback (status changes)
CREATE POLICY feedback_update ON public.feedback
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.gym_staff gs
            WHERE gs.gym_id = feedback.gym_id
              AND gs.user_id = auth.uid()
              AND gs.is_active = TRUE
        )
        OR EXISTS (
            SELECT 1 FROM public.gyms g
            WHERE g.id = feedback.gym_id
              AND g.owner_id = auth.uid()
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.gym_staff gs
            WHERE gs.gym_id = feedback.gym_id
              AND gs.user_id = auth.uid()
              AND gs.is_active = TRUE
        )
        OR EXISTS (
            SELECT 1 FROM public.gyms g
            WHERE g.id = feedback.gym_id
              AND g.owner_id = auth.uid()
        )
    );

-- Owner can delete feedback
CREATE POLICY feedback_delete ON public.feedback
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.gyms g
            WHERE g.id = feedback.gym_id
              AND g.owner_id = auth.uid()
        )
    );

-- ----------------------------
-- 7.12 slot_bookings
-- ----------------------------

-- Staff/owner can see all bookings in their gym
CREATE POLICY slot_bookings_select_staff ON public.slot_bookings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.gym_staff gs
            WHERE gs.gym_id = slot_bookings.gym_id
              AND gs.user_id = auth.uid()
              AND gs.is_active = TRUE
        )
        OR EXISTS (
            SELECT 1 FROM public.gyms g
            WHERE g.id = slot_bookings.gym_id
              AND g.owner_id = auth.uid()
        )
    );

-- Members can see only their own bookings
CREATE POLICY slot_bookings_select_member ON public.slot_bookings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.members m
            WHERE m.id = slot_bookings.member_id
              AND m.user_id = auth.uid()
        )
    );

-- Members can create bookings for themselves
CREATE POLICY slot_bookings_insert_member ON public.slot_bookings
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.members m
            WHERE m.id = slot_bookings.member_id
              AND m.user_id = auth.uid()
              AND m.gym_id = slot_bookings.gym_id
              AND m.status = 'active'
        )
    );

-- Staff/owner can create bookings for any member
CREATE POLICY slot_bookings_insert_staff ON public.slot_bookings
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.gym_staff gs
            WHERE gs.gym_id = slot_bookings.gym_id
              AND gs.user_id = auth.uid()
              AND gs.is_active = TRUE
        )
        OR EXISTS (
            SELECT 1 FROM public.gyms g
            WHERE g.id = slot_bookings.gym_id
              AND g.owner_id = auth.uid()
        )
    );

-- Staff/owner can update bookings
CREATE POLICY slot_bookings_update_staff ON public.slot_bookings
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.gym_staff gs
            WHERE gs.gym_id = slot_bookings.gym_id
              AND gs.user_id = auth.uid()
              AND gs.is_active = TRUE
        )
        OR EXISTS (
            SELECT 1 FROM public.gyms g
            WHERE g.id = slot_bookings.gym_id
              AND g.owner_id = auth.uid()
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.gym_staff gs
            WHERE gs.gym_id = slot_bookings.gym_id
              AND gs.user_id = auth.uid()
              AND gs.is_active = TRUE
        )
        OR EXISTS (
            SELECT 1 FROM public.gyms g
            WHERE g.id = slot_bookings.gym_id
              AND g.owner_id = auth.uid()
        )
    );

-- Members can cancel their own bookings (update status)
CREATE POLICY slot_bookings_update_member ON public.slot_bookings
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.members m
            WHERE m.id = slot_bookings.member_id
              AND m.user_id = auth.uid()
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.members m
            WHERE m.id = slot_bookings.member_id
              AND m.user_id = auth.uid()
        )
    );

-- Owner can delete bookings
CREATE POLICY slot_bookings_delete ON public.slot_bookings
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.gyms g
            WHERE g.id = slot_bookings.gym_id
              AND g.owner_id = auth.uid()
        )
    );

-- ----------------------------
-- 7.13 workout_templates
-- ----------------------------

-- Staff/owner can see all workout templates in their gym
CREATE POLICY workout_templates_select_staff ON public.workout_templates
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.gym_staff gs
            WHERE gs.gym_id = workout_templates.gym_id
              AND gs.user_id = auth.uid()
              AND gs.is_active = TRUE
        )
        OR EXISTS (
            SELECT 1 FROM public.gyms g
            WHERE g.id = workout_templates.gym_id
              AND g.owner_id = auth.uid()
        )
    );

-- Members can see public workout templates in their gym
CREATE POLICY workout_templates_select_member ON public.workout_templates
    FOR SELECT USING (
        workout_templates.is_public = TRUE
        AND EXISTS (
            SELECT 1 FROM public.members m
            WHERE m.gym_id = workout_templates.gym_id
              AND m.user_id = auth.uid()
        )
    );

-- Staff/owner can create workout templates
CREATE POLICY workout_templates_insert ON public.workout_templates
    FOR INSERT WITH CHECK (
        created_by = auth.uid()
        AND (
            EXISTS (
                SELECT 1 FROM public.gym_staff gs
                WHERE gs.gym_id = workout_templates.gym_id
                  AND gs.user_id = auth.uid()
                  AND gs.is_active = TRUE
            )
            OR EXISTS (
                SELECT 1 FROM public.gyms g
                WHERE g.id = workout_templates.gym_id
                  AND g.owner_id = auth.uid()
            )
        )
    );

-- Creator or owner can update workout templates
CREATE POLICY workout_templates_update ON public.workout_templates
    FOR UPDATE USING (
        created_by = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.gyms g
            WHERE g.id = workout_templates.gym_id
              AND g.owner_id = auth.uid()
        )
    ) WITH CHECK (
        created_by = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.gyms g
            WHERE g.id = workout_templates.gym_id
              AND g.owner_id = auth.uid()
        )
    );

-- Owner can delete workout templates
CREATE POLICY workout_templates_delete ON public.workout_templates
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.gyms g
            WHERE g.id = workout_templates.gym_id
              AND g.owner_id = auth.uid()
        )
    );

-- ----------------------------
-- 7.14 diet_templates
-- ----------------------------

-- Staff/owner can see all diet templates in their gym
CREATE POLICY diet_templates_select_staff ON public.diet_templates
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.gym_staff gs
            WHERE gs.gym_id = diet_templates.gym_id
              AND gs.user_id = auth.uid()
              AND gs.is_active = TRUE
        )
        OR EXISTS (
            SELECT 1 FROM public.gyms g
            WHERE g.id = diet_templates.gym_id
              AND g.owner_id = auth.uid()
        )
    );

-- Members can see public diet templates in their gym
CREATE POLICY diet_templates_select_member ON public.diet_templates
    FOR SELECT USING (
        diet_templates.is_public = TRUE
        AND EXISTS (
            SELECT 1 FROM public.members m
            WHERE m.gym_id = diet_templates.gym_id
              AND m.user_id = auth.uid()
        )
    );

-- Staff/owner can create diet templates
CREATE POLICY diet_templates_insert ON public.diet_templates
    FOR INSERT WITH CHECK (
        created_by = auth.uid()
        AND (
            EXISTS (
                SELECT 1 FROM public.gym_staff gs
                WHERE gs.gym_id = diet_templates.gym_id
                  AND gs.user_id = auth.uid()
                  AND gs.is_active = TRUE
            )
            OR EXISTS (
                SELECT 1 FROM public.gyms g
                WHERE g.id = diet_templates.gym_id
                  AND g.owner_id = auth.uid()
            )
        )
    );

-- Creator or owner can update diet templates
CREATE POLICY diet_templates_update ON public.diet_templates
    FOR UPDATE USING (
        created_by = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.gyms g
            WHERE g.id = diet_templates.gym_id
              AND g.owner_id = auth.uid()
        )
    ) WITH CHECK (
        created_by = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.gyms g
            WHERE g.id = diet_templates.gym_id
              AND g.owner_id = auth.uid()
        )
    );

-- Owner can delete diet templates
CREATE POLICY diet_templates_delete ON public.diet_templates
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.gyms g
            WHERE g.id = diet_templates.gym_id
              AND g.owner_id = auth.uid()
        )
    );

-- ============================================================
-- END OF BLOCK 1 — SaaS Foundation Schema
-- ============================================================
