// src/types/category.ts

export interface BaseCategory {
    id: string; // UUID
    created_at?: string;
    updated_at?: string;
}

export interface SubCategory extends BaseCategory {
    sub_cat_name: string; 
    sub_cat_image: string | null;
    sub_cat_description: string | null;
    is_root_category: boolean; 
    parent_id: string;
    parent_display_name?: string; 
    parent_type?: 'root' | 'sub';

    // NEW: Recursive children relationship (to support L1 > L2 > L3 structure)
    children?: SubCategory[]; 
}

export interface RootCategory extends BaseCategory {
    cat_name: string;
    cat_image: string | null;
    cat_description: string | null;
    
    // The immediate children of a RootCategory are SubCategories (Level 1)
    subCategories?: SubCategory[]; 
    
    // Support both naming conventions since API returns snake_case on some calls
    root_categories?: RootCategory[]; 
}


export type AnyCategory = RootCategory | SubCategory;

export interface RootCategoryIndexResponse {
    root_categories: RootCategory[];
}

export interface SubCategoryIndexResponse {
    sub_categories: SubCategory[];
}