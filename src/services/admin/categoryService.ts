import { useApiClient, getCsrfToken, createAuthenticatedClient, publicClient } from '@/utils/ApiClient';
import { useAuth } from '@/context/AuthContext';
import { RootCategory, SubCategory, RootCategoryIndexResponse, SubCategoryIndexResponse } from '@/types/category';
import { useCallback } from 'react'; 

const ROOT_CATEGORY_API_ENDPOINT = '/admin/root-categories';
const SUB_CATEGORY_API_ENDPOINT = '/admin/sub-categories';

// CRITICAL FIX: Point to the new public route for sub-category IDs
const SUB_CATEGORY_STATIC_EXPORT_ENDPOINT = '/public/sub-category-ids';

// Assuming RootCategory type looks something like this (defined in '@/types/category'):
// type RootCategory = { id: number | string; cat_name: string; cat_image: string | null; ... };

/**
 * UTILITY FUNCTION FOR NEXT.JS BUILD (Server-side compatible)
 * Fetches all SUB CATEGORY IDs for generateStaticParams, using the public client.
 */
export const fetchAllSubCategoryIdsForStaticExport = async (): Promise<string[]> => {
    try {
        // HITTING THE NEW PUBLIC ENDPOINT
        const response = await publicClient.get<string[]>(SUB_CATEGORY_STATIC_EXPORT_ENDPOINT); 
        
        // The Laravel route returns a direct array of IDs
        const ids = Array.isArray(response.data) ? response.data : [];
            
        return ids.map(id => id.toString());
    } catch (error) {
        console.error('Failed to fetch Sub Category IDs for static export (Check API endpoint security):', error);
        return []; 
    }
}

/**
 * UTILITY FUNCTION FOR NEXT.JS BUILD (Server-side compatible)
 * Fetches all root category IDs for generateStaticParams, using the public client.
 */
export const fetchAllRootCategoryIdsForStaticExport = async (): Promise<string[]> => {
    try {
        const response = await publicClient.get<RootCategory[]>(`/categories`); 
        
        const ids = (response.data || [])
            .map(category => category.id ? category.id.toString() : null)
            .filter((id): id is string => id !== null);
            
        return ids;
    } catch (error) {
        console.error('Failed to fetch Root Category IDs for static export:', error);
        return []; 
    }
}


/**
 * Custom hook to encapsulate all Category API operations.
 */
export const useCategoryService = () => {
    const { token } = useAuth();
    const storagePrefix = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/storage/';

    // 1. STABLE getClient function 
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
    // REST OF HOOK FUNCTIONS (Unchanged)
    // ---------------------------------------------------------------------

    const fetchAllRootCategories = useCallback(async (): Promise<RootCategory[]> => {
        const api = getClient(false);
        try {
            const response = await api.get<RootCategory[]>(`/categories`); 
            return response.data || [];
        } catch (error: any) {
            console.error('API Error in fetchAllRootCategories:', error);
            try {
                const adminResponse = await api.get<RootCategoryIndexResponse>(ROOT_CATEGORY_API_ENDPOINT); 
                return adminResponse.data?.root_categories || [];
            } catch (adminError: any) {
                throw new Error(adminError.response?.data?.message || 'Failed to load nested categories.');
            }
        }
    }, [getClient]);
    
    const fetchAllSubCategories = useCallback(async (): Promise<SubCategory[]> => {
        const api = getClient(false);
        try {
            const response = await api.get<SubCategoryIndexResponse>(SUB_CATEGORY_API_ENDPOINT);
            return response.data?.sub_categories || [];
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to load sub category data from the API.');
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
    
    const fetchAllParentCategories = useCallback(async (): Promise<(RootCategory | SubCategory)[]> => {
        const [roots, subs] = await Promise.all([
            fetchAllRootCategories(), 
            fetchAllSubCategories() 
        ]);
        
        return [...roots, ...subs] as (RootCategory | SubCategory)[]; 
    }, [fetchAllRootCategories, fetchAllSubCategories]); 


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