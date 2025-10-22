// src/services/admin/marqueeService.ts

import { useAuth } from '@/context/AuthContext';
import { getCsrfToken, createAuthenticatedClient, publicClient } from '@/utils/ApiClient';
import { Marquee } from '@/types/content'; // Import the new Marquee type
import { useCallback } from 'react';

const MARQUEE_ADMIN_ENDPOINT = '/admin/content/marquee';

interface AdminMarqueeResponse {
    message: string;
    marquee: Marquee;
}

/**
 * Custom hook to encapsulate all Marquee API operations (Admin CRUD and Public Fetch).
 */
export const useMarqueeService = () => {
    const { token } = useAuth();

    // Utility to get the authenticated client for admin actions
    const getAdminClient = useCallback(() => {
        if (token) {
            return createAuthenticatedClient(token); 
        }
        throw new Error("Authentication token missing for admin operation.");
    }, [token]);

    // ---------------------------------------------------------------------
    // ADMIN CRUD OPERATIONS
    // ---------------------------------------------------------------------

    const fetchAllMarquees = useCallback(async (): Promise<Marquee[]> => {
        const api = getAdminClient();
        try {
            const response = await api.get<Marquee[]>(MARQUEE_ADMIN_ENDPOINT);
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to load marquee content.');
        }
    }, [getAdminClient]);
    
    const createMarquee = useCallback(async (content: string, is_active: boolean) => {
        const api = getAdminClient();
        try {
            await getCsrfToken();
            const response = await api.post<AdminMarqueeResponse>(MARQUEE_ADMIN_ENDPOINT, { 
                content, 
                is_active: is_active ? 1 : 0 
            });
            return response.data;
        } catch (error: any) {
            const msg = error.response?.data?.errors?.content?.[0] || error.response?.data?.message || 'Failed to create marquee.';
            throw new Error(msg);
        }
    }, [getAdminClient]);

    const updateMarquee = useCallback(async (id: string, content: string, is_active: boolean) => {
        const api = getAdminClient();
        try {
            await getCsrfToken();
            const response = await api.put<AdminMarqueeResponse>(`${MARQUEE_ADMIN_ENDPOINT}/${id}`, { 
                content, 
                is_active: is_active ? 1 : 0 
            });
            return response.data;
        } catch (error: any) {
            const msg = error.response?.data?.errors?.content?.[0] || error.response?.data?.message || 'Failed to update marquee.';
            throw new Error(msg);
        }
    }, [getAdminClient]);

    const deleteMarquee = useCallback(async (id: string) => {
        const api = getAdminClient();
        try {
            await getCsrfToken();
            const response = await api.delete(`${MARQUEE_ADMIN_ENDPOINT}/${id}`);
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to delete marquee.');
        }
    }, [getAdminClient]);

    // ---------------------------------------------------------------------
    // PUBLIC ACCESS (No Auth)
    // ---------------------------------------------------------------------

    const fetchActiveMarquee = useCallback(async (): Promise<Marquee | null> => {
        try {
            const response = await publicClient.get<Marquee>('/content/marquee'); 
            
            // Check for 204 No Content response
            if (response.status === 204 || !response.data) {
                return null;
            }
            return response.data;
        } catch (error: any) {
            console.warn('Failed to fetch active marquee (non-critical error):', error.message);
            return null;
        }
    }, []);

    return {
        fetchAllMarquees,
        createMarquee,
        updateMarquee,
        deleteMarquee,
        fetchActiveMarquee,
    };
};