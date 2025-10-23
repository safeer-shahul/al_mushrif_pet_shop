// src/components/public/HomeSection.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePublicProductService } from '@/services/public/productService';
import { useCategoryService } from '@/services/admin/categoryService'; 
import { HomeSection } from '@/types/content'; // Updated
import { Product } from '@/types/product';
import LoadingSpinner from '../ui/LoadingSpinner';
import { FaAngleRight, FaTag } from 'react-icons/fa';

// Reusing ProductCard structure for consistency
// NOTE: Ensure this local component definition does NOT conflict with a global one.
const HomeProductCard: React.FC<{ product: Product }> = ({ product }) => {
    const basePrice = product.base_price || product.variants?.[0]?.price || 0;
    const offerPrice = product.base_offer_price || product.variants?.[0]?.offer_price;
    const finalPrice = offerPrice || basePrice;
    
    const primaryImage = product.images?.[0] || product.variants?.[0]?.images?.[0];
    const { getStorageUrl } = useCategoryService();

    return (
        <Link href={`/product/${product.id}`} passHref>
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col h-full">
                <div className="w-full h-40 bg-gray-100 flex items-center justify-center relative">
                    {offerPrice && <span className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">DEAL</span>}
                    {primaryImage?.image_url && (
                        <img 
                            src={getStorageUrl(primaryImage.image_url) || ''} 
                            alt={product.prod_name} 
                            className="max-h-full object-contain p-2" 
                        />
                    )}
                </div>
                <div className="p-3 flex-1 flex flex-col justify-between">
                    <div>
                        <h3 className="text-sm font-semibold text-slate-800 line-clamp-2 min-h-10">
                            {product.prod_name}
                        </h3>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                        <p className="text-lg font-bold">
                            <span style={{ color: 'var(--color-primary)' }}>AED {finalPrice.toFixed(2)}</span>
                        </p>
                        {offerPrice && (
                            <p className="text-sm text-gray-500 line-through">
                                AED {basePrice.toFixed(2)}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    );
}

// --- Main HomeSection Component ---

// FIX: Change to render all fetched sections inside this component
const HomeSectionComponent: React.FC = () => {
    const { fetchProducts } = usePublicProductService();
    // FIX: products state is now attached directly to the sections array
    const [sections, setSections] = useState<HomeSection[]>([]); 
    const [loading, setLoading] = useState(true);

    const loadSections = useCallback(async () => {
        setLoading(true);
        try {
            const sectionsResponse = await fetch('/api/home-sections');
            if (!sectionsResponse.ok) throw new Error("Failed to fetch home sections.");
            let allSections: HomeSection[] = await sectionsResponse.json();
            
            // Sort by order sequence and filter only active ones
            const activeSortedSections = allSections.filter(s => s.is_active).sort((a, b) => a.order_sequence - b.order_sequence);
            
            // Fetch products for all active sections that are linked to an offer
            const sectionsWithProductsPromises = activeSortedSections.map(async (section) => {
                if (section.offer_id) {
                    const productData = await fetchProducts({ offer_id: section.offer_id });
                    // FIX: Products are attached via the interface update
                    section.products = productData.data; 
                }
                return section;
            });

            const updatedSections = await Promise.all(sectionsWithProductsPromises);
            
            // Only keep sections that resulted in products being found
            const finalSections = updatedSections.filter(s => s.products && s.products.length > 0);
            
            setSections(finalSections);
            
        } catch (error) {
            console.error(`Failed to load home sections:`, error);
            setSections([]);
        } finally {
            setLoading(false);
        }
    }, [fetchProducts]);

    useEffect(() => {
        loadSections();
    }, [loadSections]);

    if (loading) {
        return <div className="container mx-auto"><LoadingSpinner /></div>;
    }
    
    if (sections.length === 0) {
        return null; 
    }

    return (
        <>
            {sections.map(section => {
                const sectionProducts = section.products; // Now correctly typed via HomeSection interface
                if (!sectionProducts || sectionProducts.length === 0) return null;
                
                const targetHref = section.offer_id ? `/offers?offer_id=${section.offer_id}` : '/products';

                return (
                    <section key={section.id} className="space-y-4 mb-10">
                        <header className="flex justify-between items-center pb-2 border-b border-gray-200">
                            <h2 className="text-2xl font-bold text-slate-800 flex items-center">
                                {section.offer_id && <FaTag className="mr-2 text-red-600" />}
                                {section.title}
                            </h2>
                            <Link 
                                href={targetHref}
                                className="text-sm font-medium hover:text-blue-600 flex items-center"
                                style={{ color: 'var(--color-primary-light)' }}
                            >
                                View All <FaAngleRight className="ml-1 w-3 h-3" />
                            </Link>
                        </header>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {/* Display up to 5 products for the homepage grid */}
                            {sectionProducts.slice(0, 5).map(product => ( 
                                <HomeProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    </section>
                );
            })}
        </>
    );
};

export default HomeSectionComponent;