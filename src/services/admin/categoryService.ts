// src/services/admin/categoryService.ts

import { useApiClient, getCsrfToken, createAuthenticatedClient, publicClient } from '@/utils/ApiClient';
import { useAuth } from '@/context/AuthContext';
import { RootCategory, SubCategory, RootCategoryIndexResponse, SubCategoryIndexResponse } from '@/types/category';
import { useCallback } from 'react'; // <-- CRITICAL IMPORT

const ROOT_CATEGORY_API_ENDPOINT = '/admin/root-categories';
const SUB_CATEGORY_API_ENDPOINT = '/admin/sub-categories';

/**
 * Custom hook to encapsulate all Category API operations.
 */
export const useCategoryService = () => {
    const { token } = useAuth();
    const storagePrefix = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/storage/';

    // 1. STABLE getClient function (The foundation for all API calls)
    const getClient = useCallback((isFileUpload: boolean = false) => {
        const config = isFileUpload ? { omitContentType: true } : {};
        if (token) {
            return createAuthenticatedClient(token, config); 
        }
        return publicClient; 
    }, [token]);

    // 2. STABLE URL UTILITY
    const getStorageUrl = useCallback((path: string | null) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        return storagePrefix + path;
    }, [storagePrefix]);

    // ---------------------------------------------------------------------
    // ROOT CATEGORY OPERATIONS (All memoized)
    // ---------------------------------------------------------------------

    const fetchAllRootCategories = useCallback(async (): Promise<RootCategory[]> => {
        const api = getClient(false);
        try {
            const response = await api.get<RootCategoryIndexResponse>(ROOT_CATEGORY_API_ENDPOINT);
            return response.data?.root_categories || [];
        } catch (error: any) {
            console.error('API Error in fetchAllRootCategories:', error);
            throw new Error(error.response?.data?.message || 'Failed to load root category data from the API.');
        }
    }, [getClient]);
    
    const fetchRootCategoryById = useCallback(async (id: string): Promise<RootCategory> => {
        const api = getClient(false);
        try {
            const response = await api.get<{ category: RootCategory }>(`${ROOT_CATEGORY_API_ENDPOINT}/${id}`);
            return response.data?.category;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to load root category details.');
        }
    }, [getClient]);

    const createRootCategory = useCallback(async (formData: FormData) => {
        const api = getClient(true);
        try {
            await getCsrfToken();
            const response = await api.post(ROOT_CATEGORY_API_ENDPOINT, formData); 
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to create category.');
        }
    }, [getClient]);

    const updateRootCategory = useCallback(async (id: string, formData: FormData) => {
        const api = getClient(true);
        try {
            await getCsrfToken();
            formData.append('_method', 'PUT'); 
            const response = await api.post(`${ROOT_CATEGORY_API_ENDPOINT}/${id}`, formData); 
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to update category.');
        }
    }, [getClient]);

    const deleteRootCategory = useCallback(async (id: string) => {
        const api = getClient(false);
        try {
            await getCsrfToken();
            const response = await api.delete(`${ROOT_CATEGORY_API_ENDPOINT}/${id}`);
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to delete category.');
        }
    }, [getClient]);


    // ---------------------------------------------------------------------
    // SUB CATEGORY OPERATIONS (All memoized)
    // ---------------------------------------------------------------------
    
    const fetchAllSubCategories = useCallback(async (): Promise<SubCategory[]> => {
        const api = getClient(false);
        try {
            const response = await api.get<SubCategoryIndexResponse>(SUB_CATEGORY_API_ENDPOINT);
            return response.data?.sub_categories || [];
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to load sub category data from the API.');
        }
    }, [getClient]);
    
    const fetchSubCategoryById = useCallback(async (id: string): Promise<SubCategory> => {
        const api = getClient(false);
        try {
            const response = await api.get<{ category: SubCategory }>(`${SUB_CATEGORY_API_ENDPOINT}/${id}`);
            return response.data?.category;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to load sub category details.');
        }
    }, [getClient]);

    const createSubCategory = useCallback(async (formData: FormData) => {
        const api = getClient(true);
        try {
            await getCsrfToken();
            const response = await api.post(SUB_CATEGORY_API_ENDPOINT, formData);
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to create sub category.');
        }
    }, [getClient]);

    const updateSubCategory = useCallback(async (id: string, formData: FormData) => {
        const api = getClient(true);
        try {
            await getCsrfToken();
            formData.append('_method', 'PUT'); 
            const response = await api.post(`${SUB_CATEGORY_API_ENDPOINT}/${id}`, formData); 
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to update sub category.');
        }
    }, [getClient]);
    
    const deleteSubCategory = useCallback(async (id: string) => {
        const api = getClient(false);
        try {
            await getCsrfToken();
            const response = await api.delete(`${SUB_CATEGORY_API_ENDPOINT}/${id}`);
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to delete sub category.');
        }
    }, [getClient]);


    // 3. STABLE UTILITY FUNCTION (Crucial for the Sub Category Create/Edit pages)
    const fetchAllParentCategories = useCallback(async (): Promise<(RootCategory | SubCategory)[]> => {
        // Dependencies are the two stable fetch functions below
        const [roots, subs] = await Promise.all([
            fetchAllRootCategories(), 
            fetchAllSubCategories() 
        ]);
        
        return [...roots, ...subs] as (RootCategory | SubCategory)[]; 
    }, [fetchAllRootCategories, fetchAllSubCategories]); 

    // 4. Return all stable functions
    return {
        fetchAllRootCategories,
        fetchRootCategoryById,
        createRootCategory,
        updateRootCategory,
        deleteRootCategory,
        
        fetchAllSubCategories,
        fetchSubCategoryById,
        createSubCategory,
        updateSubCategory,
        deleteSubCategory,
        
        fetchAllParentCategories, 
        getStorageUrl
    };
};