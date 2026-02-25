import { getTenantId } from '@/src/core/api/queryBuilder';
import { handleSupabaseError } from '@/src/core/api/types';
import { supabase } from '@/src/core/supabase/client';
import type {
    AttendanceSummary,
    OperationalAlerts,
    OverviewMetrics,
    RevenueSummary,
} from '../types';

/**
 * Dashboard API layer.
 * All functions call SECURITY DEFINER RPCs on the server.
 * gym_id is read from auth store, never from UI.
 */
export const dashboardApi = {
    async fetchOverviewMetrics(): Promise<OverviewMetrics> {
        const gym_id = getTenantId();
        const { data, error } = await supabase.rpc('dashboard_overview_metrics', { p_gym_id: gym_id });
        if (error) handleSupabaseError(error);
        return data as unknown as OverviewMetrics;
    },

    async fetchRevenueSummary(): Promise<RevenueSummary> {
        const gym_id = getTenantId();
        const { data, error } = await supabase.rpc('dashboard_revenue_summary', { p_gym_id: gym_id });
        if (error) handleSupabaseError(error);
        return data as unknown as RevenueSummary;
    },

    async fetchAttendanceSummary(): Promise<AttendanceSummary> {
        const gym_id = getTenantId();
        const { data, error } = await supabase.rpc('dashboard_attendance_summary', { p_gym_id: gym_id });
        if (error) handleSupabaseError(error);
        return data as unknown as AttendanceSummary;
    },

    async fetchOperationalAlerts(): Promise<OperationalAlerts> {
        const gym_id = getTenantId();
        const { data, error } = await supabase.rpc('dashboard_operational_alerts', { p_gym_id: gym_id });
        if (error) handleSupabaseError(error);
        return data as unknown as OperationalAlerts;
    },
};
