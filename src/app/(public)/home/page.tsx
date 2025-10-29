// src/app/(public)/home/page.tsx
'use client';

import HeroSectionComponent from '@/components/public/HeroSection';
import HomeSectionComponent from '@/components/public/HomeSection'; 
import OfferSlider from '@/components/public/OfferSlider'; // 💡 NEW IMPORT
import React from 'react';

/**
 * Main Public Homepage layout.
 */
export default function HomePage() {
    return (
        <div className="space-y-12">
            {/* 1. Hero/Banner Section (Carousel) */}
            <HeroSectionComponent />

            {/* 💡 NEW: Offer Slider Section */}
            <div className="container mx-auto px-2 md:px-10">
                 <OfferSlider />
            </div>
            
            <div className="container mx-auto space-y-12 px-2 md:px-10">
                {/* 2. Dynamic Home Sections */}
                <HomeSectionComponent /> 
            </div>
            
        </div>
    );
}