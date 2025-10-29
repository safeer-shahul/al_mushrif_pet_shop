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
                fetchProducts(validFilters), // <--- Triggers the API call to port 8000
                fetchAllRootCategories()
            ]);
            setProductsData(productData);
            console.log(categoryData,'categoryData')
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
            // Only force an update if one of the key URL params changed
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
                    page: 1, // Reset to page 1 on new filter/category navigation
                };
            }
            return prev;
        });

    }, [searchParams]); // Depend only on searchParams changes
    
    
    // 💡 FIX 2: Trigger data fetch only when currentFilters state changes
    useEffect(() => {
        loadData(currentFilters);
    }, [currentFilters, loadData]); // loadData is stable, so this only runs when currentFilters changes


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
        if (currentFilters.offer_id) return 'Offers';
        if (currentFilters.brand_id) return 'Brands';
        if (currentFilters.category_id) {
            return 'Shop Categories';
        }
        return 'All Products';
    }


    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-slate-800 mb-6">
                {getActiveTitle()}
            </h1>

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


            <div className="grid grid-cols-12 gap-8">
                
                <div className='col-span-12'>
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


                {/* Product Grid - Full Width */}
                <section className="col-span-12"> 
                    
                    {loading ? (
                        <LoadingSpinner />
                    ) : productsData && productsData.data.length > 0 ? (
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