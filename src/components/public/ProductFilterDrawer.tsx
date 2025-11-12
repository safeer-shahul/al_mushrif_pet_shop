'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { FaTimes, FaFilter, FaAngleUp, FaAngleDown, FaTags, FaDollarSign, FaSortAmountDown, FaRedo } from 'react-icons/fa';
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

// Define the primary color variable for easy styling consistency
const PRIMARY_COLOR = 'var(--color-primary, #FF6B35)';

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
    const [expandedFilter, setExpandedFilter] = useState<string | null>('sort'); // Default expand sort
    
    // Local state to manage filter selections before applying
    const [localFilters, setLocalFilters] = useState<ProductQueryParams>(currentFilters);

    // Sync local filters when props change (e.g., navigation resets filters)
    useEffect(() => {
        setLocalFilters(currentFilters);
    }, [currentFilters]);


    // Fetch all filter types and brands in parallel
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

    // Handler for Checkbox Filters (Brands & Custom Filters)
    const handleCustomFilterChange = (key: keyof ProductQueryParams, value: string, isChecked: boolean) => {
        setLocalFilters(prev => {
            const currentList = prev[key] ? String(prev[key]).split(',').filter(v => v) : [];
            let newArray = [...currentList];

            if (isChecked) {
                if (!newArray.includes(value)) {
                    newArray.push(value);
                }
            } else {
                newArray = newArray.filter(v => v !== value);
            }
            
            return {
                ...prev,
                [key]: newArray.length > 0 ? newArray.join(',') : undefined
            };
        });
    };
    
    // Handler for Sort radio button change (updates local state)
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
            // Only reset sort if it was applied via the drawer, otherwise keep the URL sort
            sort: currentFilters.sort || 'latest', 
            page: 1
        };

        setLocalFilters(preservedFilters);
        onFilterChange(preservedFilters);
        // Note: We don't close the drawer here to let the user see the reset state before applying
    };

    // Helper to check if a filter value is currently selected
    const isSelected = (key: keyof ProductQueryParams, value: string) => {
        const param = localFilters[key] as string | undefined;
        return param ? param.split(',').includes(value) : false;
    };
    
    const filterContent = loading ? (
        <LoadingSpinner />
    ) : (
        <div className="flex-1 overflow-y-auto space-y-4 lg:overflow-visible pr-2">
            
            {/* --- Sorting Filter --- */}
            <div className="pb-4 border-b border-gray-200">
                 <button 
                    type="button" 
                    className="w-full flex justify-between items-center text-left font-bold text-slate-800 text-lg"
                    onClick={() => setExpandedFilter(expandedFilter === 'sort' ? null : 'sort')}
                >
                    <span className='flex items-center'>
                         <FaSortAmountDown className='mr-3 w-4 h-4' style={{ color: PRIMARY_COLOR }}/> Sort By
                    </span>
                    {expandedFilter === 'sort' ? <FaAngleUp /> : <FaAngleDown />}
                </button>
                 <div className={`mt-3 transition-all duration-300 overflow-hidden ${expandedFilter === 'sort' ? 'max-h-96' : 'max-h-0'}`}>
                    <div className="space-y-2 text-sm pt-1">
                        {SORT_OPTIONS.map(option => (
                            <div key={option.key} className='flex items-center'>
                                <input
                                    type="radio"
                                    id={`sort-${option.key}`}
                                    name="sort"
                                    checked={localFilters.sort === option.key}
                                    onChange={() => handleSortChange(option.key)}
                                    className="h-4 w-4 border-gray-300 focus:ring-2"
                                    style={{ color: PRIMARY_COLOR, accentColor: PRIMARY_COLOR }}
                                />
                                <label htmlFor={`sort-${option.key}`} className="ml-2 text-gray-700">{option.label}</label>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* --- Price Range Filter --- */}
            <div className="pb-4 border-b border-gray-200">
                <button 
                    type="button" 
                    className="w-full flex justify-between items-center text-left font-bold text-slate-800 text-lg"
                    onClick={() => setExpandedFilter(expandedFilter === 'price' ? null : 'price')}
                >
                    <span className='flex items-center'>
                         <FaDollarSign className='mr-3 w-4 h-4' style={{ color: PRIMARY_COLOR }}/> Price Range (AED)
                    </span>
                    {expandedFilter === 'price' ? <FaAngleUp /> : <FaAngleDown />}
                </button>
                 <div className={`mt-3 transition-all duration-300 overflow-hidden ${expandedFilter === 'price' ? 'max-h-96' : 'max-h-0'}`}>
                    <div className="grid grid-cols-2 gap-3 text-sm pt-1">
                        <div>
                            <label className="text-xs text-gray-500">Min Price</label>
                            <input
                                type="number"
                                placeholder="Min"
                                value={localFilters.min_price || ''}
                                onChange={(e) => handlePriceChange('min_price', e.target.value)}
                                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-1"
                                style={{ borderColor: PRIMARY_COLOR }}
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500">Max Price</label>
                            <input
                                type="number"
                                placeholder="Max"
                                value={localFilters.max_price || ''}
                                onChange={(e) => handlePriceChange('max_price', e.target.value)}
                                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-1"
                                style={{ borderColor: PRIMARY_COLOR }}
                            />
                        </div>
                    </div>
                </div>
            </div>
            
            {/* --- Brand Filter --- */}
            <div className="pb-4 border-b border-gray-200">
                <button 
                    type="button" 
                    className="w-full flex justify-between items-center text-left font-bold text-slate-800 text-lg"
                    onClick={() => setExpandedFilter(expandedFilter === 'brands' ? null : 'brands')}
                >
                    <span className='flex items-center'>
                         <FaTags className='mr-3 w-4 h-4' style={{ color: PRIMARY_COLOR }}/> Brands ({brands.length})
                    </span>
                    {expandedFilter === 'brands' ? <FaAngleUp /> : <FaAngleDown />}
                </button>
                <div className={`mt-3 transition-all duration-300 overflow-hidden ${expandedFilter === 'brands' ? 'max-h-96' : 'max-h-0'}`}>
                    <div className="space-y-2 text-sm pt-1 max-h-48 overflow-y-auto">
                        {brands.map(brand => (
                            <div key={brand.brand_id} className='flex items-center'>
                                <input
                                    type="checkbox"
                                    id={`brand-${brand.brand_id}`}
                                    checked={isSelected('brand_id', brand.brand_id)}
                                    onChange={(e) => handleCustomFilterChange('brand_id', brand.brand_id, e.target.checked)}
                                    className="h-4 w-4 border-gray-300 rounded focus:ring-2"
                                    style={{ color: PRIMARY_COLOR, accentColor: PRIMARY_COLOR }}
                                />
                                <label htmlFor={`brand-${brand.brand_id}`} className="ml-2 text-gray-700">{brand.brand_name}</label>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* --- Custom Dynamic Filters --- */}
            {filterTypes.map(type => (
                <div key={type.id} className="pb-4 border-b border-gray-200">
                    <button 
                        type="button" 
                        className="w-full flex justify-between items-center text-left font-bold text-slate-800 text-lg"
                        onClick={() => setExpandedFilter(expandedFilter === type.id ? null : type.id)}
                    >
                         <span className='flex items-center'>
                            <FaFilter className='mr-3 w-4 h-4' style={{ color: PRIMARY_COLOR }}/> {type.filter_type_name} ({type.items?.length || 0})
                         </span>
                        {expandedFilter === type.id ? <FaAngleUp /> : <FaAngleDown />}
                    </button>
                    <div className={`mt-3 transition-all duration-300 overflow-hidden ${expandedFilter === type.id ? 'max-h-96' : 'max-h-0'}`}>
                        <div className="space-y-2 text-sm pt-1 max-h-48 overflow-y-auto">
                            {type.items?.map(item => (
                                <div key={item.id} className='flex items-center'>
                                    <input
                                        type="checkbox"
                                        id={`filter-item-${item.id}`}
                                        checked={isSelected('filter_items', item.id)} 
                                        onChange={(e) => handleCustomFilterChange('filter_items', item.id, e.target.checked)}
                                        className="h-4 w-4 border-gray-300 rounded focus:ring-2"
                                        style={{ color: PRIMARY_COLOR, accentColor: PRIMARY_COLOR }}
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
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300" 
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
                        <FaFilter className="mr-2" style={{ color: PRIMARY_COLOR }}/> Filters
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
                        className="w-1/2 py-2 text-sm text-slate-700 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center font-semibold"
                    >
                         <FaRedo className='w-4 h-4 mr-1'/> Reset
                    </button>
                    <button 
                        onClick={handleApplyFilters}
                        disabled={loading}
                        className="w-1/2 py-2 text-sm text-white rounded-lg hover:opacity-90 disabled:bg-gray-400 font-semibold"
                        style={{ backgroundColor: PRIMARY_COLOR }}
                    >
                        Apply Filters
                    </button>
                </div>
            </div>
        </>
    );
};

export default ProductFilterDrawer;