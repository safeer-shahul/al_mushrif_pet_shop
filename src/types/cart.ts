// src/types/cart.ts

import { ProdVariant, ProductImage } from "./product";
import { User } from "@/context/AuthContext";

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
    variant: ProdVariant & { product: { id: string, prod_name: string } }; 
    
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
    
    // 💡 FIX 1: Add the state getter
    isCartDrawerOpen: boolean; 
    // 💡 FIX 2: Add the state setter
    setIsCartDrawerOpen: (isOpen: boolean) => void; 
    
    // Cart Actions (exposed to components)
    fetchCart: () => Promise<void>;
    addItem: (prodVariantId: string, quantity: number) => Promise<void>;
    updateItemQuantity: (prodVariantId: string, quantity: number) => Promise<void>;
    removeItem: (prodVariantId: string) => Promise<void>;
}