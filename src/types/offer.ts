// src/types/offer.ts

import { Product } from "./product";

export type OfferType = 'percentage' | 'fixed_amount' | 'bogo' | 'cart_total_percentage' | 'cart_total_fixed';

export interface Offer {
    id: string;
    offer_name: string;
    type: OfferType;
    discount_percent: number | null;
    min_qty: number | null;
    free_qty: number | null;
    min_cart_amount: number | null;
    products: string[];
    
    offer_image: string | null; // 💡 NEW FIELD for file path
    products_with_details?: Product[];
    created_at: string;
    updated_at: string;
}