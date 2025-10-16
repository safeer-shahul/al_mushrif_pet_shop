// src/types/brand.ts

import { RootCategory } from "./category";

export interface Brand {
    brand_id: string;
    brand_name: string;
    brand_logo: string | null;
    brand_description: string | null;
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
    
    // Support both naming conventions since API returns snake_case
    rootCategories?: RootCategory[];
    root_categories?: RootCategory[];  // Add this line
    
    // For form handling
    category_ids?: string[];
}

export interface BrandIndexResponse {
    brands: Brand[];
}