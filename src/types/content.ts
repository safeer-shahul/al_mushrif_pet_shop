// src/types/content.ts

export interface Marquee {
    id: string;
    content: string;
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface HomeSection {
    id: string;
    title: string;
    product_ids: string[]; // UUIDs of products
    is_active: boolean;
    order_sequence: number;
    offer_id: string | null;
    // Relationships (will be simplified for public API)
}

export interface HeroSection {
    id: string;
    image: string; // URL path
    slug: string | null; // Link path
    is_active: boolean;
    order_sequence: number;
    offer_id: string | null;
    // Relationships (will be simplified for public API)
}