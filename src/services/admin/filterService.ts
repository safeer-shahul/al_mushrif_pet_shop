// src/services/admin/filterService.ts
import { useAuth } from '@/context/AuthContext';
import { getCsrfToken, createAuthenticatedClient, publicClient } from '@/utils/ApiClient';
import { FilterType, FilterItem, FilterTypeIndexResponse } from '@/types/filter';
import { useCallback } from 'react';

const FILTER_TYPE_API_ENDPOINT = '/admin/filters/types';
const FILTER_ITEM_BASE_API_ENDPOINT = '/admin/filters/types'; // Used for nested routes

/**
 * Custom hook to encapsulate all Filter API operations.
 */
export const useFilterService = () => {
    const { token } = useAuth();

    const getClient = useCallback(() => {
        if (token) {
            // Note: No file upload is needed for Filters, so omitContentType is false/omitted
            return createAuthenticatedClient(token); 
        }
        return publicClient; 
    }, [token]);


    // =================================================================
    // FILTER TYPE OPERATIONS (e.g., Size)
    // =================================================================

    const fetchAllFilterTypes = useCallback(async (): Promise<FilterType[]> => {
        const api = getClient();
        try {
            // API: GET /admin/filters/types
            const response = await api.get<FilterTypeIndexResponse>(FILTER_TYPE_API_ENDPOINT); 
            return response.data;
        } catch (error: any) {
            console.error('API Error in fetchAllFilterTypes:', error);
            throw new Error(error.response?.data?.message || 'Failed to load filter types.');
        }
    }, [getClient]);
    
    const createFilterType = useCallback(async (filter_type_name: string) => {
        const api = getClient();
        try {
            await getCsrfToken();
            // API: POST /admin/filters/types
            const response = await api.post(FILTER_TYPE_API_ENDPOINT, { filter_type_name }); 
            return response.data; // { message: '...', type: FilterType }
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to create filter type.');
        }
    }, [getClient]);

    const updateFilterType = useCallback(async (id: string, filter_type_name: string) => {
        const api = getClient();
        try {
            await getCsrfToken();
            // API: PUT /admin/filters/types/{id}
            const response = await api.put(`${FILTER_TYPE_API_ENDPOINT}/${id}`, { filter_type_name }); 
            return response.data; // { message: '...', type: FilterType }
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to update filter type.');
        }
    }, [getClient]);

    const deleteFilterType = useCallback(async (id: string) => {
        const api = getClient();
        try {
            await getCsrfToken();
            // API: DELETE /admin/filters/types/{id}
            const response = await api.delete(`${FILTER_TYPE_API_ENDPOINT}/${id}`);
            return response.data; // { message: '...' }
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to delete filter type.');
        }
    }, [getClient]);


    // =================================================================
    // FILTER ITEM OPERATIONS (e.g., Small)
    // =================================================================

    const createFilterItem = useCallback(async (typeId: string, filter_name: string) => {
        const api = getClient();
        try {
            await getCsrfToken();
            // API: POST /admin/filters/types/{typeId}/items
            const response = await api.post(`${FILTER_ITEM_BASE_API_ENDPOINT}/${typeId}/items`, { filter_name }); 
            return response.data; // { message: '...', item: FilterItem }
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to create filter item.');
        }
    }, [getClient]);

    const updateFilterItem = useCallback(async (typeId: string, itemId: string, filter_name: string) => {
        const api = getClient();
        try {
            await getCsrfToken();
            // API: PUT /admin/filters/types/{typeId}/items/{itemId}
            const response = await api.put(`${FILTER_ITEM_BASE_API_ENDPOINT}/${typeId}/items/${itemId}`, { filter_name }); 
            return response.data; // { message: '...', item: FilterItem }
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to update filter item.');
        }
    }, [getClient]);
    
    const deleteFilterItem = useCallback(async (typeId: string, itemId: string) => {
        const api = getClient();
        try {
            await getCsrfToken();
            // API: DELETE /admin/filters/types/{typeId}/items/{itemId}
            const response = await api.delete(`${FILTER_ITEM_BASE_API_ENDPOINT}/${typeId}/items/${itemId}`);
            return response.data; // { message: '...' }
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to delete filter item.');
        }
    }, [getClient]);


    return {
        fetchAllFilterTypes,
        createFilterType,
        updateFilterType,
        deleteFilterType,
        
        createFilterItem,
        updateFilterItem,
        deleteFilterItem,
    };
};