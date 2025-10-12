// src/components/admin/product/ProductForm.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation'; // Added useRouter for Cancel button
import { FaSave, FaInfoCircle, FaDollarSign } from 'react-icons/fa';
import { Product, ProductFilters } from '@/types/product';
import { Brand } from '@/types/brand';
import { SubCategory } from '@/types/category';
import { FilterType } from '@/types/filter';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

// Assume types are imported from their respective paths:
// import { Brand } from '@/types/brand';
// import { SubCategory } from '@/types/category';
// import { FilterType } from '@/types/filter';

interface ProductFormProps {
    initialData?: Partial<Product>;
    isEditMode: boolean;
    onSave: (data: Partial<Product>, id?: string) => Promise<void>;
    isLoading: boolean;
    error: string | null;
    
    allBrands: Brand[];
    allSubCategories: SubCategory[];
    allFilterTypes: FilterType[];
    dependenciesLoading: boolean;
    dependenciesError: string | null;
}

const ProductForm: React.FC<ProductFormProps> = ({ 
    initialData, 
    isEditMode, 
    onSave, 
    isLoading, 
    error,
    allBrands,
    allSubCategories,
    allFilterTypes,
    dependenciesLoading,
    dependenciesError,
}) => {
    const router = useRouter(); // Initialize router
    
    const [formData, setFormData] = useState<Partial<Product>>(initialData || {
        can_return: true,
        can_replace: true,
        product_filters: {},
        base_price: null,
        base_offer_price: null,
    }); 
    const [localLoading, setLocalLoading] = useState(false);

    // Helper to determine if we should show base price fields (only if no variants exist in Edit mode)
    const hasVariants = useMemo(() => {
        return isEditMode && (initialData?.variants?.length ?? 0) > 0;
    }, [isEditMode, initialData?.variants]);


    useEffect(() => {
        // Hydrate the form data on initial load or when initialData changes
        setFormData(prev => ({
            ...initialData,
            ...prev,
            product_filters: initialData?.product_filters || {},
            // Use ?? to set defaults only if the initialData field is explicitly null or undefined
            can_return: initialData?.can_return ?? true,
            can_replace: initialData?.can_replace ?? true,
            base_price: initialData?.base_price ?? null,
            base_offer_price: initialData?.base_offer_price ?? null,
        }));
    }, [initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type, checked } = e.target as HTMLInputElement;
        
        if (type === 'checkbox') {
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else if (type === 'number' || name.includes('price')) {
            // Convert price inputs to numbers or null if empty
            const numValue = value === '' ? null : Number(value);
            setFormData(prev => ({ ...prev, [name]: numValue }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };
    
    // Handler for the complex product_filters field
    const handleFilterChange = useCallback((filterTypeId: string, itemId: string, isChecked: boolean) => {
        setFormData(prev => {
            const currentFilters: ProductFilters = prev.product_filters || {};
            let itemIds = currentFilters[filterTypeId] || [];

            if (isChecked) {
                // Add item ID
                itemIds = [...itemIds, itemId];
            } else {
                // Remove item ID
                itemIds = itemIds.filter(id => id !== itemId);
            }

            // Clean up empty arrays
            const newFilters = { ...currentFilters, [filterTypeId]: itemIds.filter(Boolean) };
            if (newFilters[filterTypeId].length === 0) {
                delete newFilters[filterTypeId];
            }
            
            return { ...prev, product_filters: newFilters };
        });
    }, []);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Basic validation for base price if no variants exist
        if (!hasVariants && (!formData.base_price || formData.base_price <= 0)) {
            alert("Base Price is required and must be greater than zero for products without variants.");
            return;
        }

        setLocalLoading(true);
        
        try {
            await onSave(formData, formData.id); 
        } catch (e) {
            console.error(e); 
        } finally {
            setLocalLoading(false);
        }
    };

    const isDisabled = isLoading || localLoading || dependenciesLoading;

    if (dependenciesLoading) {
        return <LoadingSpinner />;
    }

    return (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            {/* Form Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-gray-50 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-slate-800">
                    {isEditMode ? `Edit Product: ${formData.prod_name || ''}` : 'Create New Product'}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                    Define the core product attributes, category, brand, and filtering options.
                </p>
            </div>

            {/* Error Display */}
            {(error || dependenciesError) && (
                <div className="mx-6 mt-4 p-3 bg-red-50 border-l-4 border-red-500 rounded-md">
                    <p className="text-sm text-red-700 font-medium">{error || dependenciesError}</p>
                </div>
            )}

            {/* Form Content */}
            <div className="p-6 space-y-8">
                
                {/* Product Name and ID */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label htmlFor="prod_name" className="block text-sm font-medium text-slate-700">
                            Product Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="prod_name"
                            type="text"
                            name="prod_name" 
                            value={formData.prod_name || ''} 
                            onChange={handleChange}
                            required
                            placeholder="e.g., Cat Scratch Post - Deluxe Edition"
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all"
                            disabled={isDisabled}
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <label htmlFor="prod_id" className="block text-sm font-medium text-slate-700">
                            Product ID (SKU) <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="prod_id"
                            type="text"
                            name="prod_id" 
                            value={formData.prod_id || ''} 
                            onChange={handleChange}
                            required
                            placeholder="e.g., CAT-SCRT-001"
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all"
                            disabled={isDisabled}
                        />
                    </div>
                </div>

                {/* Categories and Brands */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label htmlFor="sub_cat_id" className="block text-sm font-medium text-slate-700">
                            Sub Category
                        </label>
                        <select
                            id="sub_cat_id"
                            name="sub_cat_id"
                            value={formData.sub_cat_id || ''}
                            onChange={handleChange}
                            className="w-full appearance-none px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all pr-10"
                            disabled={isDisabled}
                        >
                            <option value="">-- Select Sub Category --</option>
                            {allSubCategories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.sub_cat_name}
                                </option>
                            ))}
                        </select>
                         <p className="text-xs text-gray-500 mt-1">
                            Only leaf-node categories (with no children) are shown.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="brand_id" className="block text-sm font-medium text-slate-700">
                            Brand <span className="text-red-500">*</span>
                        </label>
                        <select
                            id="brand_id"
                            name="brand_id"
                            value={formData.brand_id || ''}
                            onChange={handleChange}
                            required
                            className="w-full appearance-none px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all pr-10"
                            disabled={isDisabled}
                        >
                            <option value="">-- Select Brand --</option>
                            {allBrands.filter(b => b.is_active).map((brand) => (
                                <option key={brand.brand_id} value={brand.brand_id}>
                                    {brand.brand_name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* NEW: Base Pricing Section (Conditional) */}
                {!hasVariants && (
                    <div className="pt-4 border-t border-gray-100">
                        <h3 className="text-md font-semibold text-slate-800 mb-3">
                            Pricing Details 
                            <span className="text-sm text-gray-500 ml-2 font-normal">
                                ({isEditMode ? 'No variants found' : 'Used if no variants are added later'})
                            </span>
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            
                            <div className="space-y-2">
                                <label htmlFor="base_price" className="block text-sm font-medium text-slate-700">
                                    Base Price (AED) <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <FaDollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        id="base_price"
                                        type="number"
                                        step="0.01"
                                        name="base_price" 
                                        value={formData.base_price ?? ''} 
                                        onChange={handleChange}
                                        required={!hasVariants} // Make required if no variants exist
                                        placeholder="0.00"
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all pl-10"
                                        disabled={isDisabled}
                                    />
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <label htmlFor="base_offer_price" className="block text-sm font-medium text-slate-700">
                                    Base Offer Price (Optional)
                                </label>
                                <div className="relative">
                                    <FaDollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        id="base_offer_price"
                                        type="number"
                                        step="0.01"
                                        name="base_offer_price" 
                                        value={formData.base_offer_price ?? ''} 
                                        onChange={handleChange}
                                        placeholder="0.00"
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all pl-10"
                                        disabled={isDisabled}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {/* END NEW PRICING SECTION */}


                {/* Returns and Replace Toggles */}
                <div className="pt-4 border-t border-gray-100">
                    <h3 className="text-md font-semibold text-slate-800 mb-3">Policy Options</h3>
                    <div className="flex items-center space-x-8">
                        <div className="flex items-center">
                            <input
                                id="can_return"
                                name="can_return"
                                type="checkbox"
                                checked={!!formData.can_return}
                                onChange={handleChange}
                                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                disabled={isDisabled}
                            />
                            <label htmlFor="can_return" className="ml-3 block text-sm font-medium text-slate-700">
                                Allow Returns
                            </label>
                        </div>
                        <div className="flex items-center">
                            <input
                                id="can_replace"
                                name="can_replace"
                                type="checkbox"
                                checked={!!formData.can_replace}
                                onChange={handleChange}
                                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                disabled={isDisabled}
                            />
                            <label htmlFor="can_replace" className="ml-3 block text-sm font-medium text-slate-700">
                                Allow Replacements
                            </label>
                        </div>
                    </div>
                </div>

                {/* Filter Selector Section */}
                <div className="pt-4 border-t border-gray-100">
                    <h3 className="text-md font-semibold text-slate-800 mb-3 flex items-center">
                        Product Filters
                        <FaInfoCircle className="ml-2 w-4 h-4 text-gray-400" title="Select filter items that apply to this product. This will be used for customer browsing." />
                    </h3>

                    {allFilterTypes.length === 0 ? (
                        <p className="text-sm text-gray-500 italic">No filter types have been configured yet. Please configure them first.</p>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {allFilterTypes.map(type => (
                                <div key={type.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50/50">
                                    <h4 className="font-medium text-sm text-slate-700 border-b pb-2 mb-2">{type.filter_type_name}</h4>
                                    <div className="space-y-1 max-h-40 overflow-y-auto">
                                        {type.items && type.items.length > 0 ? (
                                            type.items.map(item => {
                                                const isSelected = formData.product_filters?.[type.id]?.includes(item.id) || false;
                                                return (
                                                    <div key={item.id} className="flex items-center">
                                                        <input
                                                            id={`filter-${item.id}`}
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={(e) => handleFilterChange(type.id, item.id, e.target.checked)}
                                                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                            disabled={isDisabled}
                                                        />
                                                        <label htmlFor={`filter-${item.id}`} className="ml-2 text-sm text-gray-700">
                                                            {item.filter_name}
                                                        </label>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <p className="text-xs text-gray-400">No items available.</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                
            </div>
            
            {/* Form Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
                <button
                    type="button"
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={() => router.push('/mushrif-admin/products')}
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
                        ? (localLoading ? 'Updating...' : 'Update Product') 
                        : (localLoading ? 'Creating...' : 'Create Product')
                    }
                </button>
            </div>
        </form>
    );
};

export default ProductForm;