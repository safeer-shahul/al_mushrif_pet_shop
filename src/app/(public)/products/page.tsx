// src/app/(public)/products/page.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { FaFilter, FaAngleRight, FaBoxOpen, FaDollarSign } from 'react-icons/fa';
import { usePublicProductService, ProductQueryParams, PaginatedProducts } from '@/services/public/productService';
import { useCategoryService } from '@/services/admin/categoryService'; // Used for image URL utility
import { useBrandService } from '@/services/admin/brandService'; // Used for brand filter names
import { useFilterService } from '@/services/admin/filterService'; // Used for custom filter names
import { Product } from '@/types/product';
import { RootCategory, SubCategory } from '@/types/category';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Link from 'next/link';

// --- Product Card Component ---
const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
    // Determine Price
    const basePrice = product.base_price || product.variants?.[0]?.price || 0;
    const offerPrice = product.base_offer_price || product.variants?.[0]?.offer_price;
    const finalPrice = offerPrice || basePrice;
    
    // Determine Primary Image (simplified for frontend rendering)
    const primaryImage = product.images?.[0] || product.variants?.[0]?.images?.[0];
    const { getStorageUrl } = useCategoryService(); // Reusing utility from category service

    return (
        <Link href={`/product/${product.id}`} passHref>
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col h-full">
                {/* Image Section */}
                <div className="w-full h-48 bg-gray-100 flex items-center justify-center relative">
                     {offerPrice && <span className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">DEAL</span>}
                    {primaryImage?.image_url ? (
                        <img 
                            src={getStorageUrl(primaryImage.image_url) || ''} 
                            alt={product.prod_name} 
                            className="max-h-full object-contain p-2" 
                        />
                    ) : (
                        <FaBoxOpen className="w-8 h-8 text-gray-300" />
                    )}
                </div>
                
                {/* Details */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                        <h3 className="text-sm font-semibold text-slate-800 line-clamp-2 min-h-10">
                            {product.prod_name}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                            {product.brand?.brand_name || 'Generic'}
                        </p>
                    </div>
                    
                    <div className="mt-3 flex items-center justify-between">
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
                
                {/* Action Button */}
                 <div 
                    className="w-full py-2 text-white font-medium text-center"
                    style={{ backgroundColor: 'var(--color-primary)' }}
                >
                    Add to Cart
                </div>
            </div>
        </Link>
    );
}

// --- Filter Sidebar Component (Client-Side State) ---
interface FilterSidebarProps {
    currentFilters: ProductQueryParams;
    onFilterChange: (newFilters: Partial<ProductQueryParams>) => void;
    // Data for generating filter names
    allCategories: RootCategory[]; 
}

const FilterSidebar: React.FC<FilterSidebarProps> = ({ currentFilters, onFilterChange, allCategories }) => {
    // Placeholder for actual filter implementation later
    const [selectedCategory, setSelectedCategory] = useState<string | undefined>(currentFilters.category_id);
    
    // Function to find the Root Category based on the initial sub_cat_id
    const findActiveRootAndPath = useMemo(() => {
        const traverse = (cats: (RootCategory | SubCategory)[], targetId: string, path: string[]): { root: RootCategory | null, path: string[] } | null => {
            for (const cat of cats) {
                const currentPath = [...path, 'cat_name' in cat ? cat.cat_name : cat.sub_cat_name];
                if (cat.id === targetId) {
                    return { root: 'cat_name' in cat ? cat : null, path: currentPath };
                }
                
                const children = 'subCategories' in cat ? cat.subCategories : ('children' in cat ? cat.children : []);
                if (children) {
                    const result = traverse(children as (RootCategory | SubCategory)[], targetId, currentPath);
                    if (result) return result;
                }
            }
            return null;
        };

        if (currentFilters.category_id) {
            const result = traverse(allCategories, currentFilters.category_id, []);
            return result;
        }
        return null;
    }, [allCategories, currentFilters.category_id]);
    
    // Dynamic Header based on the initial category click
    const initialCategoryName = findActiveRootAndPath?.path.pop() || 'All Products';
    const activeFilterId = findActiveRootAndPath?.path.length === 1 ? findActiveRootAndPath.path[0] : null;


    return (
        <div className="p-4 space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">
                {initialCategoryName}
            </h2>
            <div className="space-y-3">
                <h3 className="font-semibold text-slate-700 flex items-center">
                    <FaFilter className="mr-2 w-4 h-4" /> Filter by Category
                </h3>
                
                {/* Simplified Category Filter (mimics second screenshot) */}
                <ul className="text-sm space-y-2 text-gray-600">
                     {/* Dynamic L2/L3 Categories under the active L1 category (MIMICS SECOND SCREENSHOT) */}
                    <li><button className="text-sm font-medium hover:text-blue-600" style={{ color: 'var(--color-primary)' }}>Dog Dry Food</button></li>
                    <li className="ml-4"><button className="text-sm hover:text-blue-600">Adult</button></li>
                    <li className="ml-4"><button className="text-sm hover:text-blue-600">Puppy</button></li>
                    {/* ... other L2 sub-categories will be listed here ... */}
                </ul>
            </div>
            
            {/* Price Filter Placeholder */}
            <div className="space-y-2 pt-4 border-t border-gray-100">
                 <h3 className="font-semibold text-slate-700">Price Range (AED)</h3>
                 <input type="range" min="0" max="1000" className="w-full" />
                 <div className="flex justify-between text-xs text-gray-500"><span>AED 0</span><span>AED 1000+</span></div>
            </div>
        </div>
    );
};


// --- Main Product Listing Page ---
const ProductListingPage: React.FC = () => {
    const searchParams = useSearchParams();
    const { fetchProducts } = usePublicProductService();
    const { fetchAllRootCategories } = useCategoryService();

    const [productsData, setProductsData] = useState<PaginatedProducts | null>(null);
    const [allCategories, setAllCategories] = useState<RootCategory[]>([]); // Nested structure for sidebar logic
    const [loading, setLoading] = useState(true);
    const [apiError, setApiError] = useState<string | null>(null);

    // Get initial filters from URL (from Mega Menu click)
    const initialCategoryId = searchParams.get('category_id');
    const initialBrandId = searchParams.get('brand_id');

    // State for client-side filtering (start with URL params)
    const [currentFilters, setCurrentFilters] = useState<ProductQueryParams>({
        category_id: initialCategoryId || undefined,
        brand_id: initialBrandId || undefined,
        page: 1,
    });
    
    // Combined Data Fetcher (Products + Categories)
    const loadData = useCallback(async (filters: ProductQueryParams) => {
        setLoading(true);
        setApiError(null);
        try {
            const [productData, categoryData] = await Promise.all([
                fetchProducts(filters),
                fetchAllRootCategories()
            ]);
            setProductsData(productData);
            setAllCategories(categoryData);
        } catch (err: any) {
            setApiError(err.message || 'Failed to load products or category structure.');
            setProductsData(null);
            setAllCategories([]);
        } finally {
            setLoading(false);
        }
    }, [fetchProducts, fetchAllRootCategories]);

    // Effect to load data on initial render and filter change
    useEffect(() => {
        loadData(currentFilters);
    }, [currentFilters, loadData]);

    const handleFilterChange = (newFilters: Partial<ProductQueryParams>) => {
        setCurrentFilters(prev => ({
            ...prev,
            ...newFilters,
            page: 1, // Reset to page 1 on any filter change
        }));
        // Note: In a production app, we would update the URL here using useRouter/useSearchParams
    }


    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-slate-800 mb-6">
                Product Listing
            </h1>

            <div className="grid grid-cols-12 gap-8">
                {/* Filter Sidebar */}
                <aside className="col-span-12 lg:col-span-3 bg-white p-6 rounded-xl shadow-lg h-full">
                    {allCategories.length > 0 && !loading && (
                        <FilterSidebar 
                            currentFilters={currentFilters}
                            onFilterChange={handleFilterChange}
                            allCategories={allCategories}
                        />
                    )}
                </aside>

                {/* Product Grid */}
                <section className="col-span-12 lg:col-span-9">
                    {apiError && (
                        <div className="p-4 bg-red-100 text-red-700 rounded-lg text-sm mb-4">{apiError}</div>
                    )}
                    
                    {loading ? (
                        <LoadingSpinner />
                    ) : productsData && productsData.data.length > 0 ? (
                        <>
                            <div className="mb-4 flex justify-between items-center text-sm text-gray-600">
                                <p>Showing {productsData.data.length} products</p>
                                {/* Sort Dropdown */}
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {productsData.data.map(product => (
                                    <ProductCard key={product.id} product={product} />
                                ))}
                            </div>
                            {/* Pagination (To be implemented) */}
                        </>
                    ) : (
                        <div className="p-10 bg-white rounded-xl shadow-lg text-center text-slate-500">
                            No products match your current filters.
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};

export default ProductListingPage;