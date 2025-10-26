// src/components/admin/content/HeroSectionForm.tsx
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FaSave, FaImage, FaLink, FaStar, FaTimes } from 'react-icons/fa';
import { HeroSection } from '@/types/content';
import ImageUploadField from '@/components/ui/ImageUploadField'; 
import { useCategoryService } from '@/services/admin/categoryService'; 
// 💡 Import useOfferService
import { useOfferService } from '@/services/admin/offerService';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/ui/LoadingSpinner'; // Ensure this is imported

interface HeroSectionFormProps {
    initialData?: Partial<HeroSection>;
    isEditMode: boolean;
    onSave: (data: Partial<HeroSection>, imageFile: File | null, imageRemoved: boolean, isUpdate: boolean) => Promise<void>; 
    onCancel: () => void;
    isLoading: boolean;
    apiError: string | null;
    // ❌ Removed static 'availableOffers' prop
    // availableOffers: { id: string; name: string }[]; 
}

const HeroSectionForm: React.FC<HeroSectionFormProps> = ({ 
    initialData, isEditMode, onSave, onCancel, isLoading, apiError 
    // ❌ Removed 'availableOffers' from destructuring
}) => {
    const { getStorageUrl } = useCategoryService(); 
    // 💡 NEW: Initialize Offer Service
    const { fetchAllOffers } = useOfferService();
    
    // 💡 NEW STATE: Store dynamic offers
    const [availableOffers, setAvailableOffers] = useState<{ id: string; name: string }[]>([]);
    const [offersLoading, setOffersLoading] = useState(true);

    const [formData, setFormData] = useState<Partial<HeroSection>>(initialData || { 
        is_active: true,
        order_sequence: 0,
        offer_id: '' 
    }); 
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imageRemoved, setImageRemoved] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);
    
    // Use the existing image path to create a viewable URL
    const imagePreviewUrl = useMemo(() => {
        return initialData?.image ? getStorageUrl(initialData.image) : null;
    }, [initialData, getStorageUrl]);

    // 1. Fetch Offers on Mount
    const loadOffers = useCallback(async () => {
        setOffersLoading(true);
        try {
            const offersData = await fetchAllOffers();
            
            // Map the full Offer object to the simple { id, name } structure needed for the dropdown
            const mappedOffers = offersData.map(offer => ({
                id: offer.id,
                name: `${offer.offer_name} (${offer.type.toUpperCase()})`
            }));

            setAvailableOffers(mappedOffers);
        } catch (e) {
            console.error("Failed to fetch offers:", e);
            // Show a non-blocking toast/error that offers failed to load
            toast.error("Failed to load available offers for selection.", { id: 'offer-load-error' });
        } finally {
            setOffersLoading(false);
        }
    }, [fetchAllOffers]);

    useEffect(() => {
        loadOffers();
    }, [loadOffers]);

    // Sync initial data and reset local state when initialData changes
    useEffect(() => {
        setFormData(initialData || { 
            is_active: true, 
            order_sequence: 0,
            offer_id: '' 
        });
        setImageFile(null);
        setImageRemoved(false);
        setLocalError(null);
    }, [initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type, checked } = e.target as HTMLInputElement;
        setFormData(prev => ({ 
            ...prev, 
            [name]: type === 'checkbox' ? checked : value 
        }));
    };
    
    // Handlers for ImageUploadField utility
    const handleFileChange = (file: File | null) => {
        setImageFile(file);
        setImageRemoved(false);
    };

    const handleRemoveExisting = (removed: boolean) => {
        if (removed) {
            setImageRemoved(true);
            setImageFile(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError(null);
        
        // 1. Client-Side Validation: Image check (mandatory for new banners)
        if (!isEditMode && !imageFile) {
            setLocalError("A banner image is required.");
            return;
        }
        
        // 2. Client-Side Validation: Link Check (Softened - allow saving without a link)
        if (!formData.slug && !formData.offer_id) {
            toast("Banner has no link/offer attached. It will be decorative only.", { 
                icon: '⚠️', 
                duration: 3000 
            });
        }

        // Call the service, marking whether we are in edit mode
        await onSave(formData, imageFile, imageRemoved, isEditMode);
    };
    
    const currentPreview = imageFile ? URL.createObjectURL(imageFile) : (imageRemoved ? null : imagePreviewUrl);

    // Show a spinner if we are loading offers or performing an action
    if (offersLoading) {
        return <LoadingSpinner />;
    }

    return (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-gray-50 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-slate-800">
                    {isEditMode ? `Edit Hero Banner: ${formData.slug || 'No Slug'}` : 'Create New Hero Banner'}
                </h2>
            </div>
            
            {(apiError || localError) && (
                <div className="mx-6 mt-4 p-3 bg-red-50 border-l-4 border-red-500 rounded-md">
                    <p className="text-sm text-red-700 font-medium">{apiError || localError}</p>
                </div>
            )}

            <div className="p-6 space-y-6">
                
                {/* 1. Image Upload Field */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">
                        Banner Image (Max 2MB) <span className={isEditMode ? 'text-gray-400' : 'text-red-500'}>*</span>
                    </label>
                    
                    <ImageUploadField
                        name="image_file"
                        label="Choose Banner File"
                        existingImageUrl={currentPreview}
                        onChange={handleFileChange}
                        onRemoveExisting={handleRemoveExisting}
                        disabled={isLoading}
                    />
                    <p className="text-xs text-gray-500">
                        File should be landscape (e.g., 1200x400px)
                    </p>
                </div>

                {/* 2. Target Link */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label htmlFor="slug" className="block text-sm font-medium text-slate-700 flex items-center">
                            <FaLink className='mr-2' /> Internal Slug (Optional)
                        </label>
                        <input
                            id="slug"
                            type="text"
                            name="slug" 
                            value={formData.slug || ''} 
                            onChange={handleChange}
                            placeholder="e.g., /products?brand=nike"
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all"
                            disabled={isLoading}
                        />
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="offer_id" className="block text-sm font-medium text-slate-700 flex items-center">
                            <FaStar className='mr-2 text-yellow-500' /> Link to Specific Offer (Optional)
                        </label>
                        <select
                            id="offer_id"
                            name="offer_id"
                            value={formData.offer_id || ''}
                            onChange={handleChange}
                            className="w-full appearance-none px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all pr-10"
                            disabled={isLoading}
                        >
                            <option value="">-- Select Offer --</option>
                            {availableOffers.map(offer => (
                                <option key={offer.id} value={offer.id}>{offer.name}</option>
                            ))}
                        </select>
                        <p className='text-xs text-gray-500'>This overrides the Internal Slug.</p>
                    </div>
                </div>

                {/* 3. Order and Status */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-gray-100">
                    <div className="space-y-2">
                        <label htmlFor="order_sequence" className="block text-sm font-medium text-slate-700">
                            Order Sequence
                        </label>
                        <input
                            id="order_sequence"
                            type="number"
                            name="order_sequence" 
                            value={formData.order_sequence || 0} 
                            onChange={handleChange}
                            min="0"
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all"
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
                            className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            disabled={isLoading}
                        />
                        <label htmlFor="is_active" className="ml-3 block text-sm font-medium text-slate-700">
                            Banner is Active / Visible
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
                    disabled={isLoading || (!imageFile && !initialData?.image && !isEditMode)}
                    className={`
                        px-4 py-2 rounded-lg text-white font-medium flex items-center
                        ${isLoading 
                            ? 'bg-gray-400 cursor-not-allowed' 
                            : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 shadow-sm'}
                    `}
                >
                    <FaSave className="w-4 h-4 mr-2" />
                    {isEditMode 
                        ? (isLoading ? 'Updating...' : 'Update Banner') 
                        : (isLoading ? 'Creating...' : 'Create Banner')
                    }
                </button>
            </div>
        </form>
    );
};

export default HeroSectionForm;