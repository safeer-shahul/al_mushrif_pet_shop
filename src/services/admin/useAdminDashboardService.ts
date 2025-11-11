// src/services/admin/useAdminDashboardService.ts

import { useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { createAuthenticatedClient } from '@/utils/ApiClient';
import { DashboardStats } from '@/types/dashboard'; // Import new types

const ADMIN_DASHBOARD_API_ENDPOINT = '/admin/dashboard/stats';

/**
 * Custom hook for Admin Dashboard API operations.
 */
export const useAdminDashboardService = () => {
    const { token } = useAuth();

    const getClient = useCallback(() => {
        if (!token) {
            throw new Error("Authentication token missing for admin dashboard access.");
        }
        // Use the function from ApiClient.ts to create a configured client
        return createAuthenticatedClient(token); 
    }, [token]);

    /**
     * Fetches key statistics and recent activity for the admin dashboard.
     */
    const fetchDashboardStats = useCallback(async (): Promise<DashboardStats> => {
        const api = getClient();
        try {
            const response = await api.get<DashboardStats>(ADMIN_DASHBOARD_API_ENDPOINT);
            return response.data;
        } catch (error: any) {
            // Provide informative error handling
            const message = error.response?.data?.message || 'Failed to load dashboard statistics.';
            console.error('API Error fetching dashboard stats:', error);
            throw new Error(message);
        }
    }, [getClient]);

    return {
        fetchDashboardStats,
    };
};