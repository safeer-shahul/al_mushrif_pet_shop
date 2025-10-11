// src/types/product.ts

import { SubCategory } from "./category";
import { Brand } from "./brand";

// --------------------------------------------------
// 1. Variant Model
// --------------------------------------------------
export interface ProdVariant {
    id: string; // UUID of the variant
    prod_id: string; // UUID of the parent product
    variant_name: string | null;
    price: number;
    offer_price: number | null;
    color_value: string | null; // e.g., "#FF0000" or "Red"
    images: string[] | null; 
    created_at: string;
    updated_at: string;
}

// --------------------------------------------------
// 2. Product Model
// --------------------------------------------------
export interface ProductFilters {
    [filterTypeId: string]: string[];
}

export interface Product {
    id: string; // UUID of the product
    prod_id: string; // SKU or unique identifier (validated for uniqueness)
    prod_name: string;
    sub_cat_id: string | null;
    brand_id: string;
    can_return: boolean;
    can_replace: boolean;
    product_filters: ProductFilters | null; 
    
    created_at: string;
    updated_at: string;

    // Relationships
    variants?: ProdVariant[];
    category?: SubCategory;
    brand?: Brand;
}

// --------------------------------------------------
// 3. API Response Structures
// --------------------------------------------------
export interface ProductIndexResponse {
    products: Product[];
}