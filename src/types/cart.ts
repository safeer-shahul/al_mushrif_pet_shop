// src/types/cart.ts

import { ProdVariant, ProductImage } from "./product";
import { User } from "@/context/AuthContext";

/**
 * Interface for the nested Product data needed specifically for cart display.
 * It must include relations required for frontend logic (like image lookup).
 */
export interface CartProductDisplay {
    id: string; 
    prod_name: string; 
    base_price: number | null; 
    
    // CRITICAL FIX: Add the missing properties from the Product model
    images?: ProductImage[];
    has_variants?: boolean;
}


/**
 * Interface for a single item within the cart.
 */
export interface CartItem {
    id: string;
    cart_id: string;
    prod_variant_id: string;
    quantity: number;
    created_at: string;
    updated_at: string;
    
    // Relationship: Nested variant data 
    // FIX: Use the expanded CartProductDisplay type
    variant: ProdVariant & { product: CartProductDisplay }; 
    
    calculated_price: number; 
    item_total_price: number;
    item_discount: number;

    primary_image_url?: string | null; 
}

/**
 * Interface for the entire Cart container.
 */
export interface Cart {
    id: string;
    user_id: string | null;
    items: CartItem[];
    created_at: string;
    updated_at: string;

    totals: {
        total_actual_price: number;
        total_discount: number;
        payable_price: number;
        shipping_price: number;
    } | null; 
}

/**
 * Interface for the context to manage Cart state globally.
 */
export interface CartContextType {
    cart: Cart | null;
    cartCount: number;
    cartLoading: boolean;
    error: string | null;
    isCartDrawerOpen: boolean; 
    setIsCartDrawerOpen: (isOpen: boolean) => void; 
    fetchCart: () => Promise<void>;
    addItem: (prodVariantId: string, quantity: number) => Promise<void>;
    updateItemQuantity: (prodVariantId: string, quantity: number) => Promise<void>;
    removeItem: (prodVariantId: string) => Promise<void>;
    validateCart: () => Promise<boolean>; // This must be included
    invalidItems: {id: string, reason: string}[];
}