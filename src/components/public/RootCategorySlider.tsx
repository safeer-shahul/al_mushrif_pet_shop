'use client';

import React, { useCallback } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react'; 
import { RootCategory } from '@/types/category';
import { useCategoryService } from '@/services/admin/categoryService';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';

interface RootCategorySliderProps {
    categories: RootCategory[]; 
    title?: string;
}

const PRIMARY_COLOR = 'var(--color-primary, #FF6B35)';

const RootCategorySlider: React.FC<RootCategorySliderProps> = ({ 
    categories, 
    title = "Shop by Top Categories" 
}) => {
    const { getStorageUrl } = useCategoryService();
    
    const sliderId = 'root-category-swiper';

    const getCategoryImageUrl = useCallback((category: RootCategory): string | null => {
        const imageUrl = category.cat_image || null;
        return getStorageUrl(imageUrl);
    }, [getStorageUrl]);
    
    const hasEnoughItemsForScrollButtons = categories.length > 6; 

    if (categories.length === 0) {
        return null;
    }

    return (
        <div className="py-4 space-y-4">
            
            <h3 className="text-2xl font-bold text-slate-800 border-b pb-2 border-gray-200">
                {title}
            </h3>

            {/* RELATIVE CONTAINER FOR NAVIGATION BUTTONS - Adjusted padding to account for button overlap */}
            <div className="relative px-4 lg:px-8 xl:px-14"> 
                
                {/* Scroll Buttons (Styled like OfferSlider) */}
                {hasEnoughItemsForScrollButtons && (
                    <>
                        {/* PREV Button */}
                        <button 
                            onClick={() => { /* Swiper's navigation controls this */ }}
                            className={`rcategory-swiper-prev-${sliderId} absolute -left-1 top-1/2 -translate-y-1/2 z-10 
                                /* 💡 MODIFIED: Removed 'hidden lg:flex', now it's always 'flex' */
                                flex items-center justify-center 
                                w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 
                                rounded-full bg-black/60 text-white hover:bg-black transition-colors shadow-lg`}
                            aria-label="Previous categories"
                        >
                            <ChevronLeft size={24} /> 
                        </button>
                        
                        {/* NEXT Button */}
                        <button 
                            onClick={() => { /* Swiper's navigation controls this */ }}
                            className={`rcategory-swiper-next-${sliderId} absolute -right-1 top-1/2 -translate-y-1/2 z-10 
                                /* 💡 MODIFIED: Removed 'hidden lg:flex', now it's always 'flex' */
                                flex items-center justify-center 
                                w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 
                                rounded-full bg-black/60 text-white hover:bg-black transition-colors shadow-lg`}
                            aria-label="Next categories"
                        >
                            <ChevronRight size={24} /> 
                        </button>
                    </>
                )}
                
                <Swiper
                    modules={[Navigation]}
                    spaceBetween={16}
                    slidesPerView={2}
                    watchOverflow={true} 
                    loop={categories.length > 6} 
                    
                    // Configure navigation selectors using the unique ID
                    navigation={{
                        prevEl: `.rcategory-swiper-prev-${sliderId}`,
                        nextEl: `.rcategory-swiper-next-${sliderId}`,
                        disabledClass: 'opacity-30 cursor-not-allowed',
                    }}
                    breakpoints={{
                        0: { slidesPerView: 2, spaceBetween: 10 },
                        640: { slidesPerView: 4, spaceBetween: 15 },
                        1024: { slidesPerView: 5, spaceBetween: 16 },
                        1280: { slidesPerView: 6, spaceBetween: 16 }
                    }}
                    className={`root-category-slider-swiper-${sliderId}`}
                >
                    
                    {categories.map(category => {
                        const imageUrl = getCategoryImageUrl(category);
                        
                        return (
                            <SwiperSlide key={category.id}>
                                <Link 
                                    href={`/products?category_id=${category.id}`}
                                    className="block w-full text-center hover:opacity-90 transition-opacity"
                                >
                                    {/* Category Image / Icon Container */}
                                    <div className="w-full aspect-square border-2 border-gray-100 rounded-full shadow-md hover:shadow-xl transition-shadow bg-white flex items-center justify-center mb-3 overflow-hidden">
                                        
                                        {/* 💡 REVERTED TO STANDARD HTML IMG TAG */}
                                        {imageUrl ? (
                                            // The image container div must be positioned correctly for the image to fill it
                                            <div className="w-full h-full p-0.5">
                                                <img 
                                                    src={imageUrl} 
                                                    alt={category.cat_name} 
                                                    // Ensures the image fills the circular container
                                                    className="w-full h-full object-cover rounded-full" 
                                                />
                                            </div>
                                        ) : (
                                            // Fallback Icon
                                            <ImageIcon 
                                                className="w-1/3 h-1/3 text-gray-400" 
                                                aria-hidden="true" 
                                                role="img"
                                            />
                                        )}
                                    </div>
                                    {/* Category Name */}
                                    <span className="text-sm font-bold text-slate-700 line-clamp-2 hover:text-slate-900">
                                        {category.cat_name}
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

export default RootCategorySlider;