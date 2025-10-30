// src/components/public/HomeSectionSlider.tsx
'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Tag, ChevronRight as AngleRight } from 'lucide-react';
import { HomeSection } from '@/types/content';
import { Product } from '@/types/product';
import ProductCard from '@/components/public/products/ProductCard'; 

// Swiper imports
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';

interface HomeSectionSliderProps {
    section: HomeSection;
    products: Product[];
}

const HomeSectionSlider: React.FC<HomeSectionSliderProps> = ({ section, products }) => {
    const [swiperInstance, setSwiperInstance] = useState<any>(null);
    
    const sliderId = `section-swiper-${section.title.toLowerCase().replace(/\s/g, '-')}`;

    const goNext = useCallback(() => {
        if (swiperInstance) {
            swiperInstance.slideNext();
        }
    }, [swiperInstance]);

    const goPrev = useCallback(() => {
        if (swiperInstance) {
            swiperInstance.slidePrev();
        }
    }, [swiperInstance]);

    if (products.length === 0) {
        return null;
    }
    
    const targetHref = section.offer_id ? `/products?offer_id=${section.offer_id}` : '/products';
    
    // Determine if navigation buttons should be shown: show if there are more products than the mobile visible count (2).
    const showNavigationBasedOnContent = products.length > 2;

    return (
        <section className="space-y-4 mb-10 px-4 lg:px-0">
            
            <header className="flex justify-between items-center pb-2 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center">
                    {section.offer_id && <Tag className="mr-2 text-red-600 w-5 h-5" />}
                    {section.title}
                </h2>
                <Link 
                    href={targetHref}
                    className="text-sm font-medium hover:text-blue-600 flex items-center text-blue-600"
                >
                    View All <AngleRight className="ml-1 w-3 h-3" />
                </Link>
            </header>
            
            <div className="relative"> 
                {/* Navigation Buttons - REVISED TO BE VISIBLE ON ALL SCREENS, but small on mobile */}
                {showNavigationBasedOnContent && (
                    <>
                        <button 
                            onClick={goPrev}
                            // REMOVED 'hidden lg:flex' and adjusted size/positioning for small screens
                            className={`section-swiper-prev-${sliderId} absolute -left-1 sm:-left-4 top-1/2 transform -translate-y-1/2 p-1 sm:p-2 bg-white rounded-full shadow-md z-10 hover:bg-gray-100 flex`}
                            aria-label={`Previous ${section.title} products`}
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={goNext}
                            // REMOVED 'hidden lg:flex' and adjusted size/positioning for small screens
                            className={`section-swiper-next-${sliderId} absolute -right-1 sm:-right-4 top-1/2 transform -translate-y-1/2 p-1 sm:p-2 bg-white rounded-full shadow-md z-10 hover:bg-gray-100 flex`}
                            aria-label={`Next ${section.title} products`}
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </>
                )}
                
                <Swiper
                    spaceBetween={16}
                    slidesPerView={2}
                    slidesPerGroup={1}
                    loop={products.length > 4}
                    modules={[Navigation]}
                    navigation={{
                        prevEl: `.section-swiper-prev-${sliderId}`,
                        nextEl: `.section-swiper-next-${sliderId}`,
                        enabled: showNavigationBasedOnContent,
                    }}
                    watchOverflow={true}
                    observer={true}
                    observeParents={true}
                    onSwiper={(swiper) => setSwiperInstance(swiper)}
                    className={`home-section-swiper-${sliderId}`}
                    breakpoints={{
                        0: {
                            slidesPerView: 2,
                            spaceBetween: 10,
                        },
                        640: {
                            slidesPerView: 3,
                            spaceBetween: 15,
                        },
                        1024: {
                            slidesPerView: 4,
                            spaceBetween: 20,
                        },
                        1280: {
                            slidesPerView: 5,
                            spaceBetween: 25,
                        }
                    }}
                >
                    {products.map(product => (
                        <SwiperSlide key={product.id}>
                            <ProductCard product={product} /> 
                        </SwiperSlide>
                    ))}
                </Swiper>
            </div>
        </section>
    );
};

export default HomeSectionSlider;