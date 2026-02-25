import { useMutation } from '@/src/core/hooks/useMutation';
import { useQuery } from '@/src/core/hooks/useQuery';
import type { AppRole } from '@/src/types/auth';
import { useCallback, useState } from 'react';
import { staffBookingsApi } from '../api/staff.api';
import type { BookingFilters, CreateBookingInput, StaffBooking } from '../types';
import { MUTATION_ROLES, STAFF_ROLES } from '../types';

/**
 * Booking management for a selected date.
 */
export function useBookings() {
    const today = new Date().toISOString().split('T')[0];
    const [filters, setFilters] = useState<BookingFilters>({ date: today });

    const list = useQuery<StaffBooking[]>({
        fetcher: () => staffBookingsApi.fetchByDate(filters),
        allowedRoles: [...STAFF_ROLES] as AppRole[],
        dependencies: [filters.date, filters.status],
    });

    const setDate = useCallback((date: string) => {
        setFilters((prev) => ({ ...prev, date }));
    }, []);

    const setStatusFilter = useCallback((status: string | undefined) => {
        setFilters((prev) => ({ ...prev, status }));
    }, []);

    const createBooking = useMutation<StaffBooking, CreateBookingInput>({
        mutationFn: staffBookingsApi.create,
        allowedRoles: [...MUTATION_ROLES] as AppRole[],
    });

    const approveBooking = useMutation<StaffBooking, string>({
        mutationFn: staffBookingsApi.approve,
        allowedRoles: [...MUTATION_ROLES] as AppRole[],
    });

    const cancelBooking = useMutation<StaffBooking, string>({
        mutationFn: staffBookingsApi.cancel,
        allowedRoles: [...MUTATION_ROLES] as AppRole[],
    });

    const markNoShow = useMutation<StaffBooking, string>({
        mutationFn: staffBookingsApi.markNoShow,
        allowedRoles: [...MUTATION_ROLES] as AppRole[],
    });

    return {
        bookings: list,
        filters,
        setDate,
        setStatusFilter,
        createBooking,
        approveBooking,
        cancelBooking,
        markNoShow,
    };
}
