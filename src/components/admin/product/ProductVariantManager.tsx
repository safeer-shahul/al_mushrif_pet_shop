// src/components/admin/product/ProductVariantManager.tsx
'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaDollarSign, FaSpinner } from 'react-icons/fa';
import { ProdVariant, Product, ProductImage } from '@/types/product';
import { useProductService } from '@/services/admin/productService';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ProductImageManager from './ProductImageManager';

interface ProductVariantManagerProps {
    product: Product;
    onVariantsUpdated: (variants: ProdVariant[]) => void;
    onFullDataRefresh: () => void; 
}

const ProductVariantManager: React.FC<ProductVariantManagerProps> = ({ 
    product, 
    onVariantsUpdated,
    onFullDataRefresh 
}) => {
    const { rawCreateVariantJson, rawUpdateVariantJson, deleteVariant, getStorageUrl } = useProductService();
    
    const [variants, setVariants] = useState<ProdVariant[]>(product.variants || []);
    const [loading, setLoading] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [editingVariant, setEditingVariant] = useState<ProdVariant | null>(null);

    // Sync initial variants when product changes (on first load)
    useEffect(() => {
        setVariants(product.variants || []);
    }, [product.variants]);

    const handleLocalUpdate = (updatedVariant: ProdVariant) => {
        // Ensure variant has images array
        const variantWithImages = {
            ...updatedVariant,
            images: updatedVariant.images || []
        };
        
        const newVariants = variants.map(v => 
            v.id === variantWithImages.id ? variantWithImages : v
        );
        
        setVariants(newVariants);
        onVariantsUpdated(newVariants);
    };

    const handleLocalDelete = (variantId: string) => {
        const newVariants = variants.filter(v => v.id !== variantId);
        setVariants(newVariants);
        onVariantsUpdated(newVariants);
    };

    const handleLocalCreate = (newVariant: ProdVariant) => {
        const newVariants = [...variants, newVariant];
        setVariants(newVariants);
        onVariantsUpdated(newVariants);
    };
    
    const handlePrimaryImageSet = useCallback((imageId: string) => {
        const owningVariant = variants.find(v => v.images?.some(img => img.id === imageId));
        if (owningVariant) {
             // Forcing a local update to propagate the change to the table/list view
             handleLocalUpdate({ ...owningVariant, images: owningVariant.images });
        }
    }, [variants]);

    // Nested Form Component for Add/Edit
    interface VariantFormProps {
        initialData?: Partial<ProdVariant>;
        isNew: boolean;
        productId: string;
        onClose: () => void;
        onSuccess: (variant: ProdVariant) => void;
        onFullDataRefresh: () => void;
    }
    
    const VariantForm: React.FC<VariantFormProps> = ({ initialData, isNew, productId, onClose, onSuccess, onFullDataRefresh }) => {
        const [data, setData] = useState<Partial<ProdVariant>>({ ...initialData, prod_id: productId });
        const [localError, setLocalError] = useState<string | null>(null);
        const [saving, setSaving] = useState(false);
        
        const [tempImages, setTempImages] = useState<ProductImage[]>(initialData?.images || []);

        const handleImageManagerChange = useCallback((updatedImages: ProductImage[]) => {
            setTempImages(updatedImages);
        }, []);

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const { name, value, type } = e.target;
            
            if (type === 'number' || name.includes('price')) {
                // Convert price inputs to numbers or null if empty
                const numValue = value === '' ? null : Number(value);
                setData(prev => ({ ...prev, [name]: numValue }));
            } else {
                setData(prev => ({ ...prev, [name]: value }));
            }
        };

        const handleSubmit = async (e: React.FormEvent) => {
            e.preventDefault();
            setSaving(true);
            setLocalError(null);

            if (!data.price || isNaN(Number(data.price)) || Number(data.price) <= 0) {
                setLocalError('Price is required and must be greater than 0.');
                setSaving(false);
                return;
            }
            
            const payload: Partial<ProdVariant> = {
                variant_name: data.variant_name || null,
                price: Number(data.price),
                offer_price: data.offer_price ? Number(data.offer_price) : null,
                color_value: data.color_value || null,
            };
            
            try {
                let responseVariant: ProdVariant;
                
                if (isNew) {
                    responseVariant = await rawCreateVariantJson(productId, payload);
                    // After creating a new variant, we must refresh the parent page to get the image upload context
                    onFullDataRefresh(); 
                } else {
                    if (!data.id) throw new Error("Missing variant ID for update.");
                    responseVariant = await rawUpdateVariantJson(productId, data.id, payload);
                }
                
                responseVariant.images = tempImages;
                onSuccess(responseVariant);
            } catch (err: any) {
                setLocalError(err.message || (isNew ? 'Failed to create variant.' : 'Failed to update variant.'));
            } finally {
                setSaving(false);
            }
        };

        return (
            <div className="flex flex-col space-y-4">
                <form onSubmit={handleSubmit} className="p-4 bg-gray-100 rounded-lg border border-gray-300 space-y-3">
                    <h4 className="text-md font-semibold text-slate-700">
                        {isNew ? 'Add New Variant' : `Edit: ${initialData?.variant_name || initialData?.id}`}
                    </h4>
                    
                    {localError && <div className="p-2 bg-red-100 text-red-700 text-sm rounded">{localError}</div>}
                    
                    {/* Variant Form Inputs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label htmlFor="variant_name" className="block text-sm font-medium text-slate-700">
                                Variant Name
                            </label>
                            <input
                                id="variant_name"
                                type="text"
                                name="variant_name" 
                                value={data.variant_name || ''} 
                                onChange={handleChange}
                                placeholder="e.g., Red / Large / 128GB"
                                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="color_value" className="block text-sm font-medium text-slate-700">
                                Color Value (optional)
                            </label>
                            <input
                                id="color_value"
                                type="text"
                                name="color_value" 
                                value={data.color_value || ''} 
                                onChange={handleChange}
                                placeholder="#ff0000"
                                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label htmlFor="price" className="block text-sm font-medium text-slate-700">
                                Price <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <FaDollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    id="price"
                                    type="number"
                                    step="0.01"
                                    name="price" 
                                    value={data.price || ''} 
                                    onChange={handleChange}
                                    required
                                    placeholder="0.00"
                                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 pl-10"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="offer_price" className="block text-sm font-medium text-slate-700">
                                Offer Price (optional)
                            </label>
                            <div className="relative">
                                <FaDollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    id="offer_price"
                                    type="number"
                                    step="0.01"
                                    name="offer_price" 
                                    value={data.offer_price || ''} 
                                    onChange={handleChange}
                                    placeholder="0.00"
                                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 pl-10"
                                />
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex justify-end space-x-2">
                        <button type="button" onClick={onClose} disabled={saving} className="px-3 py-1.5 text-sm bg-gray-300 rounded hover:bg-gray-400">
                            Cancel
                        </button>
                        <button type="submit" disabled={saving} className={`px-3 py-1.5 text-sm text-white rounded transition-colors ${saving ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'}`}>
                            {saving ? (
                                <>
                                    <FaSpinner className="animate-spin inline mr-1" /> 
                                    {isNew ? 'Saving...' : 'Saving...'}
                                </>
                            ) : (
                                isNew ? 'Save Variant Data' : 'Save Changes'
                            )}
                        </button>
                    </div>
                </form>
                
                {/* Image Manager for Existing Variants */}
                {!isNew && data.id && (
                    <ProductImageManager
                        parentId={data.id}
                        images={tempImages}
                        isVariantManager={true}
                        onImagesChange={handleImageManagerChange}
                        onPrimarySet={handlePrimaryImageSet}
                        onActionSuccess={onFullDataRefresh}
                    />
                )}
            </div>
        );
    };

    // If the product is not set to have variants, don't display this component
    if (!product.has_variants) {
        return null;
    }

    return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
                <h3 className="text-lg font-bold text-slate-800">Product Variants ({variants.length})</h3>
                <button 
                    onClick={() => { setIsAdding(true); setEditingVariant(null); }}
                    className="flex items-center px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm disabled:opacity-50"
                    disabled={loading || isAdding || !!editingVariant}
                >
                    <FaPlus className="mr-2 w-3 h-3" /> Add Variant
                </button>
            </div>
            
            {/* Add/Edit Form */}
            {(isAdding || editingVariant) && (
                <VariantForm 
                    productId={product.id}
                    isNew={isAdding}
                    initialData={editingVariant || {}}
                    onClose={() => { 
                        setIsAdding(false); 
                        setEditingVariant(null); 
                    }}
                    onSuccess={(variant) => {
                        if (isAdding) {
                            handleLocalCreate(variant);
                        } else {
                            handleLocalUpdate(variant);
                        }
                        setIsAdding(false);
                        setEditingVariant(null);
                    }}
                    onFullDataRefresh={onFullDataRefresh}
                />
            )}

            {loading && <LoadingSpinner />}
            {apiError && <div className="p-2 bg-red-100 text-red-700 text-sm rounded">{apiError}</div>}

            {/* Variants Table */}
            {variants.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                            <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                <th className="px-4 py-2">Name</th>
                                <th className="px-4 py-2">Price</th>
                                <th className="px-4 py-2">Offer Price</th>
                                <th className="px-4 py-2">Color</th>
                                <th className="px-4 py-2">Images</th>
                                <th className="px-4 py-2 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {variants.map(variant => {
                                const primaryImage = variant.images?.find(img => img.is_primary);
                                return (
                                    <tr key={variant.id} className="text-sm">
                                        <td className="px-4 py-2">
                                            <div className="flex items-center">
                                                {primaryImage && (
                                                    <img 
                                                        src={getStorageUrl(primaryImage.image_url) || ''}
                                                        alt={variant.variant_name || ''} 
                                                        className="w-8 h-8 object-cover rounded-full mr-2 border"
                                                    />
                                                )}
                                                {variant.variant_name || product.prod_name}
                                            </div>
                                        </td>
                                        <td className="px-4 py-2 text-gray-700">
                                            AED {typeof variant.price === 'number' ? variant.price.toFixed(2) : '0.00'}
                                        </td>
                                        <td className="px-4 py-2">
                                            {variant.offer_price ? (
                                                <span className="text-red-600 font-semibold">
                                                AED {typeof variant.offer_price === 'number' ? variant.offer_price.toFixed(2) : '0.00'}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400">N/A</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-2">
                                            <div className="flex items-center">
                                                {variant.color_value && (
                                                    <span 
                                                        className="w-4 h-4 rounded-full border border-gray-300 mr-2 flex-shrink-0" 
                                                        style={{ backgroundColor: variant.color_value }}
                                                    ></span>
                                                )}
                                                {variant.color_value || 'N/A'}
                                            </div>
                                        </td>
                                        <td className="px-4 py-2">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${variant.images?.length ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {variant.images?.length || 0}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2 text-right space-x-2">
                                            <button
                                                onClick={() => { setEditingVariant(variant); setIsAdding(false); }}
                                                className="p-1.5 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors"
                                                title="Edit Variant"
                                            >
                                                <FaEdit size={14} />
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    if (!window.confirm(`Delete variant ${variant.variant_name || variant.id}?`)) return;
                                                    setLoading(true);
                                                    try {
                                                        await deleteVariant(product.id, variant.id);
                                                        handleLocalDelete(variant.id);
                                                        onFullDataRefresh(); 
                                                    } catch (e: any) {
                                                        setApiError(e.message || 'Failed to delete variant.');
                                                    } finally {
                                                        setLoading(false);
                                                    }
                                                }}
                                                className="p-1.5 bg-red-50 text-red-700 rounded-md hover:bg-red-100 transition-colors"
                                                title="Delete Variant"
                                            >
                                                <FaTrash size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="py-6 text-center text-gray-500">
                    <p>No variants created yet. Click "Add Variant" to create your first variant.</p>
                </div>
            )}
        </div>
    );
};

export default ProductVariantManager;