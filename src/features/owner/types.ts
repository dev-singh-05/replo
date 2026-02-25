// ============================================================
// Replo — Owner Dashboard Types
// ============================================================

export interface OverviewMetrics {
    total_members: number;
    active_members: number;
    expiring_soon: number;
    today_checkins: number;
    monthly_revenue: number;
    equipment_issues: number;
}

export interface TopPlan {
    plan_name: string;
    total_revenue: number;
    sub_count: number;
}

export interface RevenueSummary {
    current_month: number;
    previous_month: number;
    growth_percentage: number;
    currency: string;
    top_plans: TopPlan[];
}

export interface DayTrend {
    day: string;
    count: number;
}

export interface PeakHour {
    hour: number;
    checkins: number;
}

export interface AttendanceSummary {
    today_count: number;
    seven_day_trend: DayTrend[];
    peak_hours: PeakHour[];
}

export interface EquipmentIssue {
    id: string;
    name: string;
    status: string;
    category: string;
}

export interface OpenReport {
    id: string;
    title: string;
    severity: string;
    status: string;
    equipment_name: string;
}

export interface ExpiringSubscription {
    id: string;
    end_date: string;
    status: string;
    member_name: string;
    plan_name: string;
}

export interface OperationalAlerts {
    equipment_issues: EquipmentIssue[];
    open_reports: OpenReport[];
    pending_feedback_count: number;
    expiring_subscriptions: ExpiringSubscription[];
    cancelled_this_month: number;
    paused_count: number;
}
