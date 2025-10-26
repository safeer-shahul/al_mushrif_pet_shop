// src/components/public/OfferSlider.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { FaGift } from 'react-icons/fa';
import { Offer } from '@/types/offer'; 
import { usePublicOfferService } from '@/services/public/offerService'; 
import { useCategoryService } from '@/services/admin/categoryService';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

/**
 * OfferSlider Component: Displays active offers with images in a responsive grid.
 * Displays max 5 items on large screen, 2 items on mobile. Images are square.
 */
const OfferSlider: React.FC = () => {
    const { fetchPublicOfferBanners } = usePublicOfferService(); 
    const { getStorageUrl } = useCategoryService();
    
    const [offers, setOffers] = useState<Offer[]>([]);
    const [loading, setLoading] = useState(true);

    const loadOffers = useCallback(async () => {
        setLoading(true);
        try {
            const fetchedOffers = await fetchPublicOfferBanners(); 
            setOffers(fetchedOffers.slice(0, 5));
        } catch (error) {
            setOffers([]);
        } finally {
            setLoading(false);
        }
    }, [fetchPublicOfferBanners]);

    useEffect(() => {
        loadOffers();
    }, [loadOffers]);


    if (loading) {
        return <div className="h-40 w-full flex items-center justify-center bg-gray-50"><LoadingSpinner /></div>;
    }
    
    if (offers.length === 0) {
        return null;
    }
    
    return (
        <div className="space-y-4">
            
            {/* 💡 FIX: Removed icon, added text-center and mb-4 to center the title */}
            <header className="w-full text-center mb-4">
                <h2 className="text-3xl font-bold text-slate-800 border-b pb-2 inline-block">
                    Offers for You
                </h2>
            </header>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {offers.map((offer) => {
                    const linkHref = `/products?offer_id=${offer.id}`;
                    const imageUrl = getStorageUrl(offer.offer_image);

                    if (!imageUrl) return null; 

                    return (
                        <div key={offer.id} className="relative w-full shadow-sm hover:shadow-md transition-shadow">
                            <Link href={linkHref} className="block group">
                                <div className="relative pt-[100%]">
                                    <img 
                                        src={imageUrl} 
                                        alt={offer.offer_name || "Offer Banner"} 
                                        className="absolute inset-0 w-full h-full object-cover p-2 border border-gray-200 rounded-lg transition-transform group-hover:scale-[1.02]"
                                    />
                                </div>
                            </Link>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default OfferSlider;