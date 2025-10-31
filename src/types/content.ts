// src/types/content.ts

import { Product } from "./product";

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
    products?: Product[]; // Transient property for frontend display
}

export interface HeroSection {
    id: string;
    pc_image: string; // URL path for Desktop
    mobile_image: string | null;
    slug: string | null; // Link path
    is_active: boolean;
    order_sequence: number;
    offer_id: string | null;
    // Relationships (will be simplified for public API)
}