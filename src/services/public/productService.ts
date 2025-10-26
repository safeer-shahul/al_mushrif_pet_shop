// src/services/public/productService.ts
import { publicClient } from '@/utils/ApiClient';
import { Product } from '@/types/product';
import { useCallback } from 'react';

// Simplified type for paginated response
export interface PaginatedProducts {
    data: Product[];
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
}

// Interface for API query parameters
export interface ProductQueryParams {
    category_id?: string;
    brand_id?: string;
    search?: string;
    offer_id?: string;
    filter_items?: string; 
    min_price?: number;
    max_price?: number;
    color?: string;
    page?: number;

    sort?: string; 
}

/**
 * Custom hook for public product catalog access.
 */
export const usePublicProductService = () => {
    
    // ---------------------------------------------------------------------
    // PUBLIC PRODUCT LISTING (INDEX)
    // ---------------------------------------------------------------------

    const fetchProducts = useCallback(async (params: ProductQueryParams = {}): Promise<PaginatedProducts> => {
        try {
            // Build query string from non-null parameters
            const query = Object.keys(params)
                .filter(key => params[key as keyof ProductQueryParams] !== undefined && params[key as keyof ProductQueryParams] !== null)
                .map(key => {
                    const value = params[key as keyof ProductQueryParams];
                    return `${encodeURIComponent(key)}=${encodeURIComponent(value as string | number)}`;
                })
                .join('&');
            
            const endpoint = `/products${query ? '?' + query : ''}`;
            
            // The Laravel API returns the paginated object directly
            const response = await publicClient.get<PaginatedProducts>(endpoint);
            
            return response.data;

        } catch (error: any) {
            console.error('API Error in fetchProducts:', error);
            throw new Error(error.response?.data?.message || 'Failed to load public product catalog.');
        }
    }, []);

    // ---------------------------------------------------------------------
    // PUBLIC PRODUCT DETAIL (SHOW)
    // ---------------------------------------------------------------------

    const fetchProductDetail = useCallback(async (id: string): Promise<Product> => {
        try {
            // Ensure necessary relations like variants and images are implicitly loaded by the backend show method
            const response = await publicClient.get<Product>(`/products/${id}`);
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to load product details.');
        }
    }, []);


    return {
        fetchProducts,
        fetchProductDetail
    };
};