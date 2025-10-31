'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { FaChevronLeft, FaChevronRight, FaImage } from 'react-icons/fa';
import { Brand } from '@/types/brand';
import { usePublicBrandService } from '@/services/public/brandService';
import { useCategoryService } from '@/services/admin/categoryService'; // Used for getStorageUrl utility
import LoadingSpinner from '../ui/LoadingSpinner';

// Swiper imports
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
// NOTE: Assuming 'swiper/css' and 'swiper/css/navigation' are imported globally or in parent components

const BrandSlider: React.FC = () => {
    const { fetchAllPublicBrands } = usePublicBrandService();
    const { getStorageUrl } = useCategoryService(); // Reusing the storage utility
    
    const [brands, setBrands] = useState<Brand[]>([]);
    const [loading, setLoading] = useState(true);

    const sliderId = 'brand-logo-slider';

    const loadBrands = useCallback(async () => {
        setLoading(true);
        try {
            const fetchedBrands = await fetchAllPublicBrands();
            // Filter to ensure only active brands with names and valid logos are shown, then sort alphabetically
            const activeBrands = fetchedBrands
                .filter(b => b.is_active && b.brand_name && b.brand_logo)
                .sort((a, b) => a.brand_name.localeCompare(b.brand_name));
                
            setBrands(activeBrands);
        } catch (error) {
            console.error('Error loading brands:', error);
            setBrands([]);
        } finally {
            setLoading(false);
        }
    }, [fetchAllPublicBrands]);

    useEffect(() => {
        loadBrands();
    }, [loadBrands]);

    if (loading) {
        return <div className="py-8"><LoadingSpinner /></div>;
    }
    
    if (brands.length === 0) {
        return null;
    }

    // Determine if navigation buttons should be shown. Show if total items > the largest visible count (6).
    const hasEnoughItemsToScroll = brands.length > 6; 

    return (
        <div className="py-8 space-y-4">
            
            <h3 className="text-2xl font-bold text-slate-800 border-b pb-2 border-gray-200">
                Explore Top Brands
            </h3>

            <div className="relative">
                
                {/* Scroll Buttons (Desktop only) */}
                {hasEnoughItemsToScroll && (
                    <>
                        <button 
                            className={`brand-swiper-prev-${sliderId} absolute -left-4 top-1/2 transform -translate-y-1/2 p-2 bg-white rounded-full shadow-md z-10 hover:bg-gray-100 hidden lg:block disabled:opacity-50 disabled:cursor-not-allowed`}
                            aria-label="Previous brands"
                        >
                            <FaChevronLeft className="w-4 h-4" />
                        </button>
                        <button 
                            className={`brand-swiper-next-${sliderId} absolute -right-4 top-1/2 transform -translate-y-1/2 p-2 bg-white rounded-full shadow-md z-10 hover:bg-gray-100 hidden lg:block disabled:opacity-50 disabled:cursor-not-allowed`}
                            aria-label="Next brands"
                        >
                            <FaChevronRight className="w-4 h-4" />
                        </button>
                    </>
                )}
                
                <Swiper
                    modules={[Navigation]}
                    spaceBetween={16} // Gap between slides
                    slidesPerView={3} // Default slides visible (Mobile)
                    watchOverflow={true} 
                    // Configure navigation selectors using the unique ID
                    navigation={{
                        prevEl: `.brand-swiper-prev-${sliderId}`,
                        nextEl: `.brand-swiper-next-${sliderId}`,
                        disabledClass: 'opacity-50 cursor-not-allowed',
                    }}
                    breakpoints={{
                        0: {
                            slidesPerView: 3, // Mobile: 3 slides
                            spaceBetween: 10,
                        },
                        640: {
                            slidesPerView: 4, // Tablet: 4 slides
                            spaceBetween: 15,
                        },
                        1024: {
                            slidesPerView: 5, // Large Tablet/Small PC: 5 slides
                            spaceBetween: 16,
                        },
                        1280: {
                            slidesPerView: 6, // PC/XL: 6 slides
                            spaceBetween: 16,
                        }
                    }}
                    className={`brand-slider-swiper-${sliderId}`}
                >
                    
                    {brands.map(brand => {
                        const imageUrl = getStorageUrl(brand.brand_logo);
                        
                        return (
                            // Use flex-shrink-0 and w-full inside the slide 
                            <SwiperSlide key={brand.brand_id}>
                                <Link 
                                    // Link to a product listing filtered by this brand ID
                                    href={`/products?brand_id=${brand.brand_id}`}
                                    title={brand.brand_name}
                                    className="block w-full text-center hover:shadow-lg transition-shadow duration-300 rounded-lg p-2 bg-white"
                                >
                                    {/* Brand Logo Container (Ensures square aspect ratio) */}
                                    <div className="w-full aspect-square border border-gray-100 rounded-md bg-white flex items-center justify-center mb-1 overflow-hidden p-3">
                                        {imageUrl ? (
                                            <img 
                                                src={imageUrl} 
                                                alt={`${brand.brand_name} Logo`} 
                                                // Ensure the logo fits within the container without distortion
                                                className="w-full h-full object-contain" 
                                            />
                                        ) : (
                                            <FaImage className="w-1/3 h-1/3 text-gray-300" />
                                        )}
                                    </div>
                                    {/* Brand Name */}
                                    <span className="text-xs font-medium text-slate-700 line-clamp-1">
                                        {brand.brand_name}
                                    </span>
                                </Link>
                            </SwiperSlide>
                        );
                    })}
                </Swiper>
            </div>
        </div>
    );
};

export default BrandSlider;
