'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ChevronRight as AngleRight } from 'lucide-react';
import { Product } from '@/types/product';
import { usePublicProductService } from '@/services/public/productService'; 
import ProductCard from './products/ProductCard'; // Assuming path
import LoadingSpinner from '../ui/LoadingSpinner';

// Swiper imports
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
// NOTE: We assume Swiper CSS files are available from the parent context

const LATEST_PRODUCT_COUNT = 20;
const LATEST_SECTION_TITLE = 'New Arrivals';

const NewArrivalsSlider: React.FC = () => {
    const { fetchProducts } = usePublicProductService();
    
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [swiperInstance, setSwiperInstance] = useState<any>(null);

    const sliderId = 'new-arrivals-slider';

    const loadNewArrivals = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch the latest products
            const response = await fetchProducts({
                // Assuming 'updated_at_desc' is the correct sort field for latest products
                sort: 'updated_at_desc', 
                page: 1,
                per_page: LATEST_PRODUCT_COUNT,
            });

            // Using response.data which holds the Product[] array
            setProducts(response.data.slice(0, LATEST_PRODUCT_COUNT));
        } catch (error) {
            console.error('Failed to load new arrivals:', error);
            setProducts([]);
        } finally {
            setLoading(false);
        }
    }, [fetchProducts]);

    useEffect(() => {
        loadNewArrivals();
    }, [loadNewArrivals]);

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

    if (loading) {
        return <div className="py-8 px-4 lg:px-0"><LoadingSpinner /></div>;
    }
    
    if (products.length === 0) {
        return null;
    }

    // Navigation logic: show if more products than mobile visible count (2)
    const showNavigation = products.length > 2;

    return (
        <section className="space-y-4 mb-10 px-4 lg:px-8 xl:px-14">
            
            {/* Header: Customized for New Arrivals */}
            <header className="flex justify-between items-center pb-2 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-slate-800">
                    {LATEST_SECTION_TITLE}
                </h2>
                {/* Link to a dynamic product page sorted by latest */}
                <Link 
                    href="/products?sort=updated_at_desc"
                    className="text-sm font-medium hover:text-blue-600 flex items-center text-blue-600"
                >
                    View All <AngleRight className="ml-1 w-3 h-3" />
                </Link>
            </header>
            
            <div className="relative"> 
                
                {/* Navigation Buttons (desktop only) */}
                {showNavigation && (
                    <>
                        <button 
                            onClick={goPrev}
                            className={`section-swiper-prev-${sliderId} absolute -left-4 top-1/2 transform -translate-y-1/2 p-2 bg-white rounded-full shadow-lg z-10 hover:bg-gray-100 hidden lg:flex`}
                            aria-label="Previous products"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={goNext}
                            className={`section-swiper-next-${sliderId} absolute -right-4 top-1/2 transform -translate-y-1/2 p-2 bg-white rounded-full shadow-lg z-10 hover:bg-gray-100 hidden lg:flex`}
                            aria-label="Next products"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </>
                )}
                
                {/* Swiper Implementation */}
                <Swiper
                    spaceBetween={16} 
                    slidesPerView={2} 
                    slidesPerGroup={1}
                    loop={products.length > 5} 
                    modules={[Navigation]}
                    navigation={{
                        prevEl: `.section-swiper-prev-${sliderId}`,
                        nextEl: `.section-swiper-next-${sliderId}`,
                        enabled: showNavigation,
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

export default NewArrivalsSlider;
