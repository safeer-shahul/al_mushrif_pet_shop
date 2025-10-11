// src/types/brand.ts

export interface Brand {
    // The primary key from the Laravel model
    brand_id: string; 
    brand_name: string;
    // brand_logo will be a URL from the API/storage
    brand_logo: string | null; 
    brand_description: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface BrandIndexResponse {
    brands: Brand[];
}