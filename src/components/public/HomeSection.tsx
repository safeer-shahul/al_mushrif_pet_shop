// src/components/public/HomeSectionComponent.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { HomeSection } from '@/types/content'; 
import LoadingSpinner from '../ui/LoadingSpinner';
import { usePublicContentService } from '@/services/public/contentService'; 

// Import the new slider component (required to be in the same directory or adjust path)
import HomeSectionSlider from './HomeSectionSlider'; 


// --- Main HomeSection Component (Content Wrapper) ---

const HomeSectionComponent: React.FC = () => {
    const { fetchPublicHomeSections } = usePublicContentService();
    
    const [sections, setSections] = useState<HomeSection[]>([]); 
    const [loading, setLoading] = useState(true);

    const loadSections = useCallback(async () => {
        setLoading(true);
        try {
            // Fetching sections now relies on the corrected BE CatalogController@indexHomeSections
            // to return sections with the 'products' array attached.
            const fetchedSections: HomeSection[] = await fetchPublicHomeSections(); 
            
            // 💡 Since the backend is now doing the heavy lifting of attaching product data 
            // via HomeSectionController, we just process the returned array.
            
            // 1. Filter and sort by order_sequence (BE should handle sorting, but frontend re-sorts for safety)
            const activeSortedSections = fetchedSections
                .filter(s => s.is_active)
                .sort((a, b) => a.order_sequence - b.order_sequence);
            
            // 2. Final check: ensure 'products' array exists and is not empty
            const finalSections = activeSortedSections.filter(s => s.products && s.products.length > 0);
            
            setSections(finalSections);
            
        } catch (error) {
            console.error(`Failed to load home sections:`, error);
            setSections([]);
        } finally {
            setLoading(false);
        }
    }, [fetchPublicHomeSections]);

    useEffect(() => {
        loadSections();
    }, [loadSections]);

    if (loading) {
        return <div className="container mx-auto"><LoadingSpinner /></div>;
    }
    
    if (sections.length === 0) {
        // Only return null if no sections are found or none are active/populated.
        return null; 
    }

    return (
        <div className="container mx-auto px-4 lg:px-8 xl:px-14">
            {sections.map(section => {
                const sectionProducts = section.products; 
                
                if (!sectionProducts || sectionProducts.length === 0) return null;
                
                // Render the slider component for each populated section
                return (
                    <HomeSectionSlider 
                        key={section.id} 
                        section={section} 
                        products={sectionProducts} 
                    />
                );
            })}
        </div>
    );
};

export default HomeSectionComponent;