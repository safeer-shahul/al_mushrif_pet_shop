'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { FaFilter, FaList, FaAngleRight, FaSpinner, FaSort } from 'react-icons/fa';
import { usePublicProductService, ProductQueryParams } from '@/services/public/productService';
import { useCategoryService } from '@/services/admin/categoryService';
import { RootCategory } from '@/types/category';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ProductCard from '@/components/public/products/ProductCard'; 
import ProductFilterDrawer from '@/components/public/ProductFilterDrawer';
import CategorySlider from '@/components/public/CategorySlider';
import { useCart } from '@/context/CartContext';

// Define the primary color variable for easy styling consistency
const PRIMARY_COLOR = 'var(--color-primary, #FF6B35)';

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
    
    // --- Central State for Filters ---
    const [currentFilters, setCurrentFilters] = useState<ProductQueryParams>({
        category_id: searchParams.get('category_id') || undefined,
        brand_id: searchParams.get('brand_id') || undefined,
        offer_id: searchParams.get('offer_id') || undefined,
        search: searchParams.get('search') || undefined,
        page: 1,
        sort: 'latest', 
    });

    // --- Data Fetcher ---
    const loadData = useCallback(async (filters: ProductQueryParams) => {
        setLoading(true);
        setApiError(null);
        try {
            // Filter out empty/null parameters
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

    
    // 💡 FIX 1: Sync state from URL parameters (runs whenever URL changes)
    useEffect(() => {
        const newCategoryId = searchParams.get('category_id');
        const newBrandId = searchParams.get('brand_id');
        const newOfferId = searchParams.get('offer_id');
        const newSearch = searchParams.get('search');
        const newSort = searchParams.get('sort');

        setCurrentFilters(prev => {
            if (newCategoryId !== prev.category_id || 
                newBrandId !== prev.brand_id ||
                newOfferId !== prev.offer_id ||
                newSearch !== prev.search ||
                newSort !== prev.sort) {
                
                return {
                    ...prev,
                    category_id: newCategoryId || undefined,
                    brand_id: newBrandId || undefined,
                    offer_id: newOfferId || undefined,
                    search: newSearch || undefined,
                    sort: newSort || 'latest',
                    page: 1, 
                };
            }
            return prev;
        });

    }, [searchParams]); 
    
    
    // 💡 FIX 2: Trigger data fetch only when currentFilters state changes
    useEffect(() => {
        loadData(currentFilters);
    }, [currentFilters, loadData]); 


    // --- Filter Handler (Used by Filter Drawer/Sort Dropdown) ---
    const handleFilterChange = (newFilters: Partial<ProductQueryParams>) => {
        setCurrentFilters(prev => ({
            ...prev,
            ...newFilters,
            page: 1,
        }));
    }
    
    // --- Title Logic ---
    const getActiveTitle = () => {
        if (currentFilters.search) return `Search Results for "${currentFilters.search}"`;
        if (currentFilters.offer_id) return 'Special Offers';
        if (currentFilters.brand_id) return 'Shop by Brand';
        if (currentFilters.category_id) {
            return 'Shop Categories';
        }
        return 'All Products';
    }


    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-extrabold text-slate-800 mb-6" style={{ color: PRIMARY_COLOR }}>
                {getActiveTitle()}
            </h1>
            
            {apiError && <div className="p-3 bg-red-100 text-red-700 rounded-lg mb-4">{apiError}</div>}

            {/* Category Slider */}
            {currentFilters.category_id && (
                <div className="mb-8">
                    <CategorySlider 
                        allCategories={allCategories} 
                        currentCategoryId={currentFilters.category_id} 
                    />
                </div>
            )}
            {/* END CATEGORY SLIDER */}


            <div className="space-y-6">
                
                {/* Product Count & Controls (NEW LAYOUT) */}
                <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 bg-gray-50 border border-gray-200 rounded-xl shadow-sm'>
                    <h2 className='text-lg font-semibold text-slate-700 mb-3 sm:mb-0'>
                        {loading ? <FaSpinner className='animate-spin inline mr-2 text-gray-500' /> : 
                        <span>{productsData?.total || 0} Products Found</span>}
                    </h2>
                    
                    {/* Filter/Sort Controls Group - Always visible, but stacked on mobile */}
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
                        
                        {/* 1. Mobile Filter Button (Styled with PRIMARY_COLOR) */}
                        <button 
                            onClick={() => setIsDrawerOpen(true)}
                            className="py-2 px-4 border rounded-lg flex items-center justify-center text-sm font-semibold transition-colors shadow-sm"
                            style={{ 
                                backgroundColor: PRIMARY_COLOR, 
                                color: 'white',
                                borderColor: PRIMARY_COLOR
                            }}
                        >
                            <FaFilter className="mr-2" /> Show Filters
                        </button>
                        
                        {/* 2. Sorting Dropdown */}
                        <div className="flex items-center space-x-2 flex-shrink-0">
                            <FaSort className='w-4 h-4 text-gray-500' />
                            <label htmlFor='sort-select' className='text-sm text-gray-600 font-medium'>Sort By:</label>
                            <select 
                                id='sort-select'
                                onChange={(e) => handleFilterChange({ sort: e.target.value })}
                                value={currentFilters.sort || 'latest'}
                                className='text-sm border border-gray-300 rounded-lg py-2 px-2 focus:border-blue-500 focus:ring-blue-500'
                            >
                                <option value="latest">Latest</option>
                                <option value="price_asc">Price: Low to High</option>
                                <option value="price_desc">Price: High to Low</option>
                            </select>
                        </div>
                    </div>
                </div>


                {/* Product Grid */}
                <section> 
                    
                    {loading ? (
                        <LoadingSpinner />
                    ) : productsData && productsData.data.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6">
                            {productsData.data.map((product: any) => (
                                <ProductCard key={product.id} product={product} /> 
                            ))}
                        </div>
                    ) : (
                        <div className="p-10 bg-white rounded-xl shadow-lg text-center text-slate-500 border border-dashed border-gray-300">
                            <p className='text-lg font-medium'>No products match your current selection.</p>
                            <p className='text-sm mt-2'>Try clearing some filters or changing your search term.</p>
                        </div>
                    )}
                    {/* Pagination component would go here */}
                </section>
            </div>
            
            {/* MOBILE FILTER DRAWER INSTANTIATION */}
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