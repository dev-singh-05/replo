import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

// Billing Engine Utility
class BillingEngine {
    static calculateCycleDates(startDate: Date, planType: string): { end: Date, nextStart: Date } {
        const end = new Date(startDate);
        if (planType === 'monthly') end.setMonth(end.getMonth() + 1);
        else if (planType === 'quarterly') end.setMonth(end.getMonth() + 3);
        else if (planType === 'yearly') end.setFullYear(end.getFullYear() + 1);

        end.setDate(end.getDate() - 1);
        const nextStart = new Date(end);
        nextStart.setDate(nextStart.getDate() + 1);

        return { end, nextStart };
    }

    static progressCycle(currentCycle: any, contract: any): any | null {
        if (contract.status === 'expired' || contract.status === 'paused') return null;
        const { end, nextStart } = this.calculateCycleDates(new Date(currentCycle.cycle_start), contract.plan_type);
        if (nextStart > new Date(contract.end_date)) return null;

        return {
            member_id: currentCycle.member_id,
            contract_id: currentCycle.contract_id,
            cycle_start: nextStart.toISOString().split('T')[0],
            cycle_end: end.toISOString().split('T')[0],
            due_date: nextStart.toISOString().split('T')[0],
            status: 'unpaid'
        };
    }
}

serve(async (req: Request) => {
    // Check auth for chron invocation. Depending on pg_cron vs. edge function cron,
    // we might check a secret header or allow anon if pg_cron uses a webhook.
    // For safety, we verify Authorization header holds the service_role key.
    const authHeader = req.headers.get('Authorization');
    // @ts-ignore
    if (authHeader !== `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`) {
        return new Response('Unauthorized', { status: 401 });
    }

    const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    try {
        const today = new Date().toISOString().split('T')[0];

        // 1. Expire completed contracts
        await supabaseAdmin.rpc('expire_completed_contracts', { today_date: today });

        // Fallback if RPC not defined:
        // This is less efficient natively in Supabase without PostgREST filtering, 
        // but typically users do an RPC for bulk updates.
        // For this edge function, doing standard update:
        // .update({ status: 'expired' }).lt('end_date', today).eq('status', 'active')
        await supabaseAdmin
            .from('membership_contracts')
            .update({ status: 'expired' })
            .lt('end_date', today)
            .eq('status', 'active');

        // 2. Mark overdue cycles
        await supabaseAdmin
            .from('membership_billing_cycles')
            .update({ status: 'overdue' })
            .lt('cycle_end', today)
            .eq('status', 'unpaid');

        // 3. Generate Next Cycles for expiring cycles
        const { data: expiringCycles, error: expErr } = await supabaseAdmin
            .from('membership_billing_cycles')
            .select('*, membership_contracts!inner(*)')
            .lte('cycle_end', today)
            .eq('membership_contracts.status', 'active');

        if (expErr) throw expErr;

        let createdCycles = 0;
        for (const cycle of expiringCycles || []) {
            const contract = cycle.membership_contracts;
            const nextCycle = BillingEngine.progressCycle(cycle, contract);

            if (nextCycle) {
                // Idempotent insert: handles unique conflict
                const { error: insertErr } = await supabaseAdmin
                    .from('membership_billing_cycles')
                    .upsert(nextCycle, { onConflict: 'contract_id, cycle_start', ignoreDuplicates: true });

                if (!insertErr) createdCycles++;
            }
        }

        return new Response(JSON.stringify({
            success: true,
            processed: expiringCycles?.length || 0,
            created: createdCycles
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });

    } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
});
