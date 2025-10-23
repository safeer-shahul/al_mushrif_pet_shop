// src/types/offer.ts

export type OfferType = 'percentage' | 'bogo' | 'fixed_amount';

export interface Offer {
    id: string;
    offer_name: string;
    type: OfferType;
    discount_percent: number | null;
    min_qty: number | null; // Buy X (BOGO)
    free_qty: number | null; // Get Y (BOGO)
    products: string[]; // Array of Product UUIDs
    created_at: string;
    updated_at: string;
}