// src/app/(public)/home/page.tsx
'use client';

import HeroSectionComponent from '@/components/public/HeroSection';
import HomeSectionComponent from '@/components/public/HomeSection'; // This component now fetches ALL sections
import React from 'react';

/**
 * Main Public Homepage layout.
 */
export default function HomePage() {
    return (
        <div className="space-y-12">
            {/* 1. Hero/Banner Section (Carousel) */}
            <HeroSectionComponent />

            <div className="container mx-auto px-4 space-y-12">
                {/* 2. Dynamic Home Sections: RENDER ONLY ONCE. 
                    The component internally fetches and loops based on active API sections. */}
                <HomeSectionComponent /> 
            </div>
            
        </div>
    );
}