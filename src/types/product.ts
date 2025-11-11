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
    s_active?: boolean; 
    created_at: string;
    updated_at: string;

    // FIX: Changed quantity from `number | undefined` to `number | null | undefined`
    // This allows backend values of null (which Laravel sends for nullable DB fields)
    images?: ProductImage[]; 
    quantity?: number | null; 
    color_value: string | null; // Moved for better logical grouping
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
    
    // ✨ NEW FIELD
    description: string | null; // Rich HTML description
    
    base_price: number | null; 
    base_offer_price: number | null;
    // base_quantity in the form/context of base products will likely send null, so number | null is correct.
    base_quantity: number | null; 
    
    // Ensure this is explicitly a boolean
    has_variants: boolean;
    
    // Add these new properties
    is_disabled?: boolean;      
    quantity?: number | null; // FIX: Also updated here to allow null
    
    created_at: string;
    updated_at: string;
    
    variants?: ProdVariant[];
    images?: ProductImage[];
    category?: SubCategory;
    brand?: Brand;
}