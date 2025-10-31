// src/components/public/HeroSection.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { HeroSection } from '@/types/content';
import { useCategoryService } from '@/services/admin/categoryService'; 
import { usePublicContentService } from '@/services/public/contentService';
// Removed Chevron imports as arrows are no longer needed
// import { ChevronLeft, ChevronRight } from 'lucide-react'; 

// Swiper imports
import { Swiper, SwiperSlide } from 'swiper/react';
// Removed Navigation, only keeping Autoplay and Pagination
import { Autoplay, Pagination } from 'swiper/modules'; 
import 'swiper/css';
// Removed navigation CSS
import 'swiper/css/pagination'; // Keep pagination styles


/**
 * Displays a single Hero Banner, rotating through all active banners using Swiper.js.
 * It features Auto-Play and Pagination (dots) but no manual navigation arrows.
 */
const HeroSectionComponent: React.FC = () => {
    const [activeBanners, setActiveBanners] = useState<HeroSection[]>([]);
    const [loading, setLoading] = useState(true);
    
    const { getStorageUrl } = useCategoryService(); 
    const { fetchPublicHeroSections } = usePublicContentService();
    
    // Unique ID for pagination
    const sliderId = 'hero-banner-swiper';

    const fetchBanners = useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchPublicHeroSections();
            const activeData = data.filter(b => b.is_active).sort((a, b) => a.order_sequence - b.order_sequence);
            const validBanners = activeData.filter(b => b.pc_image); 
            
            setActiveBanners(validBanners);
        } catch (error) {
            console.error('Error fetching banners:', error);
            setActiveBanners([]);
        } finally {
            setLoading(false);
        }
    }, [fetchPublicHeroSections]);

    useEffect(() => {
        fetchBanners();
    }, [fetchBanners]);

    if (loading) {
        return <div className="sm:h-96 w-full flex items-center justify-center bg-gray-50">Loading Banners...</div>;
    }
    
    if (activeBanners.length === 0) {
        return null;
    }

    const hasMultipleBanners = activeBanners.length > 1;

    return (
        <div className="relative w-full overflow-hidden bg-gray-100 shadow-lg">
            <Swiper
                id={sliderId}
                spaceBetween={0}
                slidesPerView={1}
                loop={hasMultipleBanners}
                autoplay={hasMultipleBanners ? {
                    delay: 5000,
                    disableOnInteraction: false,
                    pauseOnMouseEnter: true,
                } : false}
                // --- Pagination Configuration ---
                pagination={hasMultipleBanners ? {
                    el: `.hero-swiper-pagination-${sliderId}`,
                    clickable: true,
                    // Use CSS classes compatible with Tailwind for the bullets
                    bulletActiveClass: 'bg-white',
                    bulletClass: 'bg-white/50 w-3 h-3 rounded-full mx-1 transition-colors inline-block cursor-pointer',
                    modifierClass: 'swiper-pagination-custom-' // To allow custom styling if needed
                } : false}
                modules={[Autoplay, Pagination]} // Only Autoplay and Pagination
                watchOverflow={true}
                observer={true}
                observeParents={true}
                className={`hero-swiper-${sliderId}`}
            >
                {activeBanners.map((banner) => {
                    const pcImageUrl = getStorageUrl(banner.pc_image); 
                    const mobileImageUrl = getStorageUrl(banner.mobile_image); 
                    const linkHref = banner.slug || (banner.offer_id ? `/offers?offer_id=${banner.offer_id}` : '#');

                    return (
                        <SwiperSlide key={banner.id}>
                            <Link href={linkHref} className="block w-full">
                                <div className="h-96 md:h-64 lg:h-96 flex items-center justify-center">
                                    
                                    {/* PC/Desktop Image (Visible on MD and up) */}
                                    {pcImageUrl && (
                                        <img 
                                            src={pcImageUrl} 
                                            alt={`Hero Banner ${banner.id} Desktop`} 
                                            className="w-full h-full object-cover transition-opacity duration-500 hidden md:block"
                                        />
                                    )}
                                    
                                    {/* Mobile Image (Visible below MD) */}
                                    {(mobileImageUrl || pcImageUrl) && (
                                        <img 
                                            src={mobileImageUrl || pcImageUrl || ''} 
                                            alt={`Hero Banner ${banner.id} Mobile`} 
                                            className="w-full h-full object-cover transition-opacity duration-500 block md:hidden"
                                        />
                                    )}
                                    
                                    {/* Fallback */}
                                    {(!pcImageUrl && !mobileImageUrl) && (
                                        <div className="text-xl text-gray-500">Banner Image Missing</div>
                                    )}
                                </div>
                            </Link>
                        </SwiperSlide>
                    );
                })}
                
                {/* Manual Navigation Controls (REMOVED) */}
                
            </Swiper>
            
            {/* Indicators Container (This is where Swiper injects the dots) */}
            {hasMultipleBanners && (
                <div 
                    className={`hero-swiper-pagination-${sliderId} absolute bottom-4 left-0 right-0 flex justify-center z-10`}
                >
                    {/* Swiper automatically populates this div with dots */}
                </div>
            )}
        </div>
    );
};

export default HeroSectionComponent;