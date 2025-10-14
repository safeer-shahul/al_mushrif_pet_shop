// src/components/admin/product/ProductForm.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { FaSave, FaInfoCircle, FaDollarSign } from 'react-icons/fa';
import { Product, ProductFilters, ProductImage } from '@/types/product';
import { Brand } from '@/types/brand';
import { SubCategory } from '@/types/category';
import { FilterType } from '@/types/filter';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ProductImageManager from './ProductImageManager'; // Dedicated image manager component

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
    const router = useRouter();
    
    const [formData, setFormData] = useState<Partial<Product>>(initialData || {
        can_return: true,
        can_replace: true,
        product_filters: {},
        base_price: null,
        base_offer_price: null,
        base_quantity: null,
    }); 
    const [localLoading, setLocalLoading] = useState(false);

    // State for base product images (only relevant if !hasVariants and in edit mode)
    const [baseImages, setBaseImages] = useState<ProductImage[]>(initialData?.images || []);


    const hasVariants = useMemo(() => {
        // A product has variants if it's in edit mode AND the variants array is non-empty.
        return isEditMode && (initialData?.variants?.length ?? 0) > 0;
    }, [isEditMode, initialData?.variants]);


    useEffect(() => {
        // Hydrate the form data on initial load or when initialData changes
        setFormData(prev => ({
            ...initialData,
            ...prev,
            product_filters: initialData?.product_filters || {},
            can_return: initialData?.can_return ?? true,
            can_replace: initialData?.can_replace ?? true,
            base_price: initialData?.base_price ?? null,
            base_offer_price: initialData?.base_offer_price ?? null,
            base_quantity: initialData?.base_quantity ?? null,
        }));
        setBaseImages(initialData?.images || []);
    }, [initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type, checked } = e.target as HTMLInputElement;
        
        if (type === 'checkbox') {
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else if (type === 'number' || name.includes('price') || name.includes('quantity')) {
            // Convert price/quantity inputs to numbers or null if empty
            const numValue = value === '' ? null : Number(value);
            setFormData(prev => ({ ...prev, [name]: numValue }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };
    
    const handleFilterChange = useCallback((filterTypeId: string, itemId: string, isChecked: boolean) => {
        setFormData(prev => {
            const currentFilters: ProductFilters = prev.product_filters || {};
            let itemIds = currentFilters[filterTypeId] || [];

            if (isChecked) {
                itemIds = [...itemIds, itemId];
            } else {
                itemIds = itemIds.filter(id => id !== itemId);
            }

            const newFilters = { ...currentFilters, [filterTypeId]: itemIds.filter(Boolean) };
            if (newFilters[filterTypeId].length === 0) {
                delete newFilters[filterTypeId];
            }
            
            return { ...prev, product_filters: newFilters };
        });
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalLoading(true);
        try {
            await onSave(formData, formData.id); 
        } catch (e) {
            console.error(e); 
        } finally {
            setLocalLoading(false);
        }
    };
    
    // --- UX Helper for Category Path ---
    const getCategoryPath = useCallback((subCatId: string | null): string => {
        if (!subCatId) return '';

        const path = [];
        let currentCat: SubCategory | undefined = allSubCategories.find(c => c.id === subCatId);

        const pathMap = new Map<string, SubCategory>();
        allSubCategories.forEach(c => pathMap.set(c.id, c));
        
        while (currentCat) {
            path.push(currentCat.sub_cat_name);
            
            if (!currentCat.parent_id) break; 
            
            // Look up parent using parent_id (assuming parent is also in allSubCategories or null/root)
            const parentCat = pathMap.get(currentCat.parent_id);
            if (!parentCat) break;
            
            currentCat = parentCat;
        }

        // 1. Reverse path: [sub_cat_n, sub_cat_n-1, ..., Root] -> [Root, ..., sub_cat_n]
        const fullPath = path.reverse().join(' > ');
        
        // 2. Remove the name of the leaf node (sub_cat_n), leaving only the ancestors
        const segments = fullPath.split(' > ');
        if (segments.length > 1) {
            segments.pop(); // Remove the leaf node name
            return segments.join(' > ');
        }
        return ''; // No parent path to show
        
    }, [allSubCategories]);
    // ------------------------------------

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
                            {allSubCategories.map((cat) => {
                                const parentPath = getCategoryPath(cat.id);
                                return (
                                    <option key={cat.id} value={cat.id}>
                                        {/* Display: Parent_Cat > Sub_Cat_1 > ... > Sub_Cat_N */}
                                        {parentPath ? `${parentPath} > ${cat.sub_cat_name}` : cat.sub_cat_name}
                                    </option>
                                );
                            })}
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

                {/* Base Pricing, Quantity, and Images Section (Conditional) */}
                {!hasVariants && (
                    <div className="pt-4 border-t border-gray-100 space-y-6">
                        <h3 className="text-md font-semibold text-slate-800">
                            Pricing & Inventory 
                            <span className="text-sm text-gray-500 ml-2 font-normal">
                                ({isEditMode ? 'No variants found' : 'Optional if variants will be added later'})
                            </span>
                        </h3>
                        
                        {/* Pricing and Quantity Inputs */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            
                            {/* Base Price */}
                            <div className="space-y-2">
                                <label htmlFor="base_price" className="block text-sm font-medium text-slate-700">
                                    Base Price (AED)
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
                                        placeholder="0.00"
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all pl-10"
                                        disabled={isDisabled}
                                    />
                                </div>
                            </div>
                            
                            {/* Base Offer Price */}
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

                            {/* Base Quantity */}
                            <div className="space-y-2">
                                <label htmlFor="base_quantity" className="block text-sm font-medium text-slate-700">
                                    Stock Quantity
                                </label>
                                <div className="relative">
                                    <input
                                        id="base_quantity"
                                        type="number"
                                        step="1"
                                        name="base_quantity" 
                                        value={formData.base_quantity ?? ''} 
                                        onChange={handleChange}
                                        placeholder="0"
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all"
                                        disabled={isDisabled}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Base Image Manager */}
                        {isEditMode && formData.id ? (
                            <ProductImageManager
                                parentId={formData.id}
                                images={baseImages}
                                isVariantManager={false}
                                onImagesChange={setBaseImages}
                                onPrimarySet={(imageId) => { /* Handle base image primary change */ }}
                            />
                        ) : (
                             <p className="text-sm text-gray-500 italic">
                                Save the product first to enable image upload.
                            </p>
                        )}
                    </div>
                )}
                
                {/* Returns and Replace Toggles - unchanged */}
                <div className="pt-4 border-t border-gray-100">
                    {/* ... */}
                </div>

                {/* Filter Selector Section - unchanged */}
                <div className="pt-4 border-t border-gray-100">
                    {/* ... */}
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