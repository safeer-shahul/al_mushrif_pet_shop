'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import { FaAngleRight, FaFolder, FaChevronLeft, FaChevronRight, FaImage } from 'react-icons/fa';
import { RootCategory, SubCategory } from '@/types/category';
import { useCategoryService } from '@/services/admin/categoryService';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '../ui/LoadingSpinner';

// --- Types ---
interface CategorySliderProps {
    allCategories: RootCategory[]; 
    currentCategoryId: string | null | undefined; 
}

// --- Helpers ---

// Helper function to find the current category object and its immediate children
const findCategoryData = (
    categories: (RootCategory | SubCategory)[],
    targetId: string | null | undefined
): { current: RootCategory | SubCategory | undefined; children: (RootCategory | SubCategory)[] } => {
    if (!targetId) {
        return { current: undefined, children: [] };
    }

    const queue = [...categories];
    const visited = new Set();

    while (queue.length > 0) {
        const cat = queue.shift();
        if (!cat || visited.has(cat.id)) continue;
        visited.add(cat.id);
        
        // Define children accessors
        const subCategories = ('subCategories' in cat && Array.isArray(cat.subCategories)) ? cat.subCategories : [];
        const children = ('children' in cat && Array.isArray(cat.children)) ? cat.children : subCategories;
        // Also check snake_case children for the current object
        const sub_categories = ('sub_categories' in cat && Array.isArray(cat.sub_categories)) ? cat.sub_categories : [];

        if (cat.id === targetId) {
            // FIX: Prioritize 'children' (used for L2+) then 'sub_categories' (used for L1 under root)
            return { current: cat, children: children.length > 0 ? children : sub_categories };
        }

        // Add ALL potential children to the queue to search deeper
        queue.push(...children);
        queue.push(...sub_categories); // Ensure root children are searched if children is empty
    }

    return { current: undefined, children: [] };
};

// CRITICAL HELPER: Recursively find all product-linkable descendant IDs under a parent
const findAllDescendantLeafIds = (category: RootCategory | SubCategory | undefined): string[] => {
    if (!category) return [];

    const descendantIds: string[] = [];
    const queue: (RootCategory | SubCategory)[] = [category];
    const processedIds = new Set<string>();

    const getChildren = (cat: any): (RootCategory | SubCategory)[] => {
        // Consolidated logic for accessing direct children
        const subCategories = ('subCategories' in cat && Array.isArray(cat.subCategories)) ? cat.subCategories : [];
        const children = ('children' in cat && Array.isArray(cat.children)) ? cat.children : [];
        const sub_categories = ('sub_categories' in cat && Array.isArray(cat.sub_categories)) ? cat.sub_categories : [];

        // Return all unique direct children
        return [...subCategories, ...children, ...sub_categories].filter((c, i, a) => 
            a.findIndex(t => t.id === c.id) === i
        );
    };

    while (queue.length > 0) {
        const current = queue.shift();
        if (!current || processedIds.has(current.id)) continue;
        processedIds.add(current.id);

        const children = getChildren(current);
        const isRoot = 'cat_name' in current;

        // If it is a SubCategory (Level 1, 2, 3...) it is product-linkable, so collect its ID.
        if (!isRoot) {
            descendantIds.push(current.id);
        }

        // Add all children to the queue for deeper traversal regardless of level
        queue.push(...children);
    }
    
    // Ensure all collected IDs are unique
    return [...new Set(descendantIds)];
};


const CategorySlider: React.FC<CategorySliderProps> = ({ allCategories, currentCategoryId }) => {
    const { getStorageUrl } = useCategoryService(); // Use service for image URL resolution
    const router = useRouter();
    const [sliderRef, setSliderRef] = useState<HTMLDivElement | null>(null);
    
    // Determine the category whose children we need to display
    const { currentCategory, childrenToDisplay } = useMemo(() => {
        const { current, children } = findCategoryData(allCategories, currentCategoryId);
        return { currentCategory: current, childrenToDisplay: children };
    }, [allCategories, currentCategoryId]);

    // NEW MEMO: Determine the list of ALL subcategory IDs under the current category for the "View All" link
    const allDescendantIds = useMemo(() => {
        if (!currentCategory) return []; 
        return findAllDescendantLeafIds(currentCategory);
    }, [currentCategory]);
    
    // Simple scroll functionality
    const scroll = useCallback((direction: 'left' | 'right') => {
        if (sliderRef) {
            const itemWidth = 100 + 16; // Item width (w-24) + space-x-4 (16px)
            sliderRef.scrollBy({
                left: direction === 'left' ? -itemWidth * 3 : itemWidth * 3, // Scroll by a few items
                behavior: 'smooth',
            });
        }
    }, [sliderRef]);

    const getCategoryImageUrl = useCallback((category: any): string | null => {
        const imageUrl = category.cat_image || category.sub_cat_image || null;
        return getStorageUrl(imageUrl);
    }, [getStorageUrl]);
    
    if (!currentCategory || childrenToDisplay.length === 0) {
        return null;
    }
    
    // Check if the current category is a root category (for title styling/naming)
    const isRootCategory = 'cat_name' in currentCategory;
    const title = isRootCategory 
        ? `Shop ${currentCategory.cat_name}` 
        : `Explore ${currentCategory.sub_cat_name}`;

    // NEW: Get the image URL for the current parent category ("View All" card)
    const currentCategoryImageUrl = getCategoryImageUrl(currentCategory); 

    return (
        <div className="py-4 space-y-4">
            <style jsx>{`
                .hide-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .hide-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
            
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
                    className="flex space-x-4 overflow-x-auto py-2 hide-scrollbar"
                >
                    
                    {/* View All Products in This Category Branch */}
                    {currentCategory && allDescendantIds.length > 0 && (
                        <Link 
                            key={`${currentCategoryId}-all`} 
                            // Send all descendant IDs as a CSV list to the product listing page
                            href={`/products?sub_category_ids=${allDescendantIds.join(',')}`} 
                            // 💡 STYLING CHANGE: Use flex-col for vertical layout, w-24 for fixed width
                            className="flex-shrink-0 w-24 flex flex-col items-center justify-start text-center text-blue-700"
                        >
                            {/* 💡 STYLING CHANGE: Apply round styling to the image container */}
                            <div className="w-24 h-24 border-2 border-blue-500 rounded-full shadow-lg hover:shadow-xl transition-shadow bg-blue-50 flex items-center justify-center mb-1">
                                {currentCategoryImageUrl ? (
                                    <img 
                                        src={currentCategoryImageUrl} 
                                        alt={title} 
                                        className="w-full h-full object-cover rounded-full p-1" // Use p-1 to keep border visible
                                    />
                                ) : (
                                    <FaFolder className="w-10 h-10" />
                                )}
                            </div>
                            <span className="text-sm font-bold line-clamp-2 mt-1">
                                View All {isRootCategory ? currentCategory.cat_name : currentCategory.sub_cat_name}
                            </span>
                        </Link>
                    )}


                    {/* Display children (L1/L2 Sub Categories) */}
                    {childrenToDisplay.map(child => {
                        const childName = 'cat_name' in child ? child.cat_name : child.sub_cat_name;
                        const childId = child.id;
                        const imageUrl = getCategoryImageUrl(child);
                        
                        return (
                            <Link 
                                key={childId} 
                                // On click, update URL to filter products by this new category ID
                                href={`/products?category_id=${childId}`}
                                // 💡 STYLING CHANGE: Use flex-col for vertical layout, w-24 for fixed width
                                className="flex-shrink-0 w-24 flex flex-col items-center justify-start text-center"
                            >
                                {/* 💡 STYLING CHANGE: Apply round styling to the image container */}
                                <div className="w-24 h-24 border border-gray-300 rounded-full shadow-sm hover:shadow-lg transition-shadow bg-white flex items-center justify-center mb-1">
                                    {imageUrl ? (
                                        <img 
                                            src={imageUrl} 
                                            alt={childName} 
                                            className="w-full h-full object-cover rounded-full p-1" // Use p-1 to keep border visible
                                        />
                                    ) : (
                                        <FaImage className="w-10 h-10 text-gray-400" />
                                    )}
                                </div>
                                <span className="text-sm font-medium text-slate-700 line-clamp-2 mt-1">
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