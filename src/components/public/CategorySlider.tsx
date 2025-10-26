// src/components/public/CategorySlider.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { FaAngleRight, FaFolder, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { RootCategory, SubCategory } from '@/types/category';
import { useCategoryService } from '@/services/admin/categoryService';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '../ui/LoadingSpinner';

// 💡 FIX 1: Update prop to accept string | undefined | null
interface CategorySliderProps {
    allCategories: RootCategory[]; 
    currentCategoryId: string | null | undefined; 
}

// 💡 FIX 2: Helper function now includes type guards and checks all potential child keys
const findCategoryData = (
    categories: (RootCategory | SubCategory)[],
    targetId: string | null | undefined
): { current: RootCategory | SubCategory | undefined; children: (RootCategory | SubCategory)[] } => {
    if (!targetId) {
        return { current: undefined, children: [] };
    }

    const queue = [...categories];

    while (queue.length > 0) {
        const cat = queue.shift();
        if (!cat) continue;
        
        if (cat.id === targetId) {
            let children: (RootCategory | SubCategory)[] = [];

            // 💡 Type Guard to check for the correct children property
            if ('subCategories' in cat && Array.isArray(cat.subCategories)) {
                children = cat.subCategories;
            } else if ('children' in cat && Array.isArray(cat.children)) {
                children = cat.children;
            }
            
            return { current: cat, children: children };
        }

        // Add children to the queue to search deeper
        if ('subCategories' in cat && Array.isArray(cat.subCategories)) {
            queue.push(...cat.subCategories);
        } else if ('children' in cat && Array.isArray(cat.children)) {
            queue.push(...cat.children);
        }
    }

    return { current: undefined, children: [] };
};


const CategorySlider: React.FC<CategorySliderProps> = ({ allCategories, currentCategoryId }) => {
    const router = useRouter();
    const [sliderRef, setSliderRef] = useState<HTMLDivElement | null>(null);
    
    // Determine the category whose children we need to display
    const { currentCategory, childrenToDisplay } = useMemo(() => {
        
        // 💡 Use the fixed helper function
        const { current, children } = findCategoryData(allCategories, currentCategoryId);
        
        return { currentCategory: current, childrenToDisplay: children };
    }, [allCategories, currentCategoryId]);

    // Simple scroll functionality
    const scroll = useCallback((direction: 'left' | 'right') => {
        if (sliderRef) {
            const width = sliderRef.clientWidth;
            sliderRef.scrollBy({
                left: direction === 'left' ? -width : width,
                behavior: 'smooth',
            });
        }
    }, [sliderRef]);

    if (!currentCategory || childrenToDisplay.length === 0) {
        return null;
    }
    
    // Check if the current category is a root category (for title styling/naming)
    const isRootCategory = 'cat_name' in currentCategory;
    const title = isRootCategory ? `Shop ${currentCategory.cat_name}` : `Explore ${currentCategory.sub_cat_name} Subcategories`;


    return (
        <div className="py-4 space-y-4">
            {/* Title */}
            <h3 className="text-xl font-bold text-slate-700">
                {title}
            </h3>

            <div className="relative">
                {/* Scroll Buttons (Desktop only) */}
                {childrenToDisplay.length > 4 && (
                    <>
                        <button 
                            onClick={(e) => { e.preventDefault(); scroll('left'); }}
                            className="absolute left-0 top-1/2 transform -translate-y-1/2 p-2 bg-white rounded-full shadow-md z-10 hover:bg-gray-100 hidden lg:block"
                        >
                            <FaChevronLeft className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={(e) => { e.preventDefault(); scroll('right'); }}
                            className="absolute right-0 top-1/2 transform -translate-y-1/2 p-2 bg-white rounded-full shadow-md z-10 hover:bg-gray-100 hidden lg:block"
                        >
                            <FaChevronRight className="w-4 h-4" />
                        </button>
                    </>
                )}
                
                {/* Category Item Slider */}
                <div 
                    ref={setSliderRef}
                    className="flex space-x-4 overflow-x-scroll scrollbar-hide py-2"
                >
                    {childrenToDisplay.map(child => {
                        const childName = 'cat_name' in child ? child.cat_name : child.sub_cat_name;
                        const childId = child.id;
                        
                        return (
                            <Link 
                                key={childId} 
                                // On click, update URL to filter products by this new category ID
                                href={`/products?category_id=${childId}`}
                                className="flex-shrink-0 w-36 h-28 border border-gray-300 rounded-xl shadow-sm hover:shadow-lg transition-shadow bg-white flex flex-col items-center justify-center p-3 text-center"
                            >
                                <FaFolder className="w-6 h-6 mb-1 text-blue-500" />
                                <span className="text-sm font-medium text-slate-700 line-clamp-2">
                                    {childName}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default CategorySlider;