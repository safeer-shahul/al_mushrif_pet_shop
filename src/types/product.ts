// src/types/product.ts

import { SubCategory } from "./category";
import { Brand } from "./brand";

// --------------------------------------------------
// 0. Product Image Model (NEW)
// --------------------------------------------------
export interface ProductImage {
    id: string; // UUID of the image record
    product_id: string;
    prod_variant_id: string | null;
    image_url: string; // The relative path stored in the database
    is_primary: boolean;
    order_sequence: number;
}

// --------------------------------------------------
// 1. Variant Model (UPDATED)
// --------------------------------------------------
export interface ProdVariant {
    id: string; 
    prod_id: string; 
    variant_name: string | null;
    price: number;
    offer_price: number | null;
    color_value: string | null;
    images?: ProductImage[]; // Array of image objects
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
    
    base_price: number | null; 
    base_offer_price: number | null;
    base_quantity: number | null; 
    
    created_at: string;
    updated_at: string;

    // Relationships
    variants?: ProdVariant[];
    images?: ProductImage[]; // Base product images (prod_variant_id is null)
    category?: SubCategory;
    brand?: Brand;
}

// --------------------------------------------------
// 3. Category Type Update (for path display in ProductForm)
// --------------------------------------------------
// Assuming your SubCategory type can hold ancestral information (either directly or via parent_id lookup)
// Add these to SubCategory if they are not already present in your original type definition:
// export interface SubCategory extends BaseCategory {
//     parent_id: string | null;
//     // For convenience, let's assume the API returns the full path as an array:
//     // ancestry_names?: string[]; 
// }