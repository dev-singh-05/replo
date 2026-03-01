// ============================================================
// Replo — useGymRequests hook
// Fetches pending gym membership requests for the current user
// ============================================================

import { supabase } from '@/src/core/supabase/client';
import { useAuthStore } from '@/src/store/auth-store';
import { useCallback, useEffect, useState } from 'react';

export interface GymRequest {
    id: string;
    gym_id: string;
    user_id: string;
    requested_by: string;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    updated_at: string;
    gyms?: { id: string; name: string; city: string | null; country: string | null } | null;
}

export function useGymRequests() {
    const user = useAuthStore((s) => s.user);
    const [requests, setRequests] = useState<GymRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchRequests = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        setError(null);
        try {
            const { data, error: fetchErr } = await supabase
                .from('gym_membership_requests')
                .select('*, gyms(id, name, city, country)')
                .eq('user_id', user.id)
                .eq('status', 'pending')
                .order('created_at', { ascending: false });

            if (fetchErr) throw fetchErr;
            setRequests((data as GymRequest[]) ?? []);
        } catch (err: any) {
            setError(err.message || 'Failed to load requests');
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    const respondToRequest = async (requestId: string, action: 'approved' | 'rejected') => {
        try {
            const { error: updateErr } = await supabase
                .from('gym_membership_requests')
                .update({ status: action })
                .eq('id', requestId);

            if (updateErr) throw updateErr;

            // If approved, create member record for this gym
            if (action === 'approved') {
                const request = requests.find((r) => r.id === requestId);
                if (request && user) {
                    const { error: memberErr } = await supabase
                        .from('members')
                        .insert({
                            gym_id: request.gym_id,
                            user_id: user.id,
                            status: 'active',
                        });
                    // Ignore 23505 (already a member)
                    if (memberErr && memberErr.code !== '23505') throw memberErr;
                }
            }

            // Remove from local state
            setRequests((prev) => prev.filter((r) => r.id !== requestId));
            return { success: true };
        } catch (err: any) {
            setError(err.message || 'Failed to update request');
            return { success: false, error: err.message };
        }
    };

    return {
        requests,
        pendingCount: requests.length,
        isLoading,
        error,
        refetch: fetchRequests,
        respondToRequest,
    };
}
