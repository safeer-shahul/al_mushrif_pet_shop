// src/types/product.ts

import { SubCategory } from "./category";
import { Brand } from "./brand";

// --------------------------------------------------
// 1. Variant Model (No change needed)
// --------------------------------------------------
export interface ProdVariant {
    id: string; // UUID of the variant
    prod_id: string; 
    variant_name: string | null;
    price: number;
    offer_price: number | null;
    color_value: string | null;
    images: string[] | null; 
    created_at: string;
    updated_at: string;
}

// --------------------------------------------------
// 2. Product Model (UPDATED)
// --------------------------------------------------
export interface ProductFilters {
    [filterTypeId: string]: string[];
}

export interface Product {
    id: string;
    prod_id: string;
    prod_name: string;
    sub_cat_id: string | null;
    brand_id: string;
    can_return: boolean;
    can_replace: boolean;
    product_filters: ProductFilters | null;
    
    // --- NEW FIELDS for direct pricing ---
    base_price: number | null; 
    base_offer_price: number | null;
    // -------------------------------------
    
    created_at: string;
    updated_at: string;

    // Relationships
    variants?: ProdVariant[];
    category?: SubCategory;
    brand?: Brand;
}

// --------------------------------------------------
// 3. API Response Structures (No change needed)
// --------------------------------------------------
export interface ProductIndexResponse {
    products: Product[];
}