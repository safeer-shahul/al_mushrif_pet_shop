// src/components/admin/offer/OfferForm.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { FaSave, FaTimes, FaTag, FaDollarSign, FaBoxes, FaPlus, FaTrash, FaInfoCircle } from 'react-icons/fa';
import { Offer, OfferType } from '@/types/offer'; 
import { useProductService } from '@/services/admin/productService'; 
import { Product } from '@/types/product'; 
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface OfferFormProps {
    initialData?: Partial<Offer>;
    isEditMode: boolean;
    onSave: (data: Partial<Offer>) => Promise<void>; 
    isLoading: boolean;
    error: string | null;
}

const OFFER_TYPES: { value: OfferType, label: string }[] = [
    { value: 'percentage', label: 'Percentage Discount' },
    { value: 'fixed_amount', label: 'Fixed Amount Off (e.g., AED 10 off)' },
    { value: 'bogo', label: 'Buy X Get Y Free (BOGO)' },
];

const OfferForm: React.FC<OfferFormProps> = ({ 
    initialData, 
    isEditMode, 
    onSave, 
    isLoading, 
    error 
}) => {
    const router = useRouter();
    const { fetchAllProducts } = useProductService(); 
    
    const [formData, setFormData] = useState<Partial<Offer>>(initialData || { 
        type: 'percentage', 
        products: [] 
    }); 
    const [productInput, setProductInput] = useState('');
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [productsLoading, setProductsLoading] = useState(true);
    const [localError, setLocalError] = useState<string | null>(null);

    // Fetch all products (for showing SKUs/names in picker)
    useEffect(() => {
        const loadProducts = async () => {
            setProductsLoading(true);
            try {
                const fetchedProducts = await fetchAllProducts(); 
                setAllProducts(fetchedProducts);
            } catch (e) {
                console.error("Failed to load products for picker:", e);
            } finally {
                setProductsLoading(false);
            }
        };
        loadProducts();
    }, [fetchAllProducts]);

    useEffect(() => {
        setFormData(initialData || { type: 'percentage', products: [] });
    }, [initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target as HTMLInputElement;
        
        if (name.includes('price') || name.includes('qty') || type === 'number') {
            const numValue = value === '' ? null : Number(value);
            setFormData(prev => ({ ...prev, [name]: numValue }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleAddProduct = () => {
        if (!productInput.trim()) return;
        
        const productIdToAdd = productInput.trim(); 
        
        if (formData.products?.includes(productIdToAdd)) {
            setLocalError('Product already added.');
            return;
        }

        setFormData(prev => ({
            ...prev,
            products: [...(prev.products || []), productIdToAdd]
        }));
        setProductInput('');
        setLocalError(null);
    };

    const handleRemoveProduct = (productId: string) => {
        setFormData(prev => ({
            ...prev,
            products: prev.products?.filter(id => id !== productId)
        }));
    };
    
    const getProductInfo = (productId: string) => {
        // Search by UUID or by human-readable prod_id (SKU)
        return allProducts.find(p => p.id === productId || p.prod_id === productId);
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError(null);
        
        // Basic Client-side validation
        if (!formData.offer_name?.trim()) {
            setLocalError('Offer Name is required.');
            return;
        }
        
        if (formData.type === 'percentage' && (!formData.discount_percent || formData.discount_percent <= 0 || formData.discount_percent > 100)) {
            setLocalError('Percentage must be between 1 and 100.');
            return;
        }
        
        if (formData.type === 'bogo' && (!formData.min_qty || !formData.free_qty || formData.min_qty <= 0 || formData.free_qty <= 0)) {
            setLocalError('Buy and Get quantities must be greater than zero for BOGO offers.');
            return;
        }
        
        await onSave(formData);
    };

    const isDisabled = isLoading;

    return (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            {/* Header - Using Blue gradient from other forms */}
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
                
                {/* Offer Name */}
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

                {/* Offer Type */}
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

                {/* Discount Fields based on Type */}
                <div className="pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Percentage Discount / Fixed Amount Off (Uses same field in backend) */}
                    {(formData.type === 'percentage' || formData.type === 'fixed_amount') && (
                        <div className="space-y-2 col-span-1">
                            <label htmlFor="discount_percent" className="block text-sm font-medium text-slate-700">
                                {formData.type === 'percentage' ? 'Discount Percentage (%)' : 'Fixed Amount Off (AED)'} <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="discount_percent"
                                type="number"
                                step="0.01"
                                name="discount_percent" 
                                value={formData.discount_percent || ''} 
                                onChange={handleChange}
                                required
                                placeholder={formData.type === 'percentage' ? 'e.g., 25' : 'e.g., 50.00'}
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

                {/* Product Selector Section */}
                <div className="space-y-4 pt-4 border-t border-gray-100">
                    <h3 className="text-md font-semibold text-slate-800 flex items-center">
                        <FaBoxes className="mr-2 text-blue-500" />
                        Associated Products
                    </h3>
                    
                    <p className="text-sm text-gray-500 flex items-center">
                        <FaInfoCircle className="mr-1 w-3 h-3"/> Add Product IDs (UUIDs) that this offer applies to.
                    </p>

                    <div className="flex space-x-2">
                        <input
                            type="text"
                            value={productInput}
                            onChange={(e) => {
                                setProductInput(e.target.value);
                                setLocalError(null);
                            }}
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddProduct())}
                            placeholder={productsLoading ? "Loading products..." : "Enter Product UUID or SKU"}
                            className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            disabled={isDisabled || productsLoading}
                        />
                        <button
                            type="button"
                            onClick={handleAddProduct}
                            disabled={isDisabled || !productInput.trim()}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                        >
                            <FaPlus className="inline-block mr-1" /> Add
                        </button>
                    </div>

                    {/* Product List */}
                    <div className="border border-gray-200 rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                        {formData.products && formData.products.length > 0 ? (
                            <ul className="divide-y divide-gray-100">
                                {formData.products.map((productId, index) => {
                                    const product = getProductInfo(productId);
                                    return (
                                        <li key={index} className="flex justify-between items-center px-4 py-2 hover:bg-gray-50">
                                            <span className="text-sm text-gray-800">
                                                {product?.prod_name || 'Product Not Found'} 
                                                <span className="text-xs text-gray-500 ml-2">({product?.prod_id || productId})</span>
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
                                    );
                                })}
                            </ul>
                        ) : (
                            <div className="p-4 text-center text-gray-500 text-sm">
                                No products associated with this offer.
                            </div>
                        )}
                    </div>
                </div>

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