// src/components/public/OfferSlider.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Offer } from '@/types/offer'; 
import { usePublicOfferService } from '@/services/public/offerService'; 
import { useCategoryService } from '@/services/admin/categoryService';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

// Swiper imports
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay } from 'swiper/modules';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/autoplay';

/**
 * OfferSlider Component: Displays active offers with images in a responsive slider.
 * Displays 5 items on large screen, 2 items on mobile. Images are square.
 */
const OfferSlider: React.FC = () => {
    const { fetchPublicOfferBanners } = usePublicOfferService(); 
    const { getStorageUrl } = useCategoryService();
    
    const [offers, setOffers] = useState<Offer[]>([]);
    const [loading, setLoading] = useState(true);
    const [swiperInstance, setSwiperInstance] = useState<any>(null);

    const sliderId = 'offer-swiper';

    const loadOffers = useCallback(async () => {
        setLoading(true);
        try {
            const fetchedOffers = await fetchPublicOfferBanners(); 
            setOffers(fetchedOffers); 
        } catch (error) {
            console.error('Failed to load offers:', error);
            setOffers([]);
        } finally {
            setLoading(false);
        }
    }, [fetchPublicOfferBanners]);

    useEffect(() => {
        loadOffers();
    }, [loadOffers]);

    // Handlers for manual navigation
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
        return <div className="h-40 w-full flex items-center justify-center bg-gray-50"><LoadingSpinner /></div>;
    }
    
    if (offers.length === 0) {
        return null;
    }

    // Show navigation if there are more items than the smallest visible count (2)
    const showNavigation = offers.length > 2; 

    return (
        <section className="space-y-4 mb-10 px-4 lg:px-8 xl:px-14">
            <header className="flex justify-between items-center pb-2 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-slate-800">
                    Offers for You
                </h2>
            </header>

            <div className="relative">
                <Swiper
                    spaceBetween={16}
                    slidesPerView={2} // Default for mobile
                    slidesPerGroup={1}
                    loop={offers.length > 5}
                    autoplay={{
                        delay: 4500,
                        disableOnInteraction: false
                    }}
                    modules={[Autoplay, Navigation]}
                    navigation={{
                        prevEl: `.offer-swiper-prev-${sliderId}`,
                        nextEl: `.offer-swiper-next-${sliderId}`,
                        enabled: showNavigation,
                    }}
                    watchOverflow={true}
                    observer={true}
                    observeParents={true}
                    onSwiper={(swiper) => setSwiperInstance(swiper)}
                    className={`offer-swiper-${sliderId}`}
                    breakpoints={{
                        0: {
                            slidesPerView: 2, // Mobile: 2 visible
                            spaceBetween: 10,
                        },
                        640: {
                            slidesPerView: 3,
                            spaceBetween: 15,
                        },
                        768: {
                            slidesPerView: 4,
                            spaceBetween: 15,
                        },
                        1024: {
                            slidesPerView: 5, // PC: 5 visible
                            spaceBetween: 20,
                        },
                        1280: {
                            slidesPerView: 5, // PC: 5 visible
                            spaceBetween: 20,
                        }
                    }}
                >
                    {offers.map((offer) => {
                        const linkHref = `/products?offer_id=${offer.id}`;
                        const imageUrl = getStorageUrl(offer.offer_image);

                        if (!imageUrl) return null; 

                        return (
                            <SwiperSlide key={offer.id}>
                                <div className="relative w-full group transition-shadow duration-300">
                                    <Link href={linkHref} className="block">
                                        <div className="relative pt-[100%] overflow-hidden rounded-lg"> 
                                            <img 
                                                src={imageUrl} 
                                                alt={offer.offer_name || "Offer Banner"} 
                                                className="absolute inset-0 w-full h-full object-cover border border-gray-200 transition-transform duration-300 group-hover:scale-105"
                                            />
                                            {/* Offer Name Overlay */}
                                            <div className="absolute inset-0 bg-black/10 flex items-end p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <span className="text-white text-sm font-semibold text-shadow-sm">{offer.offer_name}</span>
                                            </div>
                                        </div>
                                    </Link>
                                </div>
                            </SwiperSlide>
                        );
                    })}
                </Swiper>
                
                {/* Navigation Buttons (Now visible on all screens, adjusting size) */}
                {showNavigation && (
                    <>
                        <button
                            onClick={goPrev}
                            // Increased padding/margin on parent div, using -left-1 for positioning
                            className={`offer-swiper-prev-${sliderId} absolute -left-1 top-1/2 -translate-y-1/2 z-10 w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 flex items-center justify-center rounded-full bg-black/60 text-white hover:bg-black transition-colors shadow-lg`}
                            aria-label="Previous offer"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <button
                            onClick={goNext}
                            className={`offer-swiper-next-${sliderId} absolute -right-1 top-1/2 -translate-y-1/2 z-10 w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 flex items-center justify-center rounded-full bg-black/60 text-white hover:bg-black transition-colors shadow-lg`}
                            aria-label="Next offer"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </>
                )}
            </div>
        </section>
    );
};

export default OfferSlider;