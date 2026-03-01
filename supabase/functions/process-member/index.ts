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
        console.log('[STEP 1] Creating supabase client...');
        const authHeader = req.headers.get('Authorization');
        console.log('[STEP 1] Auth header present:', !!authHeader);

        // Extract JWT token from Authorization header
        const jwt = authHeader?.replace('Bearer ', '') ?? '';

        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: authHeader! } } }
        );

        console.log('[STEP 2] Getting user with JWT...');
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser(jwt);
        if (userError) {
            console.error('[STEP 2 FAILED] getUser error:', JSON.stringify(userError));
            throw new Error('Unauthorized: ' + userError.message);
        }
        if (!user) throw new Error('Unauthorized: No user found');
        console.log('[STEP 2 OK] User ID:', user.id);

        console.log('[STEP 3] Parsing payload...');
        const payload = await req.json();
        console.log('[STEP 3 OK] Payload:', JSON.stringify(payload));

        const {
            gymId, phone, name, membershipNumber,
            joinedAt, startDate, endDate, planType, initialPaymentStatus
        } = payload;

        if (!gymId || !phone || !startDate || !planType) {
            const missing = [];
            if (!gymId) missing.push('gymId');
            if (!phone) missing.push('phone');
            if (!startDate) missing.push('startDate');
            if (!planType) missing.push('planType');
            throw new Error('Missing required fields: ' + missing.join(', '));
        }

        console.log('[STEP 4] Checking authorization for gymId:', gymId, 'userId:', user.id);

        // First create admin client (needed for owner check too)
        console.log('[STEP 5] Creating admin client...');
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        // Check gym_staff first
        const { data: staffCheck } = await supabaseAdmin
            .from('gym_staff')
            .select('role')
            .eq('gym_id', gymId)
            .eq('user_id', user.id)
            .maybeSingle();

        // If not in gym_staff, check if they are the gym owner
        let isAuthorized = !!staffCheck;
        if (!isAuthorized) {
            console.log('[STEP 4] Not in gym_staff, checking if gym owner...');
            const { data: gymData } = await supabaseAdmin
                .from('gyms')
                .select('owner_id')
                .eq('id', gymId)
                .single();
            isAuthorized = gymData?.owner_id === user.id;
        }

        if (!isAuthorized) {
            console.error('[STEP 4 FAILED] User is neither staff nor owner');
            throw new Error('Forbidden: Not staff or owner of this gym');
        }
        console.log('[STEP 4 OK] User authorized (staff or owner)');

        // ═══════════════════════════════════════════════════════════
        // PRE-CHECK: Phone conflict detection (Cases 1-3)
        // ═══════════════════════════════════════════════════════════

        const formattedPhone = phone.replace(/\s+/g, '');
        const finalPhone = formattedPhone.startsWith('+') ? formattedPhone : `+${formattedPhone}`;
        console.log('[STEP 6] Checking phone conflicts for:', finalPhone);

        // Check if a user with this phone exists in public.users
        const { data: existingProfile } = await supabaseAdmin
            .from('users')
            .select('id, full_name')
            .eq('phone', finalPhone)
            .maybeSingle();

        if (existingProfile) {
            console.log('[STEP 6] Found existing user:', existingProfile.id);

            // CASE 1: Check if this user is already a member of THIS gym
            const { data: sameGymMember } = await supabaseAdmin
                .from('members')
                .select('id, status')
                .eq('gym_id', gymId)
                .eq('user_id', existingProfile.id)
                .maybeSingle();

            if (sameGymMember) {
                console.log('[STEP 6] CONFLICT: Member already exists in same gym:', sameGymMember.id);
                return new Response(JSON.stringify({
                    success: false,
                    conflict: 'MEMBER_EXISTS_SAME_GYM',
                    message: 'This mobile number is already registered in your gym.',
                    existing_member_id: sameGymMember.id,
                    existing_status: sameGymMember.status,
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 200, // 200 so the client can parse the structured response
                });
            }

            // CASE 2: Check if this user is a member of ANY other gym
            const { data: otherGymMembers } = await supabaseAdmin
                .from('members')
                .select('id, gym_id')
                .eq('user_id', existingProfile.id)
                .neq('gym_id', gymId)
                .limit(1);

            if (otherGymMembers && otherGymMembers.length > 0) {
                console.log('[STEP 6] CONFLICT: Member exists in another gym');

                // Also check if there's already a pending request
                const { data: existingRequest } = await supabaseAdmin
                    .from('gym_membership_requests')
                    .select('id, status')
                    .eq('gym_id', gymId)
                    .eq('user_id', existingProfile.id)
                    .eq('status', 'pending')
                    .maybeSingle();

                return new Response(JSON.stringify({
                    success: false,
                    conflict: 'MEMBER_EXISTS_OTHER_GYM',
                    message: 'This mobile number is registered with another gym.',
                    target_user_id: existingProfile.id,
                    target_user_name: existingProfile.full_name,
                    has_pending_request: !!existingRequest,
                    pending_request_id: existingRequest?.id || null,
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 200,
                });
            }

            // User exists in public.users but NOT a member of any gym yet
            // Fall through to normal creation flow using this user's ID
            console.log('[STEP 6] User exists but not a member anywhere — proceeding with creation');
        }

        // ═══════════════════════════════════════════════════════════
        // CASE 3: Normal creation flow (no conflict)
        // ═══════════════════════════════════════════════════════════

        let targetUserId = null;

        if (existingProfile) {
            // User exists in public.users but isn't a member anywhere
            targetUserId = existingProfile.id;
            console.log('[STEP 6 OK] Using existing user:', targetUserId);

            // Update name if provided (in case owner entered a different name)
            if (name) {
                await supabaseAdmin.from('users').update({ full_name: name }).eq('id', targetUserId);
            }
        } else {
            // Not in public.users — also check auth.users by phone
            console.log('[STEP 7] No public.users profile, checking/creating auth user...');

            // Try creating a new auth user
            const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
                phone: finalPhone,
                phone_confirm: false,
                user_metadata: { name: name, role: 'member' }
            });

            if (createErr) {
                console.error('[STEP 7] createUser error:', JSON.stringify(createErr));
                // If phone already registered in auth, find the existing auth user
                if (createErr.message?.includes('already registered') || createErr.message?.includes('already been registered')) {
                    console.log('[STEP 7] Phone already registered in auth, looking up...');
                    const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
                    const existingUser = usersData?.users?.find((u: any) => u.phone === finalPhone);
                    if (existingUser) {
                        targetUserId = existingUser.id;
                        console.log('[STEP 7 OK] Found existing auth user:', targetUserId);
                    } else {
                        console.error('[STEP 7] Could not find user. Auth user phones:',
                            usersData?.users?.map((u: any) => u.phone));
                        return new Response(JSON.stringify({
                            success: false,
                            error: 'PHONE_LOOKUP_FAILED',
                            message: 'Could not find user with this phone number. Please try again.',
                        }), {
                            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                            status: 200,
                        });
                    }
                } else {
                    return new Response(JSON.stringify({
                        success: false,
                        error: 'USER_CREATION_FAILED',
                        message: 'Failed to create user account. Please try again.',
                    }), {
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                        status: 200,
                    });
                }
            } else {
                targetUserId = newUser.user.id;
                console.log('[STEP 7 OK] Created user:', targetUserId);
            }

            // Upsert public.users profile
            console.log('[STEP 8] Upserting users profile...');
            const { error: upsertErr } = await supabaseAdmin.from('users').upsert({
                id: targetUserId,
                full_name: name || 'Member',
                phone: finalPhone
            });
            if (upsertErr) {
                console.error('[STEP 8 FAILED] users upsert error:', JSON.stringify(upsertErr));
                throw upsertErr;
            }
            console.log('[STEP 8 OK] Users profile upserted');
        }

        // 2. Check if member exists
        console.log('[STEP 9] Checking if member exists in gym...');
        const { data: existingMember } = await supabaseAdmin
            .from('members')
            .select('id')
            .eq('gym_id', gymId)
            .eq('user_id', targetUserId)
            .single();

        let memberId = existingMember?.id;
        console.log('[STEP 9 OK] Existing member:', memberId || 'none');

        if (!memberId) {
            console.log('[STEP 10] Creating member...');
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

            if (memErr) {
                console.error('[STEP 10 FAILED] members insert error:', JSON.stringify(memErr));
                // Catch unique constraint violation gracefully
                if (memErr.code === '23505') {
                    return new Response(JSON.stringify({
                        success: false,
                        conflict: 'MEMBER_EXISTS_SAME_GYM',
                        message: 'This mobile number is already registered in your gym.',
                    }), {
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                        status: 200,
                    });
                }
                throw memErr;
            }
            memberId = newMember.id;
            console.log('[STEP 10 OK] Created member:', memberId);

            // 3. Create Health Profile
            console.log('[STEP 11] Creating health profile...');
            const { error: healthErr } = await supabaseAdmin.from('member_health_profiles').insert({
                member_id: memberId
            });
            if (healthErr) {
                console.error('[STEP 11 FAILED] health profile error:', JSON.stringify(healthErr));
                // Don't throw here, health profile is optional
            } else {
                console.log('[STEP 11 OK] Health profile created');
            }
        }

        // 4. Resolve Dates for Contract
        console.log('[STEP 12] Resolving contract dates...');
        const now = new Date();
        let finalStartDate = startDate ? new Date(startDate) : now;
        let finalEndDate = endDate ? new Date(endDate) : new Date(finalStartDate);

        if (!endDate) {
            if (planType === 'monthly') finalEndDate.setMonth(finalEndDate.getMonth() + 1);
            else if (planType === 'quarterly') finalEndDate.setMonth(finalEndDate.getMonth() + 3);
            else if (planType === 'yearly') finalEndDate.setFullYear(finalEndDate.getFullYear() + 1);
            else finalEndDate.setMonth(finalEndDate.getMonth() + 1);
        }
        console.log('[STEP 12 OK] Start:', finalStartDate.toISOString(), 'End:', finalEndDate.toISOString());

        // Create Contract
        console.log('[STEP 13] Creating contract...');
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

        if (contractErr) {
            console.error('[STEP 13 FAILED] contract insert error:', JSON.stringify(contractErr));
            throw contractErr;
        }
        console.log('[STEP 13 OK] Contract created:', contract.id);

        // 5. Create Initial Billing Cycle
        console.log('[STEP 14] Creating billing cycle...');
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

        if (cycleErr) {
            console.error('[STEP 14 FAILED] billing cycle error:', JSON.stringify(cycleErr));
            throw cycleErr;
        }
        console.log('[STEP 14 OK] Billing cycle created');

        console.log('[SUCCESS] Member creation complete!');
        return new Response(JSON.stringify({ success: true, member_id: memberId, user_id: targetUserId }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });
    } catch (error: any) {
        console.error('[FINAL ERROR]', error.message || JSON.stringify(error));
        return new Response(JSON.stringify({
            success: false,
            error: 'UNEXPECTED_ERROR',
            message: error.message || 'An unexpected error occurred. Please try again.',
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200, // Return 200 so client always gets structured JSON
        });
    }
});
