import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Billing Engine utility inline
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

    static generateInitialCycle(contract: any): any {
        const { end } = this.calculateCycleDates(new Date(contract.start_date), contract.plan_type);
        return {
            cycle_start: contract.start_date,
            cycle_end: end.toISOString().split('T')[0],
            due_date: contract.start_date,
            status: 'unpaid'
        }
    }
}

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        );

        // Verify requesting user is admin/owner/staff
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) throw new Error('Unauthorized');

        const payload = await req.json();
        const {
            gymId, phone, name, membershipNumber,
            joinedAt, startDate, endDate, planType, initialPaymentStatus
        } = payload;

        if (!gymId || !phone || !startDate || !planType) {
            throw new Error('Missing required fields');
        }

        const { data: staffCheck } = await supabaseClient
            .from('gym_staff')
            .select('role')
            .eq('gym_id', gymId)
            .eq('user_id', user.id)
            .single();

        if (!staffCheck) throw new Error('Forbidden: Not staff of this gym');

        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        // 1. Check if user with phone exists
        const formattedPhone = phone.startsWith('+') ? phone : `+${phone}`;
        let targetUserId = null;

        // Search existing user (need custom query or admin listUsers)
        // As getting users by phone is restricted, we use an RPC or listUsers
        const { data: usersData, error: usersErr } = await supabaseAdmin.auth.admin.listUsers();
        if (usersErr) throw usersErr;

        const existingUser = usersData.users.find((u) => u.phone === formattedPhone);

        if (existingUser) {
            targetUserId = existingUser.id;
        } else {
            // Create new minimal user
            const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
                phone: formattedPhone,
                phone_confirm: false,
                user_metadata: { name: name, role: 'member' }
            });
            if (createErr) throw createErr;
            targetUserId = newUser.user.id;

            // Upsert public.users profile
            await supabaseAdmin.from('users').upsert({
                id: targetUserId,
                full_name: name,
                phone: formattedPhone,
                role: 'member'
            });
        }

        // 2. Check if member exists
        const { data: existingMember } = await supabaseAdmin
            .from('members')
            .select('id')
            .eq('gym_id', gymId)
            .eq('user_id', targetUserId)
            .single();

        let memberId = existingMember?.id;

        if (!memberId) {
            const insertPayload: any = {
                gym_id: gymId,
                user_id: targetUserId,
                membership_number: membershipNumber || null,
                status: 'active'
            };
            if (joinedAt) insertPayload.joined_at = joinedAt;

            const { data: newMember, error: memErr } = await supabaseAdmin
                .from('members')
                .insert(insertPayload)
                .select('id')
                .single();

            if (memErr) throw memErr;
            memberId = newMember.id;

            // 3. Create Health Profile
            await supabaseAdmin.from('member_health_profiles').insert({
                member_id: memberId
            });
        }

        // 4. Resolve Dates for Contract
        const now = new Date();
        let finalStartDate = startDate ? new Date(startDate) : now;
        let finalEndDate = endDate ? new Date(endDate) : new Date(finalStartDate);

        if (!endDate) {
            if (planType === 'monthly') finalEndDate.setMonth(finalEndDate.getMonth() + 1);
            else if (planType === 'quarterly') finalEndDate.setMonth(finalEndDate.getMonth() + 3);
            else if (planType === 'yearly') finalEndDate.setFullYear(finalEndDate.getFullYear() + 1);
            else finalEndDate.setMonth(finalEndDate.getMonth() + 1);
        }

        // Create Contract
        const { data: contract, error: contractErr } = await supabaseAdmin
            .from('membership_contracts')
            .insert({
                member_id: memberId,
                start_date: finalStartDate.toISOString().split('T')[0],
                end_date: finalEndDate.toISOString().split('T')[0],
                plan_type: planType,
                status: 'active'
            })
            .select('*')
            .single();

        if (contractErr) throw contractErr;

        // 5. Create Initial Billing Cycle
        const initialCycle = BillingEngine.generateInitialCycle(contract);
        initialCycle.member_id = memberId;
        initialCycle.contract_id = contract.id;

        if (initialPaymentStatus === 'paid') {
            initialCycle.status = 'paid';
            initialCycle.last_payment_date = new Date().toISOString().split('T')[0];
        }

        const { error: cycleErr } = await supabaseAdmin
            .from('membership_billing_cycles')
            .insert(initialCycle);

        if (cycleErr) throw cycleErr;

        return new Response(JSON.stringify({ success: true, member_id: memberId, user_id: targetUserId }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
});
