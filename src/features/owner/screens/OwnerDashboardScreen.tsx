import { useAuth } from '@/src/core/hooks/use-auth';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback } from 'react';
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { AlertList } from '../components/AlertList';
import { MetricCard } from '../components/MetricCard';
import { MiniBarChart } from '../components/MiniBarChart';
import { RevenueChart } from '../components/RevenueChart';
import { SectionHeader } from '../components/SectionHeader';
import { useAttendanceAnalytics } from '../hooks/useAttendanceAnalytics';
import { useOperationalAlerts } from '../hooks/useOperationalAlerts';
import { useOwnerDashboard } from '../hooks/useOwnerDashboard';
import { useRevenueAnalytics } from '../hooks/useRevenueAnalytics';

export default function OwnerDashboardScreen() {
    const { gym, signOut } = useAuth();
    const overview = useOwnerDashboard();
    const revenue = useRevenueAnalytics();
    const attendance = useAttendanceAnalytics();
    const alerts = useOperationalAlerts();

    const isAnyLoading =
        overview.isLoading || revenue.isLoading || attendance.isLoading || alerts.isLoading;

    const onRefresh = useCallback(() => {
        overview.refetch();
        revenue.refetch();
        attendance.refetch();
        alerts.refetch();
    }, [overview, revenue, attendance, alerts]);

    // Format the 7-day trend for the bar chart
    const trendBars = (attendance.data?.seven_day_trend ?? []).map((d) => ({
        label: new Date(d.day).toLocaleDateString('en', { weekday: 'narrow' }),
        value: d.count,
    }));

    // Map equipment issues to alert items
    const equipmentAlerts = (alerts.data?.equipment_issues ?? []).map((e) => ({
        id: e.id,
        title: e.name,
        subtitle: `${e.category} · ${e.status}`,
        severity: e.status === 'out_of_order' ? 'critical' : 'medium',
    }));

    // Map open reports to alert items
    const reportAlerts = (alerts.data?.open_reports ?? []).map((r) => ({
        id: r.id,
        title: r.title,
        subtitle: r.equipment_name,
        severity: r.severity,
    }));

    // Map expiring subs to alert items
    const expiringSubs = (alerts.data?.expiring_subscriptions ?? []).map((s) => ({
        id: s.id,
        title: s.member_name,
        subtitle: `${s.plan_name} · expires ${new Date(s.end_date).toLocaleDateString()}`,
    }));

    if (isAnyLoading && !overview.data) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6366f1" />
                <Text style={styles.loadingText}>Loading dashboard…</Text>
            </View>
        );
    }

    const o = overview.data;
    const r = revenue.data;

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            refreshControl={
                <RefreshControl
                    refreshing={isAnyLoading}
                    onRefresh={onRefresh}
                    tintColor="#6366f1"
                    colors={['#6366f1']}
                />
            }
        >
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <Text style={styles.gymName}>{gym?.name ?? 'My Gym'}</Text>
                    <TouchableOpacity style={styles.logoutBtn} onPress={signOut}>
                        <Ionicons name="log-out-outline" size={20} color="#ef4444" />
                        <Text style={styles.logoutText}>Logout</Text>
                    </TouchableOpacity>
                </View>
                <Text style={styles.subtitle}>Owner Dashboard</Text>
            </View>

            {/* Overview Metrics Grid */}
            <SectionHeader title="Overview" />
            <View style={styles.metricsGrid}>
                <MetricCard
                    label="Total Members"
                    value={o?.total_members ?? 0}
                    icon="people"
                    color="#6366f1"
                />
                <MetricCard
                    label="Active Members"
                    value={o?.active_members ?? 0}
                    icon="person-circle"
                    color="#22c55e"
                />
                <MetricCard
                    label="Expiring Soon"
                    value={o?.expiring_soon ?? 0}
                    icon="time-outline"
                    color="#f59e0b"
                />
                <MetricCard
                    label="Today Check-ins"
                    value={o?.today_checkins ?? 0}
                    icon="log-in-outline"
                    color="#3b82f6"
                />
                <MetricCard
                    label="Monthly Revenue"
                    value={`₹${(o?.monthly_revenue ?? 0).toLocaleString()}`}
                    icon="cash-outline"
                    color="#10b981"
                />
                <MetricCard
                    label="Equipment Issues"
                    value={o?.equipment_issues ?? 0}
                    icon="build-outline"
                    color={o?.equipment_issues ? '#ef4444' : '#22c55e'}
                />
            </View>

            {/* Revenue Section */}
            <SectionHeader title="Revenue" />
            {r ? (
                <RevenueChart
                    currentMonth={r.current_month}
                    previousMonth={r.previous_month}
                    growthPercentage={r.growth_percentage}
                    currency={r.currency}
                />
            ) : null}

            {/* Top Plans */}
            {r && r.top_plans.length > 0 ? (
                <>
                    <SectionHeader title="Top Plans" />
                    <View style={styles.plansCard}>
                        {r.top_plans.map((plan, i) => (
                            <View
                                key={i}
                                style={[styles.planRow, i < r.top_plans.length - 1 && styles.planRowBorder]}
                            >
                                <View style={styles.planRank}>
                                    <Text style={styles.planRankText}>{i + 1}</Text>
                                </View>
                                <View style={styles.planInfo}>
                                    <Text style={styles.planName}>{plan.plan_name}</Text>
                                    <Text style={styles.planSubs}>{plan.sub_count} subscriptions</Text>
                                </View>
                                <Text style={styles.planRevenue}>
                                    ₹{plan.total_revenue.toLocaleString()}
                                </Text>
                            </View>
                        ))}
                    </View>
                </>
            ) : null}

            {/* Attendance Section */}
            <SectionHeader title="Attendance (7 Days)" />
            <MiniBarChart data={trendBars} color="#3b82f6" height={90} />

            {/* Subscription Health */}
            <SectionHeader title="Subscription Health" />
            <View style={styles.healthRow}>
                <View style={styles.healthCard}>
                    <Text style={styles.healthValue}>{alerts.data?.cancelled_this_month ?? 0}</Text>
                    <Text style={styles.healthLabel}>Cancelled</Text>
                </View>
                <View style={styles.healthCard}>
                    <Text style={styles.healthValue}>{alerts.data?.paused_count ?? 0}</Text>
                    <Text style={styles.healthLabel}>Paused</Text>
                </View>
                <View style={styles.healthCard}>
                    <Text style={styles.healthValue}>{alerts.data?.pending_feedback_count ?? 0}</Text>
                    <Text style={styles.healthLabel}>Feedback</Text>
                </View>
            </View>

            {/* Expiring Subscriptions */}
            {expiringSubs.length > 0 ? (
                <>
                    <SectionHeader title="Expiring Soon" />
                    <AlertList items={expiringSubs} emptyMessage="No expiring subscriptions" />
                </>
            ) : null}

            {/* Operational Alerts */}
            <SectionHeader title="Equipment Alerts" />
            <AlertList items={equipmentAlerts} emptyMessage="All equipment operational" />

            {reportAlerts.length > 0 ? (
                <>
                    <SectionHeader title="Open Reports" />
                    <AlertList items={reportAlerts} emptyMessage="No open reports" />
                </>
            ) : null}

            {/* Bottom spacing */}
            <View style={{ height: 40 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a0a',
    },
    content: {
        paddingHorizontal: 16,
        paddingTop: 56,
        paddingBottom: 24,
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: '#0a0a0a',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    loadingText: {
        color: '#9ca3af',
        fontSize: 14,
    },
    header: {
        marginBottom: 8,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    logoutText: {
        color: '#ef4444',
        fontSize: 13,
        fontWeight: '600',
    },
    gymName: {
        fontSize: 28,
        fontWeight: '800',
        color: '#f9fafb',
    },
    subtitle: {
        fontSize: 14,
        color: '#6366f1',
        fontWeight: '600',
        marginTop: 4,
    },
    metricsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    plansCard: {
        backgroundColor: '#111827',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#1f2937',
        overflow: 'hidden',
    },
    planRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    planRowBorder: {
        borderBottomWidth: 1,
        borderBottomColor: '#1f2937',
    },
    planRank: {
        width: 28,
        height: 28,
        borderRadius: 8,
        backgroundColor: '#6366f11A',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    planRankText: {
        color: '#6366f1',
        fontWeight: '700',
        fontSize: 13,
    },
    planInfo: {
        flex: 1,
    },
    planName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#e5e7eb',
    },
    planSubs: {
        fontSize: 11,
        color: '#6b7280',
        marginTop: 2,
    },
    planRevenue: {
        fontSize: 15,
        fontWeight: '700',
        color: '#22c55e',
    },
    healthRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 8,
    },
    healthCard: {
        flex: 1,
        backgroundColor: '#111827',
        borderRadius: 14,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#1f2937',
    },
    healthValue: {
        fontSize: 22,
        fontWeight: '800',
        color: '#f9fafb',
        marginBottom: 4,
    },
    healthLabel: {
        fontSize: 11,
        color: '#6b7280',
        fontWeight: '500',
    },
});
