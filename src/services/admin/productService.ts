import { useAuth } from '@/context/AuthContext';
import { getCsrfToken, createAuthenticatedClient, publicClient } from '@/utils/ApiClient';
import { Product, ProdVariant, ProductImage } from '@/types/product';
import { useCallback } from 'react';

const PRODUCT_API_ENDPOINT = '/admin/products';
const IMAGE_API_ENDPOINT = '/admin/images';

// CRITICAL FIX: The endpoint to hit for static ID generation (must be public in Laravel)
const PRODUCT_STATIC_EXPORT_ENDPOINT = '/public/product-ids';

// ---------------------------------------------------------------------
// 1. PUBLIC UTILITY FOR NEXT.JS BUILD (FIXING 401)
// ---------------------------------------------------------------------

/**
 * UTILITY FUNCTION FOR NEXT.JS BUILD (Server-side compatible)
 * Fetches all product IDs for generateStaticParams. Uses publicClient.
 */
export const fetchAllProductIdsForStaticExport = async (): Promise<string[]> => {
    try {
        // Hitting the new dedicated public endpoint (which Laravel exposes)
        const response = await publicClient.get<string[]>(PRODUCT_STATIC_EXPORT_ENDPOINT);

        const ids = Array.isArray(response.data) ? response.data : [];

        return ids.map(id => id.toString());
    } catch (error) {
        console.error('Failed to fetch Product IDs for static export (401/404 - Check public/product-ids route):', error);
        return [];
    }
}

// ---------------------------------------------------------------------
// 2. AUTHENTICATED HOOK (useProductService)
// ---------------------------------------------------------------------

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
        // NOTE: Admin endpoints are strictly protected, hence throwing if token is missing
        throw new Error("Authentication token missing.");
    }, [token]);

    const getStorageUrl = useCallback((path: string | null) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        return storagePrefix + path;
    }, [storagePrefix]);

    // ---------------------------------------------------------------------
    // PRODUCT CRUD OPERATIONS (JSON) - (Remaining functions are unchanged)
    // ---------------------------------------------------------------------

    const fetchAllProducts = useCallback(async (): Promise<Product[]> => {
        const api = getClient();
        try {
            const response = await api.get<Product[]>(`${PRODUCT_API_ENDPOINT}?include=images`);
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to load product list.');
        }
    }, [getClient]);

    const fetchProductById = useCallback(async (id: string): Promise<Product> => {
        const api = getClient();
        try {
            const response = await api.get<Product>(`${PRODUCT_API_ENDPOINT}/${id}?include=variants.images,images`);
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to load product details.');
        }
    }, [getClient]);

    const createProduct = useCallback(async (productData: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'variants' | 'category' | 'brand' | 'images'>) => {
        const api = getClient();
        try {
            await getCsrfToken();

            const payload = {
                ...productData,
                has_variants: productData.has_variants ? 1 : 0,
                can_return: productData.can_return ? 1 : 0,
                can_replace: productData.can_replace ? 1 : 0,
                product_filters: productData.product_filters ? JSON.stringify(productData.product_filters) : null,
            };

            console.log('Sending payload:', payload);

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

            const payload = {
                ...productData,
                has_variants: productData.has_variants ? 1 : 0,
                can_return: productData.can_return ? 1 : 0,
                can_replace: productData.can_replace ? 1 : 0,
                product_filters: productData.product_filters ?
                    (typeof productData.product_filters === 'string' ?
                        productData.product_filters :
                        JSON.stringify(productData.product_filters)
                    ) : null,
            };

            const response = await api.put(`${PRODUCT_API_ENDPOINT}/${id}`, payload);
            const updatedProduct = await fetchProductById(id);

            return updatedProduct;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to update product.');
        }
    }, [getClient, fetchProductById]);

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
    // NEW STATUS TOGGLE OPERATION
    // ---------------------------------------------------------------------

    const toggleProductStatus = useCallback(async (id: string, isDisabled: boolean): Promise<Product> => {
        const api = getClient();
        try {
            await getCsrfToken();
            const response = await api.put<{ message: string, product: Product }>(
                `${PRODUCT_API_ENDPOINT}/${id}/toggle-status`,
                { is_disabled: isDisabled }
            );
            return response.data.product;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || `Failed to toggle product status.`);
        }
    }, [getClient]);

    // ---------------------------------------------------------------------
    // PRODUCT VARIANT CRUD OPERATIONS (JSON Payload) - (Unchanged)
    // ---------------------------------------------------------------------

    const rawCreateVariantJson = useCallback(async (productId: string, payload: Partial<ProdVariant>) => {
        const api = getClient();
        try {
            await getCsrfToken();
            const response = await api.post(`${PRODUCT_API_ENDPOINT}/${productId}/variants`, payload);
            return response.data.variant as ProdVariant;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to create variant.');
        }
    }, [getClient]);

    const rawUpdateVariantJson = useCallback(async (productId: string, variantId: string, payload: Partial<ProdVariant>) => {
        const api = getClient();
        try {
            await getCsrfToken();
            const response = await api.put(`${PRODUCT_API_ENDPOINT}/${productId}/variants/${variantId}`, payload);
            return response.data.variant as ProdVariant;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to update variant.');
        }
    }, [getClient]);

    const deleteVariant = useCallback(async (productId: string, variantId: string) => {
        const api = getClient();
        try {
            await getCsrfToken();
            const response = await api.delete(`${PRODUCT_API_ENDPOINT}/${productId}/variants/${variantId}`);
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to delete variant.');
        }
    }, [getClient]);

    // ---------------------------------------------------------------------
    // PRODUCT/VARIANT IMAGE MANAGEMENT - (Unchanged)
    // ---------------------------------------------------------------------

    const uploadImages = useCallback(async (parentId: string, files: File[], isVariant: boolean): Promise<ProductImage[]> => {
        const api = getClient(true);
        const formData = new FormData();
        files.forEach(file => formData.append('images[]', file));

        const endpoint = isVariant
            ? `/admin/variants/${parentId}/images`
            : `/admin/products/${parentId}/images`;

        try {
            await getCsrfToken();
            const response = await api.post(endpoint, formData);
            return response.data.images;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to upload images.');
        }
    }, [getClient]);

    const updateImage = useCallback(async (imageId: string, formData: FormData): Promise<ProductImage> => {
        const api = getClient(true);
        try {
            await getCsrfToken();
            formData.append('_method', 'PUT');
            const response = await api.post(`${IMAGE_API_ENDPOINT}/${imageId}`, formData);
            return response.data.image;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to update image.');
        }
    }, [getClient]);

    const deleteImage = useCallback(async (imageId: string) => {
        const api = getClient();
        try {
            await getCsrfToken();
            const response = await api.delete(`${IMAGE_API_ENDPOINT}/${imageId}`);
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to delete image.');
        }
    }, [getClient]);

    return {
        fetchAllProducts,
        fetchProductById,
        createProduct,
        updateProduct,
        deleteProduct,
        toggleProductStatus,
        rawCreateVariantJson,
        rawUpdateVariantJson,
        deleteVariant,

        uploadImages,
        updateImage,
        deleteImage,
        getStorageUrl
    };
};