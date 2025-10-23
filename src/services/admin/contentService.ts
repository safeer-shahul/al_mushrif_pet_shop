// src/services/admin/contentService.ts

import { useAuth } from '@/context/AuthContext';
import { getCsrfToken, createAuthenticatedClient, publicClient } from '@/utils/ApiClient';
import { HeroSection, HomeSection } from '@/types/content'; 
import { useCallback } from 'react';

const HERO_API_ENDPOINT = '/admin/content/hero';
const HOME_API_ENDPOINT = '/admin/content/home';

/**
 * Custom hook to encapsulate Hero Section and Home Section management.
 */
export const useContentService = () => {
    const { token } = useAuth();

    // Utility function to get the authenticated client (standard JSON requests)
    const getAdminClient = useCallback(() => {
        if (token) {
            return createAuthenticatedClient(token); 
        }
        throw new Error("Authentication token missing for admin operation.");
    }, [token]);

    // ---------------------------------------------------------------------
    // HERO SECTION (BANNERS) CRUD
    // ---------------------------------------------------------------------

    const fetchAllHeroSections = useCallback(async (): Promise<HeroSection[]> => {
        const api = getAdminClient();
        try {
            const response = await api.get<HeroSection[]>(HERO_API_ENDPOINT);
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to load hero sections.');
        }
    }, [getAdminClient]);

    const saveHeroSection = useCallback(async (data: Partial<HeroSection>, imageFile: File | null, imageRemoved: boolean, isUpdate: boolean = false) => {
        // Use a client configured for FormData (multipart)
        const api = createAuthenticatedClient(token as string, { omitContentType: true }); 
        await getCsrfToken();
        
        const formData = new FormData();
        
        // --- 1. Append Data Fields ---
        if (data.id) formData.append('id', data.id);
        
        // Use empty string if null, as Laravel uses it for nullable string fields
        formData.append('slug', data.slug || '');
        formData.append('offer_id', data.offer_id || ''); // FIX: If empty/null, sends "" which Laravel casts to null
        formData.append('order_sequence', String(data.order_sequence || 0));
        formData.append('is_active', data.is_active ? '1' : '0'); 
        
        // --- 2. Handle Image File/Removal ---
        if (imageFile) {
            formData.append('image_file', imageFile); 
        } else if (imageRemoved && isUpdate) {
            formData.append('image_removed', 'true'); 
        }

        try {
            if (isUpdate && data.id) {
                // UPDATE: Use POST with method spoofing for file upload
                formData.append('_method', 'PUT');
                const response = await api.post(`${HERO_API_ENDPOINT}/${data.id}`, formData);
                return response.data;
            } else {
                // CREATE: Standard POST
                const response = await api.post(HERO_API_ENDPOINT, formData);
                return response.data;
            }
        } catch (error: any) {
            const validationError = error.response?.data?.errors?.image_file?.[0] 
                                    || error.response?.data?.errors?.offer_id?.[0]; // Catch specific errors
            const msg = validationError || error.response?.data?.message || 'Failed to save hero section.';
            throw new Error(msg);
        }
    }, [token]);
    
    const deleteHeroSection = useCallback(async (id: string) => {
        const api = getAdminClient();
        try {
            await getCsrfToken();
            const response = await api.delete(`${HERO_API_ENDPOINT}/${id}`);
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to delete hero section.');
        }
    }, [getAdminClient]);

    // ---------------------------------------------------------------------
    // HOME SECTION (PRODUCT GRIDS) CRUD (Uses JSON client)
    // ---------------------------------------------------------------------
    
    // ... (fetchAllHomeSections and saveHomeSection logic remains the same as previously provided)
    const fetchAllHomeSections = useCallback(async (): Promise<HomeSection[]> => {
        const api = getAdminClient();
        try {
            const response = await api.get<HomeSection[]>(HOME_API_ENDPOINT);
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to load home sections.');
        }
    }, [getAdminClient]);
    
    const saveHomeSection = useCallback(async (data: Partial<HomeSection>) => {
        const api = getAdminClient();
        await getCsrfToken();
        
        const payload = { 
            ...data, 
            is_active: data.is_active ? 1 : 0,
            product_ids: data.product_ids ? JSON.stringify(data.product_ids) : '[]'
        };

        try {
            if (data.id) {
                const response = await api.put(`${HOME_API_ENDPOINT}/${data.id}`, payload);
                return response.data;
            } else {
                const response = await api.post(HOME_API_ENDPOINT, payload);
                return response.data;
            }
        } catch (error: any) {
             const msg = error.response?.data?.errors?.title?.[0] || error.response?.data?.message || 'Failed to save home section.';
            throw new Error(msg);
        }
    }, [getAdminClient]);
    
    const deleteHomeSection = useCallback(async (id: string) => {
        const api = getAdminClient();
        try {
            await getCsrfToken();
            const response = await api.delete(`${HOME_API_ENDPOINT}/${id}`);
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to delete home section.');
        }
    }, [getAdminClient]);


    return {
        fetchAllHeroSections,
        saveHeroSection,
        deleteHeroSection,
        fetchAllHomeSections,
        saveHomeSection,
        deleteHomeSection
    };
};