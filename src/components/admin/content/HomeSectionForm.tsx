// src/components/admin/content/HomeSectionForm.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FaSave, FaList, FaLink, FaStar, FaPlus, FaTrash, FaSearch, FaSpinner, FaInfoCircle } from 'react-icons/fa';
import { HomeSection } from '@/types/content';
// 💡 NEW: Import useOfferService for product search functionality
import { useOfferService } from '@/services/admin/offerService';
import { Product } from '@/types/product'; 

interface HomeSectionFormProps {
    initialData?: Partial<HomeSection>;
    isEditMode: boolean;
    onSave: (data: Partial<HomeSection>) => Promise<void>;
    onCancel: () => void;
    isLoading: boolean;
    apiError: string | null;
    availableOffers: { id: string; name: string }[];
}

const HomeSectionForm: React.FC<HomeSectionFormProps> = ({
    initialData,
    isEditMode,
    onSave,
    onCancel,
    isLoading,
    apiError,
    availableOffers
}) => {
    // 💡 NEW: Access product search method
    const { searchProductsForDropdown } = useOfferService();

    const [formData, setFormData] = useState<Partial<HomeSection>>(initialData || {
        title: '',
        is_active: true,
        order_sequence: 0,
        offer_id: '',
        product_ids: []
    });
    
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Product[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);

    // Memoize the mapping of product IDs to basic product info for the list display
    const selectedProductDetails = useMemo(() => {
        // NOTE: This relies on initialData potentially containing product info,
        // but for newly added products, it will only have the ID.
        // A complete solution might cache product details on selection.
        const productMap = new Map<string, Product>();
        if (initialData?.products) {
            initialData.products.forEach(p => productMap.set(p.id, p));
        }
        return productMap;
    }, [initialData]);


    // Sync initial data and reset local state when initialData changes
    useEffect(() => {
        setFormData(initialData || {
            title: '',
            is_active: true,
            order_sequence: 0,
            offer_id: '',
            product_ids: []
        });
        setLocalError(null);
    }, [initialData]);

    // 💡 NEW: Debounced search logic for product dropdown
    useEffect(() => {
        if (!searchQuery) {
            setSearchResults([]);
            return;
        }

        setSearchLoading(true);
        const delaySearch = setTimeout(async () => {
            try {
                const results = await searchProductsForDropdown(searchQuery);
                setSearchResults(results.data);
            } catch (e) {
                console.error("Product search failed:", e);
                setSearchResults([]);
            } finally {
                setSearchLoading(false);
            }
        }, 300); // 300ms debounce
        
        return () => clearTimeout(delaySearch);
    }, [searchQuery, searchProductsForDropdown]);
    
    // Check if the current product ID input is already associated (used for the Add button state/logic)
    const isProductAlreadyAdded = (productId: string) => {
        return formData.product_ids?.includes(productId);
    }


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target as HTMLInputElement;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }));
    };

    const handleSelectProduct = (product: Product) => {
        const productIdToAdd = product.id; 
        
        if (isProductAlreadyAdded(productIdToAdd)) {
            setLocalError('This product is already in the list');
            return;
        }

        setFormData(prev => ({
            ...prev,
            product_ids: [...(prev.product_ids || []), productIdToAdd]
        }));
        setSearchQuery(''); // Clear search
        setSearchResults([]); // Clear results
        setLocalError(null);
    };

    const handleRemoveProduct = (productId: string) => {
        setFormData(prev => ({
            ...prev,
            product_ids: prev.product_ids?.filter(id => id !== productId)
        }));
    };

    const getProductDisplay = (productId: string) => {
        const product = initialData?.products?.find(p => p.id === productId);
        return product 
            ? `${product.prod_name} (${product.prod_id})` 
            : `Product ID: ${productId.substring(0, 8)}...`;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError(null);
        
        // Validation
        if (!formData.title?.trim()) {
            setLocalError('Section title is required');
            return;
        }
        
        if (!formData.offer_id && (!formData.product_ids || formData.product_ids.length === 0)) {
            setLocalError('Either select an offer or add at least one product');
            return;
        }
        
        await onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-purple-50 to-gray-50 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-slate-800">
                    {isEditMode ? `Edit Section: ${formData.title || 'Untitled'}` : 'Create New Product Section'}
                </h2>
            </div>
            
            {(apiError || localError) && (
                <div className="mx-6 mt-4 p-3 bg-red-50 border-l-4 border-red-500 rounded-md">
                    <p className="text-sm text-red-700 font-medium">{apiError || localError}</p>
                </div>
            )}

            <div className="p-6 space-y-6">
                {/* Title and Order Sequence */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2 md:col-span-2">
                        <label htmlFor="title" className="block text-sm font-medium text-slate-700 flex items-center">
                            <FaList className="mr-2" /> Section Title <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="title"
                            type="text"
                            name="title"
                            value={formData.title || ''}
                            onChange={handleChange}
                            placeholder="e.g., New Arrivals, Featured Products"
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 transition-all"
                            disabled={isLoading}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="order_sequence" className="block text-sm font-medium text-slate-700">
                            Display Order
                        </label>
                        <input
                            id="order_sequence"
                            type="number"
                            name="order_sequence"
                            value={formData.order_sequence || 0}
                            onChange={handleChange}
                            min="0"
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 transition-all"
                            disabled={isLoading}
                        />
                    </div>
                </div>

                {/* Offer Selection */}
                <div className="space-y-2 pt-4 border-t border-gray-100">
                    <label htmlFor="offer_id" className="block text-sm font-medium text-slate-700 flex items-center">
                        <FaStar className="mr-2 text-yellow-500" /> Link to Specific Offer (Optional)
                    </label>
                    <select
                        id="offer_id"
                        name="offer_id"
                        value={formData.offer_id || ''}
                        onChange={handleChange}
                        className="w-full appearance-none px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 transition-all pr-10"
                        disabled={isLoading}
                    >
                        <option value="">-- Select Offer (Manual products below will be ignored) --</option>
                        {availableOffers.map(offer => (
                            <option key={offer.id} value={offer.id}>{offer.name}</option>
                        ))}
                    </select>
                </div>

                {/* Manual Product Selection (only if no offer is selected) */}
                {!formData.offer_id && (
                    <div className="space-y-4 pt-2">
                        <h3 className="text-md font-semibold text-slate-700">Manually Select Products</h3>
                        
                        {/* 💡 NEW: Search Dropdown Input */}
                        <div className="relative">
                            <div className="flex items-center">
                                <FaSearch className="absolute left-3 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search products by Name or SKU to add them..."
                                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                    disabled={isLoading}
                                />
                            </div>

                            {/* Search Dropdown Results */}
                            {searchQuery && (
                                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                    {searchLoading ? (
                                        <div className="flex justify-center p-4"><FaSpinner className="animate-spin text-purple-500" /></div>
                                    ) : searchResults.length > 0 ? (
                                        <ul className="divide-y divide-gray-100">
                                            {searchResults.map((product) => (
                                                <li 
                                                    key={product.id}
                                                    onClick={() => handleSelectProduct(product)}
                                                    className={`p-3 text-sm text-gray-800 cursor-pointer hover:bg-purple-50 ${isProductAlreadyAdded(product.id) ? 'bg-gray-100 text-gray-500 italic' : ''}`}
                                                >
                                                    {product.prod_name} 
                                                    <span className="text-xs text-gray-500 ml-2">({product.prod_id})</span>
                                                    {isProductAlreadyAdded(product.id) && <span className="ml-2 text-xs text-red-500">(Added)</span>}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <div className="p-3 text-sm text-gray-500">No products found.</div>
                                    )}
                                </div>
                            )}
                        </div>
                        
                        {/* Product List */}
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                                <h4 className="text-sm font-medium text-slate-700">Selected Products ({formData.product_ids?.length || 0})</h4>
                            </div>
                            
                            {formData.product_ids && formData.product_ids.length > 0 ? (
                                <ul className="divide-y divide-gray-100">
                                    {formData.product_ids.map((productId) => (
                                        <li key={productId} className="flex justify-between items-center px-4 py-2 hover:bg-gray-50">
                                            <span className="text-sm text-gray-800">
                                                {getProductDisplay(productId)}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveProduct(productId)}
                                                disabled={isLoading}
                                                className="p-1 text-red-600 hover:text-red-800 transition-colors"
                                            >
                                                <FaTrash size={12} />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="p-4 text-center text-gray-500 text-sm">
                                    Use the search bar above to add products.
                                </div>
                            )}
                        </div>
                    </div>
                )}
                
                {/* Active Status */}
                <div className="flex items-center pt-4 border-t border-gray-100">
                    <input
                        id="is_active"
                        name="is_active"
                        type="checkbox"
                        checked={!!formData.is_active}
                        onChange={handleChange}
                        className="h-5 w-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                        disabled={isLoading}
                    />
                    <label htmlFor="is_active" className="ml-3 block text-sm font-medium text-slate-700">
                        Section is Active / Visible
                    </label>
                </div>
            </div>
            
            {/* Form Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
                <button
                    type="button"
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={onCancel}
                    disabled={isLoading}
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={isLoading}
                    className={`
                        px-4 py-2 rounded-lg text-white font-medium flex items-center
                        ${isLoading 
                            ? 'bg-gray-400 cursor-not-allowed' 
                            : 'bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 shadow-sm'}
                    `}
                >
                    <FaSave className="w-4 h-4 mr-2" />
                    {isEditMode 
                        ? (isLoading ? 'Updating...' : 'Update Section') 
                        : (isLoading ? 'Creating...' : 'Create Section')
                    }
                </button>
            </div>
        </form>
    );
};

export default HomeSectionForm;