// src/types/category.ts

export interface BaseCategory {
    id: string; // UUID
    cat_image: string | null; // For Root
    sub_cat_image: string | null; // For Sub
    cat_description: string | null; // For Root
    sub_cat_description: string | null; // For Sub
    created_at: string;
    updated_at: string;
}

export interface RootCategory extends BaseCategory {
    cat_name: string;
    cat_image: string | null; // Use the Root fields
    cat_description: string | null;
    sub_categories?: SubCategory[]; 
}

export interface SubCategory extends BaseCategory {
    sub_cat_name: string; 
    sub_cat_image: string | null;
    sub_cat_description: string | null;
    is_root_category: boolean; 
    parent_id: string;
    // NEW FIELDS from backend propagation
    parent_display_name?: string; 
    parent_type?: 'root' | 'sub';
}

// AnyCategory is no longer used for listing/fetching, but still useful for forms
export type AnyCategory = RootCategory | SubCategory;

// Define the response structures for the new Index endpoints
export interface RootCategoryIndexResponse {
    root_categories: RootCategory[];
}

export interface SubCategoryIndexResponse {
    sub_categories: SubCategory[];
}