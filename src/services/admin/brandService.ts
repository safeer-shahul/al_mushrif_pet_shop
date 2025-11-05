import { useAuth } from '@/context/AuthContext';
import { getCsrfToken, createAuthenticatedClient, publicClient } from '@/utils/ApiClient';
import { Brand } from '@/types/brand'; // Assuming this is defined
import { useCallback } from 'react';

const BRAND_API_ENDPOINT = '/admin/brands';
// CRITICAL FIX: Point to the new public route to fetch IDs for the static build
const BRAND_STATIC_EXPORT_ENDPOINT = '/public/brand-ids'; 

/**
 * UTILITY FUNCTION FOR NEXT.JS BUILD (Server-side compatible)
 * Fetches all brand IDs for generateStaticParams, using the public client.
 */
export const fetchAllBrandIdsForStaticExport = async (): Promise<string[]> => {
    try {
        // Hitting the new public endpoint
        const response = await publicClient.get<string[]>(BRAND_STATIC_EXPORT_ENDPOINT);

        const ids = Array.isArray(response.data) ? response.data : [];

        // Note: brand_id is used by the controller, so the returned IDs are correct.
        return ids.map(id => id.toString());
    } catch (error) {
        console.error('Failed to fetch Brand IDs for static export (Check API endpoint security):', error);
        return [];
    }
}


/**
 * Custom hook to encapsulate all Brand API operations.
 */
export const useBrandService = () => {
    const { token } = useAuth();
    const storagePrefix = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/storage/';

    const getClient = useCallback((isFileUpload: boolean = false) => {
        const config = isFileUpload ? { omitContentType: true } : {};
        if (token) {
            return createAuthenticatedClient(token, config); 
        }
        return publicClient; 
    }, [token]);

    const getStorageUrl = useCallback((path: string | null) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        return storagePrefix + path;
    }, [storagePrefix]);

    // ---------------------------------------------------------------------
    // BRAND CRUD OPERATIONS
    // ---------------------------------------------------------------------

    const fetchAllBrands = useCallback(async (): Promise<Brand[]> => {
        const api = getClient(false);
        try {
            const response = await api.get<Brand[]>(BRAND_API_ENDPOINT);
            console.log("Brands response:", response.data);
            return response.data;
        } catch (error: any) {
            console.error('API Error in fetchAllBrands:', error);
            throw new Error(error.response?.data?.message || 'Failed to load brand data from the API.');
        }
    }, [getClient]);
    
    const fetchBrandById = useCallback(async (id: string): Promise<Brand> => {
        const api = getClient(false);
        try {
            const response = await api.get<Brand>(`${BRAND_API_ENDPOINT}/${id}`);
            console.log("Brand detail response:", response.data);
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to load brand details.');
        }
    }, [getClient]);

    const createBrand = useCallback(async (formData: FormData) => {
        const api = getClient(true);
        console.log("Creating brand with formData:");
        for (const pair of formData.entries()) { console.log(pair[0], pair[1]); }
        try {
            await getCsrfToken();
            const response = await api.post(BRAND_API_ENDPOINT, formData);
            return response.data;
        } catch (error: any) {
            console.error('Create brand error:', error);
            throw new Error(error.response?.data?.message || 'Failed to create brand.');
        }
    }, [getClient]);

    const updateBrand = useCallback(async (id: string, formData: FormData) => {
        const api = getClient(true);
        console.log("Updating brand with formData:");
        for (const pair of formData.entries()) { console.log(pair[0], pair[1]); }
        try {
            await getCsrfToken();
            if (!formData.has('_method')) {
                formData.append('_method', 'PUT');
            }
            const response = await api.post(`${BRAND_API_ENDPOINT}/${id}`, formData);
            return response.data;
        } catch (error: any) {
            console.error('Update brand error:', error);
            throw new Error(error.response?.data?.message || 'Failed to update brand.');
        }
    }, [getClient]);

    const deleteBrand = useCallback(async (id: string) => {
        const api = getClient(false);
        try {
            await getCsrfToken();
            const response = await api.delete(`${BRAND_API_ENDPOINT}/${id}`);
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to delete brand.');
        }
    }, [getClient]);

    return {
        fetchAllBrands,
        fetchBrandById,
        createBrand,
        updateBrand,
        deleteBrand,
        getStorageUrl 
    };
};