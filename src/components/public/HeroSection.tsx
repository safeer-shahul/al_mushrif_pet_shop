// src/components/public/HeroSection.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { HeroSection } from '@/types/content';
// We still need useCategoryService for the getStorageUrl utility
import { useCategoryService } from '@/services/admin/categoryService'; 
// 💡 NEW: Import the public content service hook
import { usePublicContentService } from '@/services/public/contentService';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

/**
 * Displays a single Hero Banner, rotating through all active banners.
 * NOTE: This is a simplified carousel placeholder.
 */
const HeroSectionComponent: React.FC = () => {
    const [activeBanners, setActiveBanners] = useState<HeroSection[]>([]);
    const [activeIndex, setActiveIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    
    // Access the utility function for resolving image URLs
    const { getStorageUrl } = useCategoryService(); 
    
    // 💡 NEW: Use the content service for fetching data
    const { fetchPublicHeroSections } = usePublicContentService();

    // 1. Fetch active banners (public API via the service wrapper)
    const fetchBanners = useCallback(async () => {
        setLoading(true);
        try {
            // 💡 FIX: Use the service method to fetch all hero sections
            const data = await fetchPublicHeroSections();
            
            // NOTE: The backend API /api/hero-sections in CatalogController 
            // is designed to return *all* sections for simplicity.
            // We rely on that endpoint returning the structured data correctly.
            
            // Filter to only active and sort by order_sequence
            const activeData = data.filter(b => b.is_active).sort((a, b) => a.order_sequence - b.order_sequence);
            setActiveBanners(activeData);
        } catch (error) {
            console.error('Error fetching banners:', error);
            setActiveBanners([]);
        } finally {
            setLoading(false);
        }
    }, [fetchPublicHeroSections]); // Dependency on the imported service function

    useEffect(() => {
        fetchBanners();
    }, [fetchBanners]);

    // 2. Auto-rotate effect
    useEffect(() => {
        if (activeBanners.length <= 1) return;
        const timer = setInterval(() => {
            setActiveIndex(prev => (prev + 1) % activeBanners.length);
        }, 5000); // Change banner every 5 seconds
        return () => clearInterval(timer);
    }, [activeBanners]);

    if (loading) {
        return <div className="h-96 w-full flex items-center justify-center bg-gray-50">Loading Banners...</div>;
    }
    
    if (activeBanners.length === 0) {
        return null;
    }
    
    const currentBanner = activeBanners[activeIndex];
    
    // 💡 FIX: Use getStorageUrl for resolving the image path
    const imageUrl = getStorageUrl(currentBanner.image); 
    
    // Determine the link target
    const linkHref = currentBanner.slug || (currentBanner.offer_id ? `/offers?offer_id=${currentBanner.offer_id}` : '#');
    

    return (
        <div className="relative w-full overflow-hidden bg-gray-100 shadow-lg">
            <Link href={linkHref} className="block">
                <div className="h-96 flex items-center justify-center">
                    {imageUrl ? (
                        <img 
                            // Use the resolved URL
                            src={imageUrl} 
                            alt={`Hero Banner ${currentBanner.id}`} 
                            className="w-full h-full object-cover transition-opacity duration-500"
                        />
                    ) : (
                        <div className="text-xl text-gray-500">Banner Image Missing</div>
                    )}
                </div>
            </Link>
            
            {/* Navigation Controls (If multiple banners exist) */}
            {activeBanners.length > 1 && (
                <>
                    <button 
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 p-3 bg-black/30 text-white rounded-full hover:bg-black/50 transition-colors"
                        onClick={(e) => { e.preventDefault(); setActiveIndex(prev => (prev - 1 + activeBanners.length) % activeBanners.length); }}
                    >
                        <FaChevronLeft />
                    </button>
                    <button 
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 p-3 bg-black/30 text-white rounded-full hover:bg-black/50 transition-colors"
                        onClick={(e) => { e.preventDefault(); setActiveIndex(prev => (prev + 1) % activeBanners.length); }}
                    >
                        <FaChevronRight />
                    </button>
                </>
            )}
            
            {/* Indicators */}
            <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
                {activeBanners.map((_, index) => (
                    <div 
                        key={index}
                        className={`w-3 h-3 rounded-full cursor-pointer transition-colors ${index === activeIndex ? 'bg-white' : 'bg-white/50 hover:bg-white/80'}`}
                        onClick={() => setActiveIndex(index)}
                    ></div>
                ))}
            </div>
        </div>
    );
};

export default HeroSectionComponent;