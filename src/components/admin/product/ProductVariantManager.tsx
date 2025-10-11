// src/components/admin/product/ProductVariantManager.tsx
'use client';

import React, { useState, useCallback, useRef } from 'react';
// Removed: FaImage, FaUpload, FaCheck, FaTimes
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa'; 
import { ProdVariant, Product } from '@/types/product';
import { useProductService } from '@/services/admin/productService';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
// Removed: useAuth and getClient as they are now encapsulated in the service hook

interface ProductVariantManagerProps {
    product: Product;
    onVariantsUpdated: (variants: ProdVariant[]) => void;
}

const ProductVariantManager: React.FC<ProductVariantManagerProps> = ({ product, onVariantsUpdated }) => {
    // FIX: Destructure the new raw JSON functions
    const { rawCreateVariantJson, rawUpdateVariantJson, deleteVariant } = useProductService(); 
    
    // State to hold the variants (synced with parent component via onVariantsUpdated)
    const [variants, setVariants] = useState<ProdVariant[]>(product.variants || []);
    const [loading, setLoading] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [editingVariant, setEditingVariant] = useState<ProdVariant | null>(null);

    // Sync initial variants when product changes (only on load/hard refresh)
    const initialLoadRef = useRef(false);
    if (!initialLoadRef.current && product.variants) {
        setVariants(product.variants);
        initialLoadRef.current = true;
    }

    // Function to handle the global state update
    const handleLocalUpdate = (updatedVariant: ProdVariant) => {
        const newVariants = variants.map(v => v.id === updatedVariant.id ? updatedVariant : v);
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

    // ------------------------------------------------------------------
    // Nested Form Component for Add/Edit
    // ------------------------------------------------------------------
    interface VariantFormProps {
        initialData?: Partial<ProdVariant>;
        isNew: boolean;
        productId: string;
        onClose: () => void;
        onSuccess: (variant: ProdVariant) => void;
    }
    
    const VariantForm: React.FC<VariantFormProps> = ({ initialData, isNew, productId, onClose, onSuccess }) => {
        const [data, setData] = useState<Partial<ProdVariant>>({ ...initialData, prod_id: productId });
        const [localError, setLocalError] = useState<string | null>(null);
        const [saving, setSaving] = useState(false);

        // Utility to safely parse JSON from textarea for images
        const parseImagesJson = (jsonString: string): string[] | undefined => {
            try {
                const result = JSON.parse(jsonString);
                return Array.isArray(result) ? result.filter(item => typeof item === 'string') : undefined;
            } catch {
                return undefined;
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
                // Use the parsed array from state
                images: data.images || null 
            };
            
            try {
                let responseVariant: ProdVariant;
                
                // FIX: Use the new service functions directly
                if (isNew) {
                    responseVariant = await rawCreateVariantJson(productId, payload);
                } else {
                    if (!data.id) throw new Error("Missing variant ID for update.");
                    responseVariant = await rawUpdateVariantJson(productId, data.id, payload);
                }
                
                onSuccess(responseVariant);
            } catch (err: any) {
                // Set the error on the local form for visibility
                setLocalError(err.message || (isNew ? 'Failed to create variant.' : 'Failed to update variant.'));
            } finally {
                setSaving(false);
            }
        };

        return (
            <form onSubmit={handleSubmit} className="p-4 bg-gray-100 rounded-lg border border-gray-300 space-y-3">
                <h4 className="text-md font-semibold text-slate-700">{isNew ? 'Add New Variant' : `Edit: ${initialData?.variant_name || initialData?.id}`}</h4>
                
                {localError && <div className="p-2 bg-red-100 text-red-700 text-sm rounded">{localError}</div>}
                
                <div className="grid grid-cols-2 gap-3">
                    <input 
                        type="text" 
                        placeholder="Variant Name (e.g., Size S)"
                        value={data.variant_name || ''} 
                        onChange={(e) => setData(prev => ({ ...prev, variant_name: e.target.value }))}
                        className="px-3 py-2 border rounded text-sm"
                        disabled={saving}
                    />
                    <input 
                        type="text" 
                        placeholder="Color Value (e.g., #FF0000)"
                        value={data.color_value || ''} 
                        onChange={(e) => setData(prev => ({ ...prev, color_value: e.target.value }))}
                        className="px-3 py-2 border rounded text-sm"
                        disabled={saving}
                    />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <input 
                        type="number" 
                        step="0.01"
                        placeholder="Price *"
                        value={data.price || ''} 
                        onChange={(e) => setData(prev => ({ ...prev, price: Number(e.target.value) }))}
                        required
                        className="px-3 py-2 border rounded text-sm"
                        disabled={saving}
                    />
                    <input 
                        type="number" 
                        step="0.01"
                        placeholder="Offer Price (optional)"
                        value={data.offer_price || ''} 
                        onChange={(e) => setData(prev => ({ ...prev, offer_price: Number(e.target.value) }))}
                        className="px-3 py-2 border rounded text-sm"
                        disabled={saving}
                    />
                </div>
                
                {/* Images field (JSON string input) */}
                <div className="space-y-1">
                    <label className="text-xs text-gray-500 block">Image URLs (JSON Array of strings)</label>
                    <textarea 
                        placeholder='["/storage/path/img1.jpg", "/storage/path/img2.jpg"]'
                        rows={2}
                        value={data.images ? JSON.stringify(data.images) : ''} 
                        onChange={(e) => {
                            const images = parseImagesJson(e.target.value);
                            setData(prev => ({ ...prev, images }));
                        }}
                        className="w-full px-3 py-2 border rounded text-sm resize-none"
                        disabled={saving}
                    />
                </div>


                <div className="flex justify-end space-x-2">
                    <button type="button" onClick={onClose} disabled={saving} className="px-3 py-1 text-sm bg-gray-300 rounded hover:bg-gray-400">
                        Cancel
                    </button>
                    <button type="submit" disabled={saving} className={`px-3 py-1 text-sm text-white rounded transition-colors ${saving ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'}`}>
                        {saving ? (isNew ? 'Adding...' : 'Saving...') : (isNew ? 'Add Variant' : 'Save Changes')}
                    </button>
                </div>
            </form>
        );
    };
    // ------------------------------------------------------------------

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
                    onClose={() => { setIsAdding(false); setEditingVariant(null); }}
                    onSuccess={(variant) => {
                        if (isAdding) {
                            handleLocalCreate(variant);
                        } else {
                            handleLocalUpdate(variant);
                        }
                        setIsAdding(false);
                        setEditingVariant(null);
                    }}
                />
            )}

            {loading && <LoadingSpinner />}
            {apiError && <div className="p-2 bg-red-100 text-red-700 text-sm rounded">{apiError}</div>}

            {/* Variants Table */}
            {variants.length > 0 && (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                            <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                <th className="px-4 py-2">Name</th>
                                <th className="px-4 py-2">Price</th>
                                <th className="px-4 py-2">Offer Price</th>
                                <th className="px-4 py-2">Color</th>
                                <th className="px-4 py-2 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {variants.map(variant => (
                                <tr key={variant.id} className="text-sm">
                                    <td className="px-4 py-2">{variant.variant_name || product.prod_name}</td>
                                    <td className="px-4 py-2 text-gray-700">AED {variant.price.toFixed(2)}</td>
                                    <td className="px-4 py-2">
                                        {variant.offer_price ? (
                                            <span className="text-red-600 font-semibold">AED {variant.offer_price.toFixed(2)}</span>
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
                                    <td className="px-4 py-2 text-right space-x-2">
                                        <button
                                            onClick={() => { setEditingVariant(variant); setIsAdding(false); }}
                                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md"
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
                                                } catch (e: any) {
                                                    setApiError(e.message || 'Failed to delete variant.');
                                                } finally {
                                                    setLoading(false);
                                                }
                                            }}
                                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-md"
                                            title="Delete Variant"
                                        >
                                            <FaTrash size={14} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default ProductVariantManager;