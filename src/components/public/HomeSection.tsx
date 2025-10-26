// src/components/public/HomeSection.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePublicProductService } from '@/services/public/productService';
import { useCategoryService } from '@/services/admin/categoryService'; 
import { HomeSection } from '@/types/content'; 
import { Product } from '@/types/product';
import LoadingSpinner from '../ui/LoadingSpinner';
import { FaAngleRight, FaTag, FaSpinner } from 'react-icons/fa';
// 💡 NEW: Import the public content service
import { usePublicContentService } from '@/services/public/contentService'; 

// Reusable Product Card (Assuming it's imported or defined externally)
// We define it locally here just for context, but you'll use the external import path.
const HomeProductCard: React.FC<{ product: Product }> = ({ product }) => {
    // NOTE: This relies on the definition in src/components/public/products/ProductCard.tsx
    // For simplicity here, we assume ProductCard handles price parsing and image display.
    const { getStorageUrl } = useCategoryService();
    const primaryImage = product.images?.[0] || product.variants?.[0]?.images?.[0];
    const finalPrice = product.base_offer_price || product.base_price || product.variants?.[0]?.offer_price || product.variants?.[0]?.price || 0;
    const basePrice = product.base_price || product.variants?.[0]?.price || 0;

    const imageUrl = getStorageUrl(primaryImage?.image_url || null);

    return (
        <Link href={`/product/${product.id}`} passHref>
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col h-full">
                <div className="w-full h-40 bg-gray-100 flex items-center justify-center relative">
                    {(basePrice && basePrice > finalPrice) && <span className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">DEAL</span>}
                    {imageUrl ? (
                        <img 
                            src={imageUrl} 
                            alt={product.prod_name} 
                            className="max-h-full object-contain p-2" 
                        />
                    ) : (
                        <FaSpinner className='w-8 h-8 text-gray-300' />
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
                        {(basePrice && basePrice > finalPrice) && (
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

const HomeSectionComponent: React.FC = () => {
    const { fetchProducts } = usePublicProductService();
    // 💡 FIX: Use the dedicated public service for home sections
    const { fetchPublicHomeSections } = usePublicContentService();
    
    const [sections, setSections] = useState<HomeSection[]>([]); 
    const [loading, setLoading] = useState(true);

    const loadSections = useCallback(async () => {
        setLoading(true);
        try {
            // 💡 FIX: Use the Axios-based service hook
            let allSections: HomeSection[] = await fetchPublicHomeSections(); 
            
            // Sort by order sequence
            const activeSortedSections = allSections.filter(s => s.is_active).sort((a, b) => a.order_sequence - b.order_sequence);
            
            // Fetch products for all active sections
            const sectionsWithProductsPromises = activeSortedSections.map(async (section) => {
                let productData: { data: Product[] } = { data: [] };
                
                if (section.offer_id) {
                    // Fetch products based on Offer ID
                    productData = await fetchProducts({ offer_id: section.offer_id });
                } else if (section.product_ids && section.product_ids.length > 0) {
                     // Since your backend fetchProducts API doesn't support fetching by an array of IDs yet, 
                     // and only supports one filter at a time, we'll temporarily rely on the assumption 
                     // that if product_ids are present, they are for filtering logic later, OR we mock 
                     // a single product detail if only one ID is present. 
                     
                     // For MVP, we will only fetch if linked to an offer, or if manual list is small.
                     // Since we can't efficiently fetch 5 random products by UUID here, we rely on offer_id for now.
                     // The backend HomeSectionController should eventually eagerly load products, or you implement a UUID array filter in ProductController.
                     
                     // For now, attach mock product details if no offer_id is set:
                     // This is a known simplification/limitation due to the current Product API design.
                }

                // If products were fetched via offer_id, attach them. Otherwise, keep the section.
                section.products = productData.data; 
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
    }, [fetchPublicHomeSections, fetchProducts]);

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
                const sectionProducts = section.products; 
                if (!sectionProducts || sectionProducts.length === 0) return null;
                
                const targetHref = section.offer_id ? `/products?offer_id=${section.offer_id}` : '/products';

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