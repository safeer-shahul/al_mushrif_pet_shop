// src/types/filter.ts

// The Filter Item model (e.g., "Small", "Cotton")
export interface FilterItem {
    id: string; // UUID of the item
    filter_name: string;
    parent_filter_type_id: string; // UUID of the parent type
    created_at: string;
    updated_at: string;
}

// The Filter Type model (e.g., "Size", "Material")
export interface FilterType {
    id: string; // UUID of the type
    filter_type_name: string;
    created_at: string;
    updated_at: string;
    // Loaded by the backend via $types = ProductFilterType::with('items')->get();
    items?: FilterItem[]; 
}

// The API response for the index endpoint (assuming it returns an array directly)
export type FilterTypeIndexResponse = FilterType[];