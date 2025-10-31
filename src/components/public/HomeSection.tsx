// src/components/public/HomeSectionComponent.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { HomeSection } from '@/types/content'; 
import { RootCategory } from '@/types/category';
import { Brand } from '@/types/brand'; // Assuming you have this type
import LoadingSpinner from '../ui/LoadingSpinner';
import { usePublicContentService } from '@/services/public/contentService'; 
import { useCategoryService } from '@/services/admin/categoryService'; 
import { usePublicBrandService } from '@/services/public/brandService'; // Import the brand service

import HomeSectionSlider from './HomeSectionSlider'; 
import RootCategorySlider from './RootCategorySlider'; 
import BrandSlider from './BrandSlider'; // Import the Brand Slider

// --- Main HomeSection Component (Content Wrapper) ---

const HomeSectionComponent: React.FC = () => {
    const { fetchPublicHomeSections } = usePublicContentService();
    // Renamed fetchRootCategories to the exposed alias (or actual name)
    const { fetchAllRootCategories } = useCategoryService(); 
    const { fetchAllPublicBrands } = usePublicBrandService();
    
    const [sections, setSections] = useState<HomeSection[]>([]); 
    const [rootCategories, setRootCategories] = useState<RootCategory[]>([]);
    const [brands, setBrands] = useState<Brand[]>([]); // New state for brands
    const [loading, setLoading] = useState(true);

    const loadContent = useCallback(async () => {
        setLoading(true);
        try {
            // Use Promise.all to fetch all data concurrently for better performance
            const [fetchedSections, fetchedCategories, fetchedBrands] = await Promise.all([
                fetchPublicHomeSections(),
                fetchAllRootCategories(),
                fetchAllPublicBrands(), 
            ]);

            // 1. Process Home Sections
            const activeSortedSections = fetchedSections
                .filter(s => s.is_active)
                .sort((a, b) => a.order_sequence - b.order_sequence);
            
            const finalSections = activeSortedSections.filter(s => s.products && s.products.length > 0);
            
            setSections(finalSections);

            // 2. Process Root Categories
            setRootCategories(fetchedCategories.filter(c => 'cat_name' in c)); // Ensure we only use root categories
            
            // 3. Process Brands
            setBrands(fetchedBrands.filter(b => b.is_active));
            
        } catch (error) {
            console.error(`Failed to load homepage content:`, error);
            setSections([]);
            setRootCategories([]);
            setBrands([]);
        } finally {
            setLoading(false);
        }
    }, [fetchPublicHomeSections, fetchAllRootCategories, fetchAllPublicBrands]);

    useEffect(() => {
        loadContent();
    }, [loadContent]);

    if (loading) {
        return <div className="container mx-auto"><LoadingSpinner /></div>;
    }
    
    // Create an array to hold the final rendered components
    const content = [];

    // --- Content Injection Logic ---
    
    const firstSection = sections[0];
    const remainingSections = sections.slice(1);

    // 1. Add the 0th Home Section (if it exists and has products)
    if (firstSection && firstSection.products && firstSection.products.length > 0) {
        content.push(
            <HomeSectionSlider 
                key={firstSection.id} 
                section={firstSection} 
                products={firstSection.products}
            />
        );
    }

    // 2. Inject the Root Categories Slider (after the 0th product section)
    if (rootCategories.length > 0) {
        content.push(
            <RootCategorySlider 
                key="root-category-section" 
                categories={rootCategories} 
            />
        );
    }
    
    // 3. Add the 1st Home Section
    const secondSection = sections[1];
    if (secondSection && secondSection.products && secondSection.products.length > 0) {
        content.push(
            <HomeSectionSlider 
                key={secondSection.id} 
                section={secondSection} 
                products={secondSection.products}
            />
        );
    }

    // 4. Inject the Brands Slider (after the 1st product section)
    if (brands.length > 0) {
        // NOTE: The BrandSlider component fetches its own data internally, 
        // so you might choose to render it directly without passing props, 
        // or pass the fetched list to ensure sequential loading.
        // Based on the provided BrandSlider, rendering the component is sufficient.
        content.push(
             // Passing brands as a prop might be slightly better for predictability/testing
            <BrandSlider key="brand-slider-section" />
        );
    }
    
    // 5. Add the rest of the Home Sections (starting from 2nd index)
    sections.slice(2).forEach(section => {
        if (section.products && section.products.length > 0) {
            content.push(
                <HomeSectionSlider 
                    key={section.id} 
                    section={section} 
                    products={section.products}
                />
            );
        }
    });

    if (content.length === 0) {
        return null;
    }

    return (
        <div className="container mx-auto px-4 lg:px-8 xl:px-14">
            {content}
        </div>
    );
};

export default HomeSectionComponent;