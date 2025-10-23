// src/services/public/contentService.ts

import { publicClient } from '@/utils/ApiClient';
import { HeroSection, HomeSection, Marquee } from '@/types/content'; 
import { useCallback } from 'react';

// --- PUBLIC API ENDPOINTS (Corresponding to routes/api.php definitions) ---
const HERO_SECTIONS_ENDPOINT = '/hero-sections';
const HOME_SECTIONS_ENDPOINT = '/home-sections';
const MARQUEE_ENDPOINT = '/content/marquee';

/**
 * Custom hook for fetching all public-facing, read-only content.
 * This hook uses the publicClient and does NOT require an authentication token.
 */
export const usePublicContentService = () => {

    // ---------------------------------------------------------------------
    // 1. PUBLIC HERO SECTIONS (BANNERS) READ
    // ---------------------------------------------------------------------

    /**
     * Fetches all active Hero Sections for the main storefront.
     * Hits: GET /api/hero-sections
     */
    const fetchPublicHeroSections = useCallback(async (): Promise<HeroSection[]> => {
        try {
            const response = await publicClient.get<HeroSection[]>(HERO_SECTIONS_ENDPOINT);
            return response.data;
        } catch (error: any) {
            console.error('Error fetching public hero sections:', error);
            throw new Error(error.response?.data?.message || 'Failed to load hero sections.');
        }
    }, []);

    // ---------------------------------------------------------------------
    // 2. PUBLIC HOME SECTIONS (PRODUCT GRIDS) READ
    // ---------------------------------------------------------------------

    /**
     * Fetches all active Home Sections (product grids) for the main storefront.
     * Hits: GET /api/home-sections
     */
    const fetchPublicHomeSections = useCallback(async (): Promise<HomeSection[]> => {
        try {
            // This call targets the specific public route that was causing the 404 earlier.
            const response = await publicClient.get<HomeSection[]>(HOME_SECTIONS_ENDPOINT);
            return response.data;
        } catch (error: any) {
            console.error('Error fetching public home sections:', error);
            throw new Error(error.response?.data?.message || 'Failed to load home sections.');
        }
    }, []);

    // ---------------------------------------------------------------------
    // 3. PUBLIC MARQUEE CONTENT READ
    // ---------------------------------------------------------------------

    /**
     * Fetches the active Marquee content.
     * Hits: GET /api/content/marquee
     */
    const fetchPublicMarquee = useCallback(async (): Promise<Marquee> => {
        try {
            const response = await publicClient.get<Marquee>(MARQUEE_ENDPOINT);
            return response.data;
        } catch (error: any) {
            console.error('Error fetching public marquee content:', error);
            // Marquee is often a single item, handle 404 as "not available"
            if (error.response?.status === 404) {
                 throw new Error('Marquee content not currently available.');
            }
            throw new Error(error.response?.data?.message || 'Failed to load marquee content.');
        }
    }, []);


    return {
        fetchPublicHeroSections,
        fetchPublicHomeSections,
        fetchPublicMarquee,
    };
};