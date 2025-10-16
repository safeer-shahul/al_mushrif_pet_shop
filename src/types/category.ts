// src/types/category.ts

export interface BaseCategory {
    id: string; // UUID
    created_at?: string;
    updated_at?: string;
}

export interface RootCategory extends BaseCategory {
    cat_name: string;
    cat_image: string | null;
    cat_description: string | null;
    sub_categories?: SubCategory[];
}

export interface SubCategory extends BaseCategory {
    sub_cat_name: string; 
    sub_cat_image: string | null;
    sub_cat_description: string | null;
    is_root_category: boolean; 
    parent_id: string;
    parent_display_name?: string; 
    parent_type?: 'root' | 'sub';
}

export type AnyCategory = RootCategory | SubCategory;

export interface RootCategoryIndexResponse {
    root_categories: RootCategory[];
}

export interface SubCategoryIndexResponse {
    sub_categories: SubCategory[];
}