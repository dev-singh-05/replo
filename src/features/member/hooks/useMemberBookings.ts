// ============================================================
// Replo — useMemberBookings Hook
// Slot booking management for members
// ============================================================

import { useMutation } from '@/src/core/hooks/useMutation';
import { useQuery } from '@/src/core/hooks/useQuery';
import type { AppRole } from '@/src/types/auth';
import { useCallback, useState } from 'react';
import { memberBookingsApi } from '../api/member.api';
import type { CreateBookingInput, MemberBooking } from '../types';
import { MEMBER_ROLE } from '../types';

export function useMemberBookings() {
    const today = new Date().toISOString().split('T')[0];
    const [selectedDate, setSelectedDate] = useState(today);

    const myBookings = useQuery<MemberBooking[]>({
        fetcher: () => memberBookingsApi.fetchMyBookings(selectedDate),
        allowedRoles: [...MEMBER_ROLE] as AppRole[],
        dependencies: [selectedDate],
    });

    const availableSlots = useQuery<Array<{ start_time: string; end_time: string; status: string }>>({
        fetcher: () => memberBookingsApi.fetchAvailableSlots(selectedDate),
        allowedRoles: [...MEMBER_ROLE] as AppRole[],
        dependencies: [selectedDate],
    });

    const createBooking = useMutation<MemberBooking, CreateBookingInput>({
        mutationFn: memberBookingsApi.createBooking,
        allowedRoles: [...MEMBER_ROLE] as AppRole[],
    });

    const cancelBooking = useMutation<MemberBooking, string>({
        mutationFn: memberBookingsApi.cancelBooking,
        allowedRoles: [...MEMBER_ROLE] as AppRole[],
    });

    const changeDate = useCallback((date: string) => {
        setSelectedDate(date);
    }, []);

    const isPastDate = selectedDate < today;

    return {
        myBookings,
        availableSlots,
        selectedDate,
        changeDate,
        isPastDate,
        createBooking,
        cancelBooking,
    };
}
