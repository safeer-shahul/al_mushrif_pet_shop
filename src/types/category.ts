// src/types/category.ts

export interface BaseCategory {
  id: string; // UUID
  cat_image: string | null;
  cat_description: string | null;
  created_at: string;
  updated_at: string;
}

export interface RootCategory extends BaseCategory {
  cat_name: string;
  // Subcategories can be nested here for display purposes
  sub_categories?: SubCategory[]; 
}

export interface SubCategory extends BaseCategory {
  // NOTE: The model uses 'sub_cat_name' but the API request uses 'cat_name'
  sub_cat_name: string; 
  is_root_category: boolean; // True if parent_id is a RootCategory
  parent_id: string; // UUID of parent
}

export type AnyCategory = RootCategory | SubCategory;

// Define the response structure for the Index endpoint
export interface CategoryIndexResponse {
    root_categories: RootCategory[];
    sub_categories: SubCategory[];
}