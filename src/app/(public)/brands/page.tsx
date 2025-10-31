'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FaTags, FaSearch, FaTimes, FaPaw, FaSpinner, FaThLarge } from 'react-icons/fa';
import { usePublicBrandService } from '@/services/public/brandService';
import { useCategoryService } from '@/services/admin/categoryService';
import { Brand } from '@/types/brand';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Link from 'next/link';

const PRIMARY_COLOR = 'var(--color-primary, #FF6B35)';

// --- Brand Card Component ---
interface BrandCardProps {
    brand: Brand;
    getStorageUrl: (url: string | null) => string | null;
}

const BrandCard: React.FC<BrandCardProps> = ({ brand, getStorageUrl }) => {
    const imageUrl = getStorageUrl(brand.brand_logo);

    return (
        <Link 
            href={`/products?brand_id=${brand.brand_id}`}
            className="block w-full h-full text-center p-4 border border-gray-200 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 bg-white"
        >
            <div className="w-full aspect-square bg-gray-50 rounded-lg flex items-center justify-center mb-3 overflow-hidden p-4">
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={`${brand.brand_name} Logo`}
                        className="w-full h-full object-contain"
                    />
                ) : (
                    <FaPaw className="w-1/3 h-1/3 text-gray-400" />
                )}
            </div>
            <h3 className="text-lg font-bold text-slate-800 line-clamp-1">{brand.brand_name}</h3>
            {/* Optional: Add a short description or product count here if available */}
        </Link>
    );
};


// --- Main Brand Listing Page Component ---
const BrandListingPage: React.FC = () => {
    const { fetchAllPublicBrands } = usePublicBrandService();
    const { getStorageUrl } = useCategoryService();
    
    const [allBrands, setAllBrands] = useState<Brand[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const loadBrands = useCallback(async () => {
        setLoading(true);
        try {
            const fetchedBrands = await fetchAllPublicBrands();
            // Filter and sort for display
            const activeBrands = fetchedBrands
                .filter(b => b.is_active && b.brand_name && b.brand_logo)
                .sort((a, b) => a.brand_name.localeCompare(b.brand_name));
                
            setAllBrands(activeBrands);
        } catch (error) {
            console.error('Error loading brands:', error);
        } finally {
            setLoading(false);
        }
    }, [fetchAllPublicBrands]);

    useEffect(() => {
        loadBrands();
    }, [loadBrands]);

    const filteredBrands = useMemo(() => {
        if (!searchQuery) return allBrands;
        const query = searchQuery.toLowerCase();
        return allBrands.filter(brand => 
            brand.brand_name.toLowerCase().includes(query)
        );
    }, [allBrands, searchQuery]);


    // Group brands alphabetically for better presentation
    const groupedBrands = useMemo(() => {
        const groups: { [key: string]: Brand[] } = {};
        filteredBrands.forEach(brand => {
            const firstLetter = brand.brand_name.charAt(0).toUpperCase();
            if (!groups[firstLetter]) {
                groups[firstLetter] = [];
            }
            groups[firstLetter].push(brand);
        });
        return groups;
    }, [filteredBrands]);


    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-extrabold text-slate-800 flex items-center mb-6 pb-2 border-b border-gray-200" style={{ color: PRIMARY_COLOR }}>
                <FaTags className="mr-3 w-7 h-7" /> All Brands ({allBrands.length})
            </h1>

            {/* Search and Count Bar */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 p-4 bg-gray-50 rounded-xl shadow-inner">
                <p className="text-lg font-medium text-slate-700 mb-3 md:mb-0">
                    Showing {filteredBrands.length} out of {allBrands.length} active brands.
                </p>
                
                {/* Search Bar */}
                <div className="relative w-full md:w-80">
                    <input
                        type="text"
                        placeholder="Search for a brand..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500"
                    />
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-red-500">
                            <FaTimes className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Brand Grid Grouped Alphabetically */}
            {Object.keys(groupedBrands).length === 0 ? (
                <div className="p-10 text-center border-2 border-dashed border-gray-300 rounded-xl bg-white">
                    <FaThLarge className="w-10 h-10 mx-auto mb-3 text-gray-400" />
                    <p className="text-xl font-medium text-slate-700">No brands match your search query.</p>
                </div>
            ) : (
                <div className="space-y-10">
                    {Object.keys(groupedBrands).sort().map(letter => (
                        <div key={letter}>
                            <h2 className="text-2xl font-extrabold text-slate-900 border-b-2 border-gray-300 pb-1 mb-4" style={{ color: PRIMARY_COLOR }}>
                                {letter}
                            </h2>
                            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                                {groupedBrands[letter].map(brand => (
                                    <BrandCard key={brand.brand_id} brand={brand} getStorageUrl={getStorageUrl} />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default BrandListingPage;