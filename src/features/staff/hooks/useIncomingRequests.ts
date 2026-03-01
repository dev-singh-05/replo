// ============================================================
// Replo — useIncomingRequests hook
// Fetches pending gym membership requests for the current gym (owner/staff)
// ============================================================

import { useAuth } from '@/src/core/hooks/use-auth';
import { supabase } from '@/src/core/supabase/client';
import { useCallback, useEffect, useState } from 'react';

export interface IncomingRequest {
    id: string;
    gym_id: string;
    user_id: string;
    requested_by: string;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    updated_at: string;
    users?: {
        id: string;
        full_name: string | null;
        phone: string | null;
    } | null;
}

export function useIncomingRequests() {
    const { gym } = useAuth();
    const [requests, setRequests] = useState<IncomingRequest[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchRequests = useCallback(async () => {
        if (!gym) return;
        setIsLoading(true);
        setError(null);
        try {
            console.log('[useIncomingRequests] Fetching for gym:', gym.id);
            const { data, error: fetchErr } = await supabase
                .from('gym_membership_requests')
                .select('*, users:user_id(id, full_name, phone)')
                .eq('gym_id', gym.id)
                .eq('status', 'pending')
                .order('created_at', { ascending: false });

            console.log('[useIncomingRequests] Result:', { data, error: fetchErr });
            if (fetchErr) throw fetchErr;
            setRequests((data as IncomingRequest[]) ?? []);
        } catch (err: any) {
            setError(err.message || 'Failed to load requests');
        } finally {
            setIsLoading(false);
        }
    }, [gym]);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    const rejectRequest = async (requestId: string) => {
        try {
            const { error: updateErr } = await supabase
                .from('gym_membership_requests')
                .update({ status: 'rejected' })
                .eq('id', requestId);
            if (updateErr) throw updateErr;
            setRequests((prev) => prev.filter((r) => r.id !== requestId));
            return { success: true };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    };

    const markApproved = async (requestId: string) => {
        try {
            const { error: updateErr } = await supabase
                .from('gym_membership_requests')
                .update({ status: 'approved' })
                .eq('id', requestId);
            if (updateErr) throw updateErr;
            setRequests((prev) => prev.filter((r) => r.id !== requestId));
            return { success: true };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    };

    return {
        requests,
        pendingCount: requests.length,
        isLoading,
        error,
        refetch: fetchRequests,
        rejectRequest,
        markApproved,
    };
}
