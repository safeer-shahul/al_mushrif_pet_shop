// src/services/admin/productService.ts
import { useAuth } from '@/context/AuthContext';
import { getCsrfToken, createAuthenticatedClient, publicClient } from '@/utils/ApiClient';
import { Product, ProdVariant } from '@/types/product';
import { useCallback } from 'react';

const PRODUCT_API_ENDPOINT = '/admin/products';

/**
 * Custom hook to encapsulate all Product and Variant API operations.
 */
export const useProductService = () => {
    const { token } = useAuth();
    const storagePrefix = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/storage/';

    const getClient = useCallback((isFileUpload: boolean = false) => {
        const config = isFileUpload ? { omitContentType: true } : {};
        if (token) {
            return createAuthenticatedClient(token, config); 
        }
        throw new Error("Authentication token missing."); 
    }, [token]);
    
    const getStorageUrl = useCallback((path: string | null) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        return storagePrefix + path;
    }, [storagePrefix]);

    // ---------------------------------------------------------------------
    // PRODUCT CRUD OPERATIONS (JSON)
    // ---------------------------------------------------------------------

    const fetchAllProducts = useCallback(async (): Promise<Product[]> => {
        const api = getClient();
        try {
            const response = await api.get<Product[]>(PRODUCT_API_ENDPOINT);
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to load product list.');
        }
    }, [getClient]);
    
    const fetchProductById = useCallback(async (id: string): Promise<Product> => {
        const api = getClient();
        try {
            const response = await api.get<Product>(`${PRODUCT_API_ENDPOINT}/${id}`);
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to load product details.');
        }
    }, [getClient]);

    const createProduct = useCallback(async (productData: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'variants' | 'category' | 'brand'>) => {
        const api = getClient();
        try {
            await getCsrfToken();
            
            // Prepare payload: Includes new base prices, Booleans to 1/0, Filters to JSON string
            const payload = {
                ...productData,
                base_price: productData.base_price, 
                base_offer_price: productData.base_offer_price,
                can_return: productData.can_return ? 1 : 0,
                can_replace: productData.can_replace ? 1 : 0,
                product_filters: productData.product_filters ? JSON.stringify(productData.product_filters) : null,
            };
            
            const response = await api.post(PRODUCT_API_ENDPOINT, payload);
            return response.data.product as Product;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to create product.');
        }
    }, [getClient]);

    const updateProduct = useCallback(async (id: string, productData: Partial<Product>) => {
        const api = getClient();
        try {
            await getCsrfToken();
            
            // Prepare payload for update: Includes new base prices, Booleans to 1/0, Filters to JSON string
            const payload = {
                ...productData,
                ...(productData.base_price !== undefined && { base_price: productData.base_price }),
                ...(productData.base_offer_price !== undefined && { base_offer_price: productData.base_offer_price }),
                ...(productData.can_return !== undefined && { can_return: productData.can_return ? 1 : 0 }),
                ...(productData.can_replace !== undefined && { can_replace: productData.can_replace ? 1 : 0 }),
                product_filters: productData.product_filters ? JSON.stringify(productData.product_filters) : null,
            };
            
            const response = await api.put(`${PRODUCT_API_ENDPOINT}/${id}`, payload);
            return response.data.product as Product;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to update product.');
        }
    }, [getClient]);

    const deleteProduct = useCallback(async (id: string) => {
        const api = getClient();
        try {
            await getCsrfToken();
            const response = await api.delete(`${PRODUCT_API_ENDPOINT}/${id}`);
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to delete product.');
        }
    }, [getClient]);

    // ---------------------------------------------------------------------
    // PRODUCT VARIANT OPERATIONS (JSON Payload)
    // ---------------------------------------------------------------------

    const rawCreateVariantJson = useCallback(async (productId: string, payload: Partial<ProdVariant>) => {
        const api = getClient();
        try {
            await getCsrfToken();
            // API: POST /admin/products/{productId}/variants
            const response = await api.post(`${PRODUCT_API_ENDPOINT}/${productId}/variants`, {
                ...payload,
                images: payload.images ? JSON.stringify(payload.images) : null // Ensure JSON string format for API
            });
            return response.data.variant as ProdVariant;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to create variant.');
        }
    }, [getClient]);

    const rawUpdateVariantJson = useCallback(async (productId: string, variantId: string, payload: Partial<ProdVariant>) => {
        const api = getClient();
        try {
            await getCsrfToken();
            // API: PUT /admin/products/{productId}/variants/{id}
            const response = await api.put(`${PRODUCT_API_ENDPOINT}/${productId}/variants/${variantId}`, {
                ...payload,
                images: payload.images ? JSON.stringify(payload.images) : null // Ensure JSON string format for API
            });
            return response.data.variant as ProdVariant;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to update variant.');
        }
    }, [getClient]);
    
    const deleteVariant = useCallback(async (productId: string, variantId: string) => {
        const api = getClient();
        try {
            await getCsrfToken();
            // API: DELETE /admin/products/{productId}/variants/{id}
            const response = await api.delete(`${PRODUCT_API_ENDPOINT}/${productId}/variants/${variantId}`);
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to delete variant.');
        }
    }, [getClient]);

    return {
        fetchAllProducts,
        fetchProductById,
        createProduct,
        updateProduct,
        deleteProduct,
        
        rawCreateVariantJson,
        rawUpdateVariantJson,
        deleteVariant,
        
        getStorageUrl
    };
};