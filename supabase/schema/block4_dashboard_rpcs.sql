-- ============================================================
-- REPLO — Block 4: Dashboard RPC Functions
-- Server-side aggregation for owner dashboard metrics
-- Must be run in Supabase SQL Editor
-- ============================================================

-- ============================================================
-- 1. dashboard_overview_metrics
-- Returns: total members, active, expiring soon, today check-ins,
--          monthly revenue, equipment issues
-- ============================================================
CREATE OR REPLACE FUNCTION public.dashboard_overview_metrics(p_gym_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  -- Verify caller owns this gym
  IF NOT EXISTS (
    SELECT 1 FROM public.gyms WHERE id = p_gym_id AND owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT json_build_object(
    'total_members',
      (SELECT count(*) FROM public.members WHERE gym_id = p_gym_id),
    'active_members',
      (SELECT count(*) FROM public.members WHERE gym_id = p_gym_id AND status = 'active'),
    'expiring_soon',
      (SELECT count(*) FROM public.subscriptions
       WHERE gym_id = p_gym_id
         AND status = 'active'
         AND end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'),
    'today_checkins',
      (SELECT count(*) FROM public.attendance
       WHERE gym_id = p_gym_id
         AND check_in_at >= CURRENT_DATE
         AND check_in_at < CURRENT_DATE + INTERVAL '1 day'),
    'monthly_revenue',
      (SELECT coalesce(sum(amount_paid), 0) FROM public.subscriptions
       WHERE gym_id = p_gym_id
         AND created_at >= date_trunc('month', CURRENT_DATE)
         AND created_at < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month'),
    'equipment_issues',
      (SELECT count(*) FROM public.equipment
       WHERE gym_id = p_gym_id AND status != 'operational')
  ) INTO result;

  RETURN result;
END;
$$;


-- ============================================================
-- 2. dashboard_revenue_summary
-- Returns: current month, previous month, growth %, top 5 plans
-- ============================================================
CREATE OR REPLACE FUNCTION public.dashboard_revenue_summary(p_gym_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
  current_month_rev NUMERIC;
  prev_month_rev NUMERIC;
  growth_pct NUMERIC;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.gyms WHERE id = p_gym_id AND owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Current month revenue
  SELECT coalesce(sum(amount_paid), 0) INTO current_month_rev
  FROM public.subscriptions
  WHERE gym_id = p_gym_id
    AND created_at >= date_trunc('month', CURRENT_DATE)
    AND created_at < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month';

  -- Previous month revenue
  SELECT coalesce(sum(amount_paid), 0) INTO prev_month_rev
  FROM public.subscriptions
  WHERE gym_id = p_gym_id
    AND created_at >= date_trunc('month', CURRENT_DATE) - INTERVAL '1 month'
    AND created_at < date_trunc('month', CURRENT_DATE);

  -- Growth percentage
  IF prev_month_rev > 0 THEN
    growth_pct := round(((current_month_rev - prev_month_rev) / prev_month_rev) * 100, 1);
  ELSE
    growth_pct := CASE WHEN current_month_rev > 0 THEN 100 ELSE 0 END;
  END IF;

  SELECT json_build_object(
    'current_month', current_month_rev,
    'previous_month', prev_month_rev,
    'growth_percentage', growth_pct,
    'currency', (SELECT coalesce(
      (SELECT currency FROM public.plans WHERE gym_id = p_gym_id LIMIT 1),
      'INR'
    )),
    'top_plans', (
      SELECT coalesce(json_agg(row_to_json(t)), '[]'::JSON)
      FROM (
        SELECT p.name AS plan_name, sum(s.amount_paid) AS total_revenue, count(*) AS sub_count
        FROM public.subscriptions s
        JOIN public.plans p ON p.id = s.plan_id
        WHERE s.gym_id = p_gym_id
          AND s.created_at >= date_trunc('month', CURRENT_DATE)
          AND s.created_at < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month'
        GROUP BY p.name
        ORDER BY total_revenue DESC
        LIMIT 5
      ) t
    )
  ) INTO result;

  RETURN result;
END;
$$;


-- ============================================================
-- 3. dashboard_attendance_summary
-- Returns: today count, 7-day trend array
-- ============================================================
CREATE OR REPLACE FUNCTION public.dashboard_attendance_summary(p_gym_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.gyms WHERE id = p_gym_id AND owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT json_build_object(
    'today_count',
      (SELECT count(*) FROM public.attendance
       WHERE gym_id = p_gym_id
         AND check_in_at >= CURRENT_DATE
         AND check_in_at < CURRENT_DATE + INTERVAL '1 day'),
    'seven_day_trend', (
      SELECT coalesce(json_agg(row_to_json(t) ORDER BY t.day), '[]'::JSON)
      FROM (
        SELECT
          d.day::DATE AS day,
          coalesce(count(a.id), 0) AS count
        FROM generate_series(
          CURRENT_DATE - INTERVAL '6 days',
          CURRENT_DATE,
          '1 day'
        ) AS d(day)
        LEFT JOIN public.attendance a
          ON a.gym_id = p_gym_id
          AND a.check_in_at >= d.day
          AND a.check_in_at < d.day + INTERVAL '1 day'
        GROUP BY d.day
      ) t
    ),
    'peak_hours', (
      SELECT coalesce(json_agg(row_to_json(t) ORDER BY t.checkins DESC), '[]'::JSON)
      FROM (
        SELECT
          extract(hour FROM check_in_at)::INT AS hour,
          count(*) AS checkins
        FROM public.attendance
        WHERE gym_id = p_gym_id
          AND check_in_at >= CURRENT_DATE - INTERVAL '7 days'
        GROUP BY extract(hour FROM check_in_at)
        ORDER BY checkins DESC
        LIMIT 5
      ) t
    )
  ) INTO result;

  RETURN result;
END;
$$;


-- ============================================================
-- 4. dashboard_operational_alerts
-- Returns: broken equipment, open reports, pending feedback,
--          expiring subscriptions
-- ============================================================
CREATE OR REPLACE FUNCTION public.dashboard_operational_alerts(p_gym_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.gyms WHERE id = p_gym_id AND owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT json_build_object(
    'equipment_issues', (
      SELECT coalesce(json_agg(row_to_json(t)), '[]'::JSON)
      FROM (
        SELECT id, name, status, category
        FROM public.equipment
        WHERE gym_id = p_gym_id AND status != 'operational'
        ORDER BY updated_at DESC
        LIMIT 10
      ) t
    ),
    'open_reports', (
      SELECT coalesce(json_agg(row_to_json(t)), '[]'::JSON)
      FROM (
        SELECT er.id, er.title, er.severity, er.status, e.name AS equipment_name
        FROM public.equipment_reports er
        JOIN public.equipment e ON e.id = er.equipment_id
        WHERE er.gym_id = p_gym_id
          AND er.status IN ('open', 'in_progress')
          AND er.severity IN ('high', 'critical')
        ORDER BY
          CASE er.severity WHEN 'critical' THEN 0 ELSE 1 END,
          er.created_at DESC
        LIMIT 10
      ) t
    ),
    'pending_feedback_count',
      (SELECT count(*) FROM public.feedback
       WHERE gym_id = p_gym_id AND status = 'pending'),
    'expiring_subscriptions', (
      SELECT coalesce(json_agg(row_to_json(t)), '[]'::JSON)
      FROM (
        SELECT s.id, s.end_date, s.status,
               u.full_name AS member_name, p.name AS plan_name
        FROM public.subscriptions s
        JOIN public.members m ON m.id = s.member_id
        JOIN public.users u ON u.id = m.user_id
        JOIN public.plans p ON p.id = s.plan_id
        WHERE s.gym_id = p_gym_id
          AND s.status = 'active'
          AND s.end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
        ORDER BY s.end_date ASC
        LIMIT 10
      ) t
    ),
    'cancelled_this_month',
      (SELECT count(*) FROM public.subscriptions
       WHERE gym_id = p_gym_id
         AND status = 'cancelled'
         AND updated_at >= date_trunc('month', CURRENT_DATE)),
    'paused_count',
      (SELECT count(*) FROM public.subscriptions
       WHERE gym_id = p_gym_id AND status = 'paused')
  ) INTO result;

  RETURN result;
END;
$$;
