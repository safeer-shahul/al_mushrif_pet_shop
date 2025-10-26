// src/components/public/ProductFilterDrawer.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { FaTimes, FaFilter, FaAngleUp, FaAngleDown, FaTags, FaDollarSign, FaSortAmountDown } from 'react-icons/fa';
import { usePublicFilterService } from '@/services/public/filterService';
import { FilterType } from '@/types/filter';
import { Brand } from '@/types/brand';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { ProductQueryParams } from '@/services/public/productService';
import { usePublicBrandService } from '@/services/public/brandService';

interface ProductFilterDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    currentFilters: ProductQueryParams; // The currently active filters
    onFilterChange: (newFilters: Partial<ProductQueryParams>) => void; // Function to update filters
}

const SORT_OPTIONS = [
    { key: 'latest', label: 'Latest (Default)' },
    { key: 'price_asc', label: 'Price: Low to High' },
    { key: 'price_desc', label: 'Price: High to Low' },
];

const ProductFilterDrawer: React.FC<ProductFilterDrawerProps> = ({ isOpen, onClose, currentFilters, onFilterChange }) => {
    const { fetchAllPublicFilters } = usePublicFilterService(); 
    const { fetchAllPublicBrands } = usePublicBrandService();

    const [filterTypes, setFilterTypes] = useState<FilterType[]>([]);
    const [brands, setBrands] = useState<Brand[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedFilter, setExpandedFilter] = useState<string | null>(null);
    
    // Local state to manage filter selections before applying
    const [localFilters, setLocalFilters] = useState<ProductQueryParams>(currentFilters);

    // Sync local filters when props change (e.g., navigation resets filters)
    useEffect(() => {
        setLocalFilters(currentFilters);
    }, [currentFilters]);


    // Fetch all filter types and brands in parallel (unchanged)
    const fetchDependencies = useCallback(async () => {
        setLoading(true);
        try {
            const [fetchedTypes, fetchedBrands] = await Promise.all([
                fetchAllPublicFilters(), 
                fetchAllPublicBrands()
            ]);
            setFilterTypes(fetchedTypes);
            setBrands(fetchedBrands.filter(b => b.is_active));
        } catch (e) {
            console.error("Failed to load filter dependencies:", e);
        } finally {
            setLoading(false);
        }
    }, [fetchAllPublicFilters, fetchAllPublicBrands]);

    useEffect(() => {
        fetchDependencies();
    }, [fetchDependencies]);


    // Handler for Price Range changes
    const handlePriceChange = (name: 'min_price' | 'max_price', value: string) => {
        const numValue = value ? parseFloat(value) : undefined;
        setLocalFilters(prev => ({ 
            ...prev, 
            [name]: numValue 
        }));
    };

    // 💡 FIX 1: Handler for Checkbox Filters (Brands & Custom Filters)
    const handleCustomFilterChange = (key: keyof ProductQueryParams, value: string, isChecked: boolean) => {
        setLocalFilters(prev => {
            // Get the current list of values for this key (as an array)
            const currentList = prev[key] ? String(prev[key]).split(',').filter(v => v) : [];
            let newArray = [...currentList]; // Copy the array

            if (isChecked) {
                // Add the new value if it's not already there
                if (!newArray.includes(value)) {
                    newArray.push(value);
                }
            } else {
                // Remove the value
                newArray = newArray.filter(v => v !== value);
            }
            
            // Re-join as comma-separated string for API query params, or undefined if empty
            return {
                ...prev,
                [key]: newArray.length > 0 ? newArray.join(',') : undefined
            };
        });
    };
    
    // Handler for Sort radio button change (updates local state, applied on button click or instantly)
    const handleSortChange = (sortKey: string) => {
        setLocalFilters(prev => ({
            ...prev,
            sort: sortKey
        }));
    };

    const handleApplyFilters = () => {
        // Pass the entire local filter state to the parent page to trigger data reload
        onFilterChange(localFilters);
        onClose(); // Close the drawer after applying on mobile
    };

    const handleResetFilters = () => {
        // Preserve category/offer IDs that were used to land on the page
        const preservedFilters = {
            category_id: currentFilters.category_id, 
            offer_id: currentFilters.offer_id,
            // Keep default sort if no sort was applied yet
            sort: currentFilters.sort || 'latest',
            page: 1
        };

        setLocalFilters(preservedFilters);
        onFilterChange(preservedFilters);
        onClose();
    };

    // 💡 FIX 2: Helper to check if a filter value is currently selected
    const isSelected = (key: keyof ProductQueryParams, value: string) => {
        const param = localFilters[key] as string | undefined;
        // Check if the comma-separated string contains the specific value
        return param ? param.split(',').includes(value) : false;
    };

    const filterContent = loading ? (
        <LoadingSpinner />
    ) : (
        <div className="flex-1 overflow-y-auto space-y-6 lg:overflow-visible pr-2">
            
            {/* --- Sorting Filter --- */}
            <div className="pb-3 border-b border-gray-100">
                 <h4 className="font-semibold text-slate-800 mb-2 flex items-center"><FaSortAmountDown className='mr-2 text-blue-500'/> Sort By</h4>
                 <div className="space-y-1 text-sm">
                    {SORT_OPTIONS.map(option => (
                        <div key={option.key} className='flex items-center'>
                            <input
                                type="radio"
                                id={`sort-${option.key}`}
                                name="sort"
                                checked={localFilters.sort === option.key}
                                onChange={() => handleSortChange(option.key)}
                                className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                            />
                            <label htmlFor={`sort-${option.key}`} className="ml-2 text-gray-700">{option.label}</label>
                        </div>
                    ))}
                 </div>
            </div>

            {/* --- Price Range Filter --- */}
            <div className="pb-3 border-b border-gray-100">
                <h4 className="font-semibold text-slate-800 mb-2 flex items-center"><FaDollarSign className='mr-2 text-blue-500'/> Price Range (AED)</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                        <label className="text-xs text-gray-500">Min Price</label>
                        <input
                            type="number"
                            placeholder="Min"
                            // 💡 Use localFilters for display
                            value={localFilters.min_price || ''}
                            onChange={(e) => handlePriceChange('min_price', e.target.value)}
                            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-gray-500">Max Price</label>
                        <input
                            type="number"
                            placeholder="Max"
                            // 💡 Use localFilters for display
                            value={localFilters.max_price || ''}
                            onChange={(e) => handlePriceChange('max_price', e.target.value)}
                            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg"
                        />
                    </div>
                </div>
            </div>
            
            {/* --- Brand Filter --- */}
            <div className="pb-3 border-b border-gray-100">
                <button 
                    type="button" 
                    className="w-full flex justify-between items-center text-left font-semibold text-slate-800"
                    onClick={() => setExpandedFilter(expandedFilter === 'brands' ? null : 'brands')}
                >
                    Brands ({brands.length}) {expandedFilter === 'brands' ? <FaAngleUp /> : <FaAngleDown />}
                </button>
                <div className={`mt-2 transition-all duration-300 overflow-hidden ${expandedFilter === 'brands' ? 'max-h-96' : 'max-h-0'}`}>
                    <div className="space-y-1 text-sm pt-2 max-h-48 overflow-y-auto">
                        {brands.map(brand => (
                            <div key={brand.brand_id} className='flex items-center'>
                                <input
                                    type="checkbox"
                                    id={`brand-${brand.brand_id}`}
                                    checked={isSelected('brand_id', brand.brand_id)}
                                    onChange={(e) => handleCustomFilterChange('brand_id', brand.brand_id, e.target.checked)}
                                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <label htmlFor={`brand-${brand.brand_id}`} className="ml-2 text-gray-700">{brand.brand_name}</label>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* --- Custom Dynamic Filters --- */}
            {filterTypes.map(type => (
                <div key={type.id} className="pb-3 border-b border-gray-100">
                    <button 
                        type="button" 
                        className="w-full flex justify-between items-center text-left font-semibold text-slate-800"
                        onClick={() => setExpandedFilter(expandedFilter === type.id ? null : type.id)}
                    >
                        {type.filter_type_name} ({type.items?.length || 0}) {expandedFilter === type.id ? <FaAngleUp /> : <FaAngleDown />}
                    </button>
                    <div className={`mt-2 transition-all duration-300 overflow-hidden ${expandedFilter === type.id ? 'max-h-96' : 'max-h-0'}`}>
                        <div className="space-y-1 text-sm pt-2 max-h-48 overflow-y-auto">
                            {type.items?.map(item => (
                                <div key={item.id} className='flex items-center'>
                                    <input
                                        type="checkbox"
                                        id={`filter-item-${item.id}`}
                                        checked={isSelected('filter_items', item.id)} 
                                        onChange={(e) => handleCustomFilterChange('filter_items', item.id, e.target.checked)}
                                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <label htmlFor={`filter-item-${item.id}`} className="ml-2 text-gray-700">{item.filter_name}</label>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <>
            {/* Mobile Overlay (Only visible when drawer is open) */}
            {isOpen && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden transition-opacity duration-300" 
                    onClick={onClose}
                />
            )}

            {/* Filter Drawer Content */}
            <div 
                className={`
                    fixed top-0 left-0 h-full w-72 bg-white shadow-2xl z-50 
                    transform transition-transform duration-300 ease-in-out flex flex-col
                    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                `}
            >
                {/* Header (Mobile) */}
                <div className="flex justify-between items-center p-4 border-b border-gray-200">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center">
                        <FaFilter className="mr-2 text-blue-500" /> Filters
                    </h3>
                    <button onClick={onClose} className="p-2 text-gray-500 hover:text-gray-700 rounded-full">
                        <FaTimes className="w-5 h-5" />
                    </button>
                </div>
                
                {/* Main Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-4 pb-24">
                   {filterContent}
                </div>

                {/* Apply/Reset buttons (Sticky Footer for Mobile Drawer) */}
                <div className="sticky bottom-0 p-4 bg-white border-t border-gray-200 shadow-md flex justify-between space-x-3">
                    <button 
                        onClick={handleResetFilters}
                        disabled={loading}
                        className="w-1/2 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                        Reset
                    </button>
                    <button 
                        onClick={handleApplyFilters}
                        disabled={loading}
                        className="w-1/2 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                    >
                        Apply Filters
                    </button>
                </div>
            </div>
        </>
    );
};

export default ProductFilterDrawer;