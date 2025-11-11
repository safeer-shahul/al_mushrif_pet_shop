'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { FaFilter, FaSpinner, FaSort, FaChevronDown } from 'react-icons/fa';
import { usePublicProductService, ProductQueryParams } from '@/services/public/productService';
import { useCategoryService } from '@/services/admin/categoryService';
import { RootCategory } from '@/types/category';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ProductCard from '@/components/public/products/ProductCard';
import ProductFilterDrawer from '@/components/public/ProductFilterDrawer';
import CategorySlider from '@/components/public/CategorySlider';
import { useCart } from '@/context/CartContext';

// Define the primary color variable for easy styling consistency
const PRIMARY_COLOR = 'var(--color-primary, #003a8c)';

// --- Main Product Listing Page ---
const ProductListingPageClient: React.FC = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { fetchProducts } = usePublicProductService();
    const { fetchAllRootCategories } = useCategoryService();
    const { setIsCartDrawerOpen } = useCart();

    // State for Product Data & Pagination
    const [products, setProducts] = useState<any[]>([]);
    const [pagination, setPagination] = useState({
        current_page: 0,
        last_page: 1,
        total: 0,
    });
    
    const [allCategories, setAllCategories] = useState<RootCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    // --- Central State for Filters ---
    const [currentFilters, setCurrentFilters] = useState<ProductQueryParams>({
        category_id: searchParams.get('category_id') || undefined,
        brand_id: searchParams.get('brand_id') || undefined,
        offer_id: searchParams.get('offer_id') || undefined,
        search: searchParams.get('search') || undefined,
        page: 1,
        sort: searchParams.get('sort') || 'latest',
    });

    // --- Data Fetcher (Handles initial load and "Load More") ---
    const loadData = useCallback(async (filters: ProductQueryParams, append: boolean = false) => {
        
        if (!append) {
            setLoading(true);
        } else {
            setLoadingMore(true);
        }

        setApiError(null);
        
        try {
            const validFilters = Object.fromEntries(
                Object.entries(filters).filter(([, v]) => v !== undefined && v !== null && v !== '')
            ) as ProductQueryParams;

            const [productData, categoryData] = await Promise.all([
                fetchProducts(validFilters),
                fetchAllRootCategories()
            ]);
            
            // PAGINATION/APPEND LOGIC
            setProducts(prev => append ? [...prev, ...productData.data] : productData.data);
            setPagination({
                current_page: productData.current_page,
                last_page: productData.last_page,
                total: productData.total,
            });
            
            if (!append) {
                setAllCategories(categoryData);
            }
            
        } catch (err: any) {
            setApiError(err.message || 'Failed to load products or category structure.');
            if (!append) setProducts([]); 
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [fetchProducts, fetchAllRootCategories]);


    // 1. Sync state from URL parameters (runs whenever URL changes)
    useEffect(() => {
        const newCategoryId = searchParams.get('category_id');
        const newBrandId = searchParams.get('brand_id');
        const newOfferId = searchParams.get('offer_id');
        const newSearch = searchParams.get('search');
        const newSort = searchParams.get('sort');

        setCurrentFilters(prev => {
            // Check if any primary filter/sort parameter has changed
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
                    page: 1, // Always reset pagination on filter change
                };
            }
            return prev;
        });
    }, [searchParams]);


    // 2. Trigger initial data fetch/refresh when currentFilters (page=1) changes
    useEffect(() => {
        if (currentFilters.page === 1) {
             loadData(currentFilters, false);
        }
    }, [currentFilters, loadData]);
    
    
    // --- Load More Handler ---
    const handleLoadMore = () => {
        if (pagination.current_page < pagination.last_page && !loadingMore) {
            const nextPage = pagination.current_page + 1;
            
            // 1. Update client-side filters state with the new page number
            setCurrentFilters(prev => ({
                ...prev,
                page: nextPage
            }));
            
            // 2. Load data for the new page and append results
            loadData({ ...currentFilters, page: nextPage }, true);
        }
    };


    // --- Filter Handler (Used by Filter Drawer/Sort Dropdown) ---
    const handleFilterChange = (newFilters: Partial<ProductQueryParams>) => {
        // Reset pagination to page 1 whenever a new filter or sort is applied
        setCurrentFilters(prev => ({
            ...prev,
            ...newFilters,
            page: 1,
        }));
    }

    // --- Title Logic (Optimized for Offer Zone visibility) ---
    const getActiveTitle = () => {
        // HIGHEST PRECEDENCE CHECK
        if (currentFilters.offer_id) return 'Special Offers'; 
        
        if (currentFilters.sort === 'latest' && !currentFilters.search) return 'New Arrivals';
        if (currentFilters.search) return `Search Results for "${currentFilters.search}"`;
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

                {/* Product Count & Controls */}
                <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 bg-gray-50 border border-gray-200 rounded-xl shadow-sm'>
                    <h2 className='text-lg font-semibold text-slate-700 mb-3 sm:mb-0'>
                        {loading && products.length === 0 ? <FaSpinner className='animate-spin inline mr-2 text-gray-500' /> :
                            <span>{pagination.total || 0} Products Found</span>}
                    </h2>

                    {/* Filter/Sort Controls Group */}
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

                    {loading && products.length === 0 ? (
                        <LoadingSpinner />
                    ) : products.length > 0 ? (
                        <>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6">
                                {products.map((product: any) => (
                                    <ProductCard key={product.id} product={product} />
                                ))}
                            </div>
                            
                            {/* LOAD MORE BUTTON */}
                            {pagination.current_page < pagination.last_page && (
                                <div className="text-center mt-8">
                                    <button
                                        onClick={handleLoadMore}
                                        disabled={loadingMore}
                                        className="px-6 py-3 bg-[var(--color-primary)] text-white font-semibold rounded-lg shadow-md hover:opacity-90 transition-opacity disabled:bg-gray-400 disabled:cursor-not-allowed"
                                        style={{ backgroundColor: PRIMARY_COLOR }}
                                    >
                                        {loadingMore ? (
                                            <FaSpinner className="animate-spin inline mr-2" />
                                        ) : (
                                            <FaChevronDown className="inline mr-2" />
                                        )}
                                        {loadingMore ? 'Loading More...' : `Load More (${pagination.current_page} of ${pagination.last_page} pages loaded)`}
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="p-10 bg-white rounded-xl shadow-lg text-center text-slate-500 border border-dashed border-gray-300">
                            <p className='text-lg font-medium'>No products match your current selection.</p>
                            <p className='text-sm mt-2'>Try clearing some filters or changing your search term.</p>
                        </div>
                    )}
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

export default ProductListingPageClient;