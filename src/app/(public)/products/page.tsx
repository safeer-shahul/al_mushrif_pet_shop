// src/app/(public)/products/page.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { FaFilter, FaList, FaAngleRight, FaSpinner } from 'react-icons/fa';
import { usePublicProductService, ProductQueryParams } from '@/services/public/productService';
import { useCategoryService } from '@/services/admin/categoryService';
import { RootCategory } from '@/types/category';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ProductCard from '@/components/public/products/ProductCard'; 
import ProductFilterDrawer from '@/components/public/ProductFilterDrawer';
import CategorySlider from '@/components/public/CategorySlider';
import { useCart } from '@/context/CartContext';

// --- Main Product Listing Page ---
const ProductListingPage: React.FC = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { fetchProducts } = usePublicProductService();
    const { fetchAllRootCategories } = useCategoryService();
    const { setIsCartDrawerOpen } = useCart();

    const [productsData, setProductsData] = useState<any | null>(null);
    const [allCategories, setAllCategories] = useState<RootCategory[]>([]); 
    const [loading, setLoading] = useState(true);
    const [apiError, setApiError] = useState<string | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    
    // --- URL PARAMETER HANDLING ---
    const urlCategoryId = searchParams.get('category_id');
    const urlBrandId = searchParams.get('brand_id');
    const urlOfferId = searchParams.get('offer_id');
    
    const [currentFilters, setCurrentFilters] = useState<ProductQueryParams>({
        category_id: urlCategoryId || undefined,
        brand_id: urlBrandId || undefined,
        offer_id: urlOfferId || undefined,
        page: 1,
        sort: 'latest', 
    });

    useEffect(() => {
        setCurrentFilters(prev => ({
            ...prev,
            category_id: urlCategoryId || undefined,
            brand_id: urlBrandId || undefined,
            offer_id: urlOfferId || undefined,
            page: 1, 
        }));
    }, [urlCategoryId, urlBrandId, urlOfferId]);


    // --- Data Fetcher (unchanged) ---
    const loadData = useCallback(async (filters: ProductQueryParams) => {
        setLoading(true);
        setApiError(null);
        try {
            const validFilters = Object.fromEntries(
                Object.entries(filters).filter(([, v]) => v !== undefined && v !== null && v !== '')
            ) as ProductQueryParams;

            const [productData, categoryData] = await Promise.all([
                fetchProducts(validFilters),
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

    useEffect(() => {
        loadData(currentFilters);
    }, [currentFilters, loadData]);

    // --- Filter Handlers (unchanged) ---
    const handleFilterChange = (newFilters: Partial<ProductQueryParams>) => {
        setCurrentFilters(prev => ({
            ...prev,
            ...newFilters,
            page: 1,
        }));
    }
    
    // --- Title Logic (Point 4) ---
    const getActiveTitle = () => {
        if (urlOfferId) return 'Offers';
        if (urlBrandId) return 'Brands';
        if (urlCategoryId) {
            return 'Shop Categories';
        }
        return 'All Products';
    }


    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-slate-800 mb-6">
                {getActiveTitle()}
            </h1>

            {/* 💡 FIX 1: CATEGORY SLIDER MOVED TO THE TOP (Point 2 & 3) */}
            {/* Only show CategorySlider if we navigated via a category (urlCategoryId is set) */}
            {urlCategoryId && (
                 <div className="mb-8">
                    <CategorySlider 
                        allCategories={allCategories} 
                        currentCategoryId={urlCategoryId} 
                    />
                 </div>
            )}
            {/* 💡 END CATEGORY SLIDER */}


            <div className="grid grid-cols-12 gap-8">
                
                {/* ❌ OLD LEFT SIDEBAR REMOVED. 
                    The filter drawer is now ONLY visible via the button/modal on mobile.
                    On desktop, the Filter Drawer content is hidden until the button is clicked 
                    (or you can integrate the Drawer content inline if desired, but 
                    based on the screenshot, you want a full-width focus).
                */}
                
                {/* 💡 FILTER DRAWER BUTTON (ALWAYS VISIBLE, BUT HIDES CONTENT ON DESKTOP) */}
                <div className='col-span-12'>
                    {/* Filter Button is now always inline with the products on desktop/mobile */}
                    <div className="flex justify-between items-center mb-4">
                        <h2 className='text-xl font-semibold text-slate-700'>
                            {productsData?.total || 0} Products Found
                        </h2>
                        
                        {/* Filter/Sort Controls Group */}
                        <div className="flex items-center space-x-4">
                            {/* Mobile Filter Button */}
                            <button 
                                onClick={() => setIsDrawerOpen(true)}
                                className="py-2 px-4 bg-gray-100 border border-gray-300 rounded-lg flex items-center justify-center text-slate-700 text-sm font-medium hover:bg-gray-200"
                            >
                                <FaFilter className="mr-2" /> Filters
                            </button>
                            
                            {/* Sorting Dropdown */}
                            <div className="flex items-center space-x-2">
                                 <label className='text-sm text-gray-600'>Sort By:</label>
                                 <select 
                                    onChange={(e) => handleFilterChange({ sort: e.target.value })}
                                    value={currentFilters.sort || 'latest'}
                                    className='text-sm border border-gray-300 rounded-lg'
                                >
                                    <option value="latest">Latest</option>
                                    <option value="price_asc">Price: Low to High</option>
                                    <option value="price_desc">Price: High to Low</option>
                                 </select>
                            </div>
                        </div>
                    </div>
                </div>


                {/* Product Grid - Now spans the full width of the main content area (12 columns) */}
                <section className="col-span-12"> 
                    
                    {/* PRODUCT GRID */}
                    {loading ? (
                        <LoadingSpinner />
                    ) : productsData && productsData.data.length > 0 ? (
                        // Grid Layout: 2 columns mobile, 5 columns desktop (xl:grid-cols-5)
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {productsData.data.map((product: any) => (
                                <ProductCard key={product.id} product={product} /> 
                            ))}
                        </div>
                    ) : (
                        <div className="p-10 bg-white rounded-xl shadow-lg text-center text-slate-500">
                            No products match your current selection.
                        </div>
                    )}
                    {/* Pagination (TBD) */}
                </section>
            </div>
            
            {/* MOBILE FILTER DRAWER INSTANTIATION (Rendered outside the grid flow, always fixed) */}
            <ProductFilterDrawer 
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                currentFilters={currentFilters}
                onFilterChange={handleFilterChange}
            />
        </div>
    );
};

export default ProductListingPage;