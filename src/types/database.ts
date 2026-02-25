// ============================================================
// Replo — Database Types (Block 1 Schema Subset)
// Only types needed for auth/role resolution
// ============================================================

export interface Gym {
    id: string;
    name: string;
    slug: string;
    address: string | null;
    city: string | null;
    state: string | null;
    country: string;
    phone: string | null;
    email: string | null;
    logo_url: string | null;
    timezone: string;
    is_active: boolean;
    owner_id: string;
    created_at: string;
    updated_at: string;
}

export interface UserProfile {
    id: string;
    full_name: string;
    avatar_url: string | null;
    phone: string | null;
    date_of_birth: string | null;
    gender: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null;
    role: 'owner' | 'staff' | 'member' | null;
    gym_id: string | null;
    profile_completed: boolean;
    first_login_completed: boolean;
    created_at: string;
    updated_at: string;
}

export type StaffRole = 'owner' | 'manager' | 'trainer' | 'receptionist';

export interface GymStaff {
    id: string;
    gym_id: string;
    user_id: string;
    role: StaffRole;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export type MemberStatus = 'active' | 'inactive' | 'suspended' | 'expired';

export interface Member {
    id: string;
    gym_id: string;
    user_id: string;
    membership_number: string | null;
    emergency_contact: string | null;
    health_notes: string | null;
    status: MemberStatus;
    joined_at: string;
    created_at: string;
    updated_at: string;
}
