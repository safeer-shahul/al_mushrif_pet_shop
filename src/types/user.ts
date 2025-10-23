// src/types/user.ts

/**
 * Defines the core User object returned from the API.
 */
export interface User {
    id: string; 
    username: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    is_superuser: boolean;
    is_staff: boolean;
    
    // Relationship: Addresses are part of the user object for convenience
    addresses?: Address[];
}

/**
 * Defines the Address object stored in the Laravel backend.
 */
export interface Address {
    id: string; // UUID
    user_id?: string;
    address_line1: string;
    address_line2: string | null;
    // NOTE: Laravel stores this as JSON, but TypeScript treats it as an array
    phone_numbers: string[]; 
    zip_pin: string;
    street: string | null;
    is_default?: boolean;
}