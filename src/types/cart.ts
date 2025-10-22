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
    
    // Relationship: Nested variant data (which might be the implicit variant for base products)
    variant: ProdVariant & { product: { prod_name: string } }; 
    
    // Convenience property to get the primary image URL directly
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
}

/**
 * Interface for the context to manage Cart state globally.
 */
export interface CartContextType {
    cart: Cart | null;
    cartCount: number;
    cartLoading: boolean;
    error: string | null;
    
    // Cart Actions (exposed to components)
    fetchCart: (isLoggedIn?: boolean) => Promise<void>;
    addItem: (prodVariantId: string, quantity: number) => Promise<void>;
    updateItemQuantity: (prodVariantId: string, quantity: number) => Promise<void>;
    removeItem: (prodVariantId: string) => Promise<void>;
}