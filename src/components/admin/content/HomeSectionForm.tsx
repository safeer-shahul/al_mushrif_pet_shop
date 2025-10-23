'use client';

import React, { useState, useEffect } from 'react';
import { FaSave, FaList, FaLink, FaStar, FaPlus, FaTrash } from 'react-icons/fa';
import { HomeSection } from '@/types/content';

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
    const [formData, setFormData] = useState<Partial<HomeSection>>(initialData || {
        title: '',
        is_active: true,
        order_sequence: 0,
        offer_id: '',
        product_ids: []
    });
    
    const [productIdInput, setProductIdInput] = useState('');
    const [localError, setLocalError] = useState<string | null>(null);

    // Reset local state when initialData changes
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target as HTMLInputElement;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }));
    };

    const handleAddProduct = () => {
        if (!productIdInput.trim()) return;
        
        // Check if the product ID already exists
        if (formData.product_ids?.includes(productIdInput.trim())) {
            setLocalError('This product is already in the list');
            return;
        }
        
        setFormData(prev => ({
            ...prev,
            product_ids: [...(prev.product_ids || []), productIdInput.trim()]
        }));
        setProductIdInput('');
        setLocalError(null);
    };

    const handleRemoveProduct = (productId: string) => {
        setFormData(prev => ({
            ...prev,
            product_ids: prev.product_ids?.filter(id => id !== productId)
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError(null);
        
        // Validation
        if (!formData.title?.trim()) {
            setLocalError('Section title is required');
            return;
        }
        
        // If offer_id is selected, product_ids becomes optional
        // Otherwise, require at least one product
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
                {/* Title */}
                <div className="space-y-2">
                    <label htmlFor="title" className="block text-sm font-medium text-slate-700 flex items-center">
                        <FaList className="mr-2" /> Section Title <span className="text-red-500">*</span>
                    </label>
                    <input
                        id="title"
                        type="text"
                        name="title"
                        value={formData.title || ''}
                        onChange={handleChange}
                        placeholder="e.g., New Arrivals, Featured Products, Top Deals"
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 transition-all"
                        disabled={isLoading}
                        required
                    />
                </div>

                {/* Offer Selection */}
                <div className="space-y-2">
                    <label htmlFor="offer_id" className="block text-sm font-medium text-slate-700 flex items-center">
                        <FaStar className="mr-2" /> Link to Specific Offer (Optional)
                    </label>
                    <select
                        id="offer_id"
                        name="offer_id"
                        value={formData.offer_id || ''}
                        onChange={handleChange}
                        className="w-full appearance-none px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 transition-all pr-10"
                        disabled={isLoading}
                    >
                        <option value="">-- Select Offer --</option>
                        {availableOffers.map(offer => (
                            <option key={offer.id} value={offer.id}>{offer.name}</option>
                        ))}
                    </select>
                    <p className="text-xs text-gray-500">
                        If an offer is selected, it will dynamically display products from that offer.
                    </p>
                </div>

                {/* Manual Product Selection (only if no offer is selected) */}
                {!formData.offer_id && (
                    <div className="space-y-4 pt-2">
                        <label className="block text-sm font-medium text-slate-700">
                            Add Products Manually
                        </label>
                        
                        <div className="flex space-x-2">
                            <input
                                type="text"
                                value={productIdInput}
                                onChange={(e) => setProductIdInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddProduct())}
                                placeholder="Enter Product ID"
                                className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 transition-all"
                                disabled={isLoading}
                            />
                            <button
                                type="button"
                                onClick={handleAddProduct}
                                disabled={isLoading || !productIdInput.trim()}
                                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 transition-colors"
                            >
                                <FaPlus className="inline-block mr-1" /> Add
                            </button>
                        </div>
                        
                        {/* Product List */}
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                                <h3 className="text-sm font-medium text-gray-700">Selected Products ({formData.product_ids?.length || 0})</h3>
                            </div>
                            {formData.product_ids && formData.product_ids.length > 0 ? (
                                <ul className="divide-y divide-gray-100">
                                    {formData.product_ids.map((productId, index) => (
                                        <li key={index} className="flex justify-between items-center px-4 py-3 hover:bg-gray-50">
                                            <span className="text-sm text-gray-800">Product ID: {productId}</span>
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
                                    No products selected. Add products or select an offer.
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Order and Status */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-gray-100">
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
                    
                    <div className="flex items-center mt-6 col-span-2">
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