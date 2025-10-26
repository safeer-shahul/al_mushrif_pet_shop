// src/components/admin/offer/OfferForm.tsx (FULL CODE)
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { FaSave, FaTimes, FaDollarSign, FaBoxes, FaPlus, FaTrash, FaInfoCircle, FaSearch, FaSpinner, FaShoppingCart } from 'react-icons/fa';
import { Offer, OfferType } from '@/types/offer'; 
import { useOfferService } from '@/services/admin/offerService'; 
import { Product } from '@/types/product'; 
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ImageUploadField from '@/components/ui/ImageUploadField';
import { useCategoryService } from '@/services/admin/categoryService';

interface OfferFormProps {
    // Allows initialData to include Product objects for display purposes
    initialData?: Partial<Offer> & { products_details?: Product[] };
    isEditMode: boolean;
    // Passes the transient File field (offer_image_file) and removal flag
    onSave: (data: Partial<Offer> & { offer_image_file?: File | null, offer_image_removed?: boolean }) => Promise<void>; 
    isLoading: boolean;
    error: string | null;
}

const OFFER_TYPES: { value: OfferType, label: string }[] = [
    { value: 'percentage', label: 'Product - Percentage Discount' },
    { value: 'fixed_amount', label: 'Product - Fixed Amount Off (AED)' },
    { value: 'bogo', label: 'Product - Buy X Get Y Free (BOGO)' },
    { value: 'cart_total_percentage', label: 'Cart Total - Percentage Discount' },
    { value: 'cart_total_fixed', label: 'Cart Total - Fixed Amount Off (AED)' },
];

const OfferForm: React.FC<OfferFormProps> = ({ 
    initialData, 
    isEditMode, 
    onSave, 
    isLoading, 
    error 
}) => {
    const router = useRouter();
    const { searchProductsForDropdown } = useOfferService(); 
    const { getStorageUrl } = useCategoryService();

    const [formData, setFormData] = useState<Partial<Offer>>(
        initialData || { 
            type: 'percentage', 
            products: [],
            min_cart_amount: null
        }
    );
    
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imageRemoved, setImageRemoved] = useState(false);

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Product[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);
    
    const isCartLevelDiscount = useMemo(() => {
        return formData.type?.startsWith('cart_total') || false;
    }, [formData.type]);

    // Image Preview URL logic
    const imagePreviewUrl = useMemo(() => {
        // Uses the actual 'offer_image' property (string path from DB)
        return initialData?.offer_image ? getStorageUrl(initialData.offer_image) : null;
    }, [initialData?.offer_image, getStorageUrl]);

    useEffect(() => {
    // If the incoming data changes and is different from the current state (i.e., new data arrived)
    // We update the local state. Checking the ID is usually enough to detect a change.
        if (initialData?.id !== formData.id) {
            setFormData(initialData || { 
                type: 'percentage', 
                products: [],
                min_cart_amount: null
            });
            setImageFile(null);
            setImageRemoved(false);
        }
    }, [initialData]);

    // Centralized map for product details
    const productDetailsMap = useMemo(() => {
        const map = new Map<string, Product>();
        
        // Use products_details if available (assumed API provides it or parent page loads it)
        if (initialData?.products_details) {
            initialData.products_details.forEach(p => {
                // p is guaranteed to be a Product object here due to the interface definition
                map.set(p.id, p);
            });
        }
        // Add search results
        searchResults.forEach(p => map.set(p.id, p));
        return map;
    }, [initialData, searchResults]);

    // Debounced search logic
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
        }, 300); 
        
        return () => clearTimeout(delaySearch);
    }, [searchQuery, searchProductsForDropdown]);

    // Sync initial data (and clear transient states)
    useEffect(() => {
    // This only runs when initialData object reference changes.
        setFormData(initialData || { type: 'percentage', products: [] }); 
        setImageFile(null);
        setImageRemoved(false);
    }, [initialData]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target as HTMLInputElement;
        
        if (name === 'type') {
            const newType = value as OfferType;
            const updatedData: Partial<Offer> = { type: newType };
            
            if (newType.startsWith('cart_total')) {
                updatedData.products = [];
                updatedData.min_qty = null;
                updatedData.free_qty = null;
            } else {
                updatedData.min_cart_amount = null; 
            }

            setFormData(prev => ({ ...prev, ...updatedData }));
            return;
        }
        
        if (name.includes('price') || name.includes('qty') || name.includes('amount') || type === 'number') {
            const numValue = value === '' ? null : Number(value);
            setFormData(prev => ({ ...prev, [name]: numValue }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleImageChange = (file: File | null) => {
        setImageFile(file);
        setImageRemoved(false);
    };

    const handleRemoveExisting = (removed: boolean) => {
        if (removed) {
            setImageRemoved(true);
            setImageFile(null);
        }
    };

    const isProductAlreadyAdded = (productId: string) => {
        return formData.products?.includes(productId);
    }

    const handleSelectProduct = (product: Product) => {
        const productIdToAdd = product.id; 
        
        if (isProductAlreadyAdded(productIdToAdd)) {
            setLocalError('Product already added.');
            return;
        }

        setFormData(prev => ({
            ...prev,
            products: [...(prev.products || []), productIdToAdd]
        }));
        setSearchQuery(''); 
        setSearchResults([]); 
        setLocalError(null);
    };

    const handleRemoveProduct = (productId: string) => {
        setFormData(prev => ({
            ...prev,
            products: prev.products?.filter(id => id !== productId)
        }));
    };
    
    const getProductDisplay = (productId: string) => {
        const product = productDetailsMap.get(productId);
        if (product) {
            return `${product.prod_name} (${product.prod_id})`; 
        }
        return `Product ID: ${productId.substring(0, 8)}...`;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError(null);
        
        // --- Validation Checks (Assumed correct based on previous iterations) ---
        if (!formData.offer_name?.trim()) {
            setLocalError('Offer Name is required.');
            return;
        }
        
        if (formData.type?.includes('percentage') && (!formData.discount_percent || formData.discount_percent <= 0 || formData.discount_percent > 100)) {
            setLocalError('Percentage must be between 1 and 100.');
            return;
        }
        
        if (formData.type?.includes('fixed') && (!formData.discount_percent || formData.discount_percent <= 0)) {
             setLocalError('Fixed Amount Off must be greater than zero.');
            return;
        }

        if (formData.type === 'bogo' && (!formData.min_qty || !formData.free_qty || formData.min_qty <= 0 || formData.free_qty <= 0)) {
            setLocalError('Buy and Get quantities must be greater than zero for BOGO offers.');
            return;
        }
        
        if (isCartLevelDiscount && (!formData.min_cart_amount || formData.min_cart_amount <= 0)) {
             setLocalError('Minimum Cart Amount is required for this offer type.');
            return;
        }
        // --- End Validation Checks ---

        // Pass the transient file field name to the parent page
        await onSave({
            ...formData,
            offer_image_file: imageFile, // Renamed file object
            offer_image_removed: imageRemoved,
        });
    };

    const isDisabled = isLoading;

    return (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            {/* Header - Using Blue gradient */}
            <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-gray-50 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-slate-800">
                    {isEditMode ? `Edit Offer: ${formData.offer_name || ''}` : 'Create New Offer'}
                </h2>
                <p className="mt-1 text-sm text-slate-500">Define the promotion type and associated products.</p>
            </div>

            {/* Error Display */}
            {(error || localError) && (
                <div className="mx-6 mt-4 p-3 bg-red-50 border-l-4 border-red-500 rounded-md">
                    <p className="text-sm text-red-700 font-medium">{error || localError}</p>
                </div>
            )}

            {/* Form Content */}
            <div className="p-6 space-y-6">
                
                {/* Offer Image Upload */}
                <div className="space-y-2 pt-4 border-t border-gray-100">
                    <label className="block text-sm font-medium text-slate-700">
                        Offer Image / Banner (Optional)
                    </label>
                    
                    <ImageUploadField
                        name="offer_image"
                        label="Choose Offer Banner"
                        existingImageUrl={imagePreviewUrl}
                        onChange={handleImageChange}
                        onRemoveExisting={handleRemoveExisting}
                        disabled={isDisabled}
                    />
                    <p className="text-xs text-gray-500">
                        Recommended: Square or horizontal image to represent the offer.
                    </p>
                </div>

                {/* Offer Name and Type */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-2">
                        <label htmlFor="offer_name" className="block text-sm font-medium text-slate-700">
                            Offer Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="offer_name"
                            type="text"
                            name="offer_name" 
                            value={formData.offer_name || ''} 
                            onChange={handleChange}
                            required
                            placeholder="e.g., Summer Pet Food Sale"
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all"
                            disabled={isDisabled}
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <label htmlFor="type" className="block text-sm font-medium text-slate-700">
                            Offer Type <span className="text-red-500">*</span>
                        </label>
                        <select
                            id="type"
                            name="type"
                            value={formData.type || 'percentage'}
                            onChange={handleChange}
                            required
                            className="w-full appearance-none px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all pr-10"
                            disabled={isDisabled}
                        >
                            {OFFER_TYPES.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Discount Fields based on Type */}
                <div className="pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Cart-Total Minimum Amount Field */}
                    {isCartLevelDiscount && (
                         <div className="space-y-2 col-span-2">
                            <label htmlFor="min_cart_amount" className="block text-sm font-medium text-slate-700 flex items-center">
                                <FaShoppingCart className='mr-2 text-blue-500' />
                                Minimum Cart Amount Required (AED) <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="min_cart_amount"
                                type="number"
                                step="0.01"
                                name="min_cart_amount" 
                                value={formData.min_cart_amount || ''} 
                                onChange={handleChange}
                                required
                                placeholder="e.g., 500.00"
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg"
                                disabled={isDisabled}
                            />
                        </div>
                    )}
                    
                    {/* Percentage Discount / Fixed Amount Off */}
                    {(formData.type?.includes('percentage') || formData.type?.includes('fixed')) && (
                        <div className="space-y-2 col-span-1">
                            <label htmlFor="discount_percent" className="block text-sm font-medium text-slate-700">
                                {formData.type?.includes('percentage') ? 'Discount Percentage (%)' : 'Fixed Amount Off (AED)'} <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="discount_percent"
                                type="number"
                                step="0.01"
                                name="discount_percent" 
                                value={formData.discount_percent || ''} 
                                onChange={handleChange}
                                required
                                placeholder={formData.type?.includes('percentage') ? 'e.g., 25' : 'e.g., 50.00'}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg"
                                disabled={isDisabled}
                            />
                        </div>
                    )}
                    
                    {/* BOGO Fields */}
                    {formData.type === 'bogo' && (
                        <>
                            <div className="space-y-2">
                                <label htmlFor="min_qty" className="block text-sm font-medium text-slate-700">
                                    Buy Quantity (X) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="min_qty"
                                    type="number"
                                    step="1"
                                    name="min_qty" 
                                    value={formData.min_qty || ''} 
                                    onChange={handleChange}
                                    required
                                    placeholder="e.g., 2"
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg"
                                    disabled={isDisabled}
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="free_qty" className="block text-sm font-medium text-slate-700">
                                    Get Free Quantity (Y) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="free_qty"
                                    type="number"
                                    step="1"
                                    name="free_qty" 
                                    value={formData.free_qty || ''} 
                                    onChange={handleChange}
                                    required
                                    placeholder="e.g., 1"
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg"
                                    disabled={isDisabled}
                                />
                            </div>
                        </>
                    )}
                </div>

                {/* Product Selector Section - HIDE for cart-level discounts */}
                {!isCartLevelDiscount && (
                    <div className="space-y-4 pt-4 border-t border-gray-100">
                        <h3 className="text-md font-semibold text-slate-800 flex items-center">
                            <FaBoxes className="mr-2 text-blue-500" />
                            Associated Products
                        </h3>
                        
                        <p className="text-sm text-gray-500 flex items-center">
                            <FaInfoCircle className="mr-1 w-3 h-3"/> Search products by name or SKU to add them to this offer.
                        </p>

                        <div className="relative">
                            {/* Search Input */}
                            <div className="flex items-center">
                                <FaSearch className="absolute left-3 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search products by Name or SKU..."
                                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    disabled={isDisabled}
                                />
                            </div>

                            {/* Search Dropdown Results */}
                            {searchQuery && (
                                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                    {searchLoading ? (
                                        <div className="flex justify-center p-4"><FaSpinner className="animate-spin text-blue-500" /></div>
                                    ) : searchResults.length > 0 ? (
                                        <ul className="divide-y divide-gray-100">
                                            {searchResults.map((product) => (
                                                <li 
                                                    key={product.id}
                                                    onClick={() => handleSelectProduct(product)}
                                                    className={`p-3 text-sm text-gray-800 cursor-pointer hover:bg-blue-50 ${isProductAlreadyAdded(product.id) ? 'bg-gray-100 text-gray-500 italic' : ''}`}
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
                        
                        {/* Selected Product List */}
                        <div className="border border-gray-200 rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                                <h4 className="text-sm font-medium text-slate-700">Products in Offer ({formData.products?.length || 0})</h4>
                            </div>
                            
                            {formData.products && formData.products.length > 0 ? (
                                <ul className="divide-y divide-gray-100">
                                    {formData.products.map((productId) => (
                                        <li key={productId} className="flex justify-between items-center px-4 py-2 hover:bg-gray-50">
                                            <span className="text-sm text-gray-800">
                                                {getProductDisplay(productId)}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveProduct(productId)}
                                                disabled={isDisabled}
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

            </div>
            
            {/* Form Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
                <button
                    type="button"
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={() => router.push('/mushrif-admin/offers')}
                    disabled={isDisabled}
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={isDisabled}
                    className={`
                        px-4 py-2 rounded-lg text-white font-medium flex items-center
                        ${isDisabled 
                            ? 'bg-gray-400 cursor-not-allowed' 
                            : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 shadow-sm'}
                    `}
                >
                    <FaSave className="w-4 h-4 mr-2" />
                    {isEditMode 
                        ? (isLoading ? 'Updating...' : 'Update Offer') 
                        : (isLoading ? 'Creating...' : 'Create Offer')
                    }
                </button>
            </div>
        </form>
    );
};

export default OfferForm;