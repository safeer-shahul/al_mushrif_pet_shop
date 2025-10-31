// src/components/admin/content/HeroSectionForm.tsx
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FaSave, FaImage, FaLink, FaStar, FaTimes } from 'react-icons/fa';
import { HeroSection } from '@/types/content';
import ImageUploadField from '@/components/ui/ImageUploadField'; 
import { useCategoryService } from '@/services/admin/categoryService'; 
import { useOfferService } from '@/services/admin/offerService';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface HeroSectionFormProps {
    initialData?: Partial<HeroSection>;
    isEditMode: boolean;
    // FIX: Updated onSave signature to accept two file/removal sets
    onSave: (
        data: Partial<HeroSection>, 
        pcImageFile: File | null, 
        pcImageRemoved: boolean,
        mobileImageFile: File | null, 
        mobileImageRemoved: boolean,
        isUpdate: boolean
    ) => Promise<void>; 
    onCancel: () => void;
    isLoading: boolean;
    apiError: string | null;
}

const HeroSectionForm: React.FC<HeroSectionFormProps> = ({ 
    initialData, isEditMode, onSave, onCancel, isLoading, apiError 
}) => {
    const { getStorageUrl } = useCategoryService(); 
    const { fetchAllOffers } = useOfferService();
    
    // --- NEW IMAGE STATES ---
    const [pcImageFile, setPcImageFile] = useState<File | null>(null);
    const [pcImageRemoved, setPcImageRemoved] = useState(false);
    const [mobileImageFile, setMobileImageFile] = useState<File | null>(null);
    const [mobileImageRemoved, setMobileImageRemoved] = useState(false);
    // -------------------------

    const [availableOffers, setAvailableOffers] = useState<{ id: string; name: string }[]>([]);
    const [offersLoading, setOffersLoading] = useState(true);

    const [formData, setFormData] = useState<Partial<HeroSection>>(initialData || { 
        is_active: true,
        order_sequence: 0,
        offer_id: '' 
    }); 
    const [localError, setLocalError] = useState<string | null>(null);
    
    // Use the existing image path to create a viewable URL
    const pcImagePreviewUrl = useMemo(() => {
        // FIX: Use pc_image field
        return initialData?.pc_image ? getStorageUrl(initialData.pc_image) : null;
    }, [initialData, getStorageUrl]);
    
    const mobileImagePreviewUrl = useMemo(() => {
        // FIX: Use mobile_image field
        return initialData?.mobile_image ? getStorageUrl(initialData.mobile_image) : null;
    }, [initialData, getStorageUrl]);


    // 1. Fetch Offers on Mount (Logic remains the same)
    const loadOffers = useCallback(async () => {
        setOffersLoading(true);
        try {
            const offersData = await fetchAllOffers();
            const mappedOffers = offersData.map(offer => ({
                id: offer.id,
                name: `${offer.offer_name} (${offer.type.toUpperCase()})`
            }));
            setAvailableOffers(mappedOffers);
        } catch (e) {
            console.error("Failed to fetch offers:", e);
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
        // Reset file state for both images
        setPcImageFile(null);
        setPcImageRemoved(false);
        setMobileImageFile(null);
        setMobileImageRemoved(false);
        setLocalError(null);
    }, [initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type, checked } = e.target as HTMLInputElement;
        setFormData(prev => ({ 
            ...prev, 
            [name]: type === 'checkbox' ? checked : value 
        }));
    };
    
    // --- Handlers for ImageUploadField utility ---
    const handlePcFileChange = (file: File | null) => {
        setPcImageFile(file);
        setPcImageRemoved(false);
    };
    const handlePcRemoveExisting = (removed: boolean) => {
        if (removed) {
            setPcImageRemoved(true);
            setPcImageFile(null);
        }
    };
    
    const handleMobileFileChange = (file: File | null) => {
        setMobileImageFile(file);
        setMobileImageRemoved(false);
    };
    const handleMobileRemoveExisting = (removed: boolean) => {
        if (removed) {
            setMobileImageRemoved(true);
            setMobileImageFile(null);
        }
    };
    // ---------------------------------------------


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError(null);
        
        // 1. Client-Side Validation: PC Image is mandatory
        const isPcImageMissing = !isEditMode && !pcImageFile;
        const isPcImageRemoved = isEditMode && !pcImageFile && pcImageRemoved && !initialData?.pc_image;

        if (isPcImageMissing || isPcImageRemoved) {
            setLocalError("The PC/Desktop banner image is required for a new banner.");
            return;
        }
        
        // 2. Client-Side Validation: Link Check
        if (!formData.slug && !formData.offer_id) {
            toast("Banner has no link/offer attached. It will be decorative only.", { 
                icon: '⚠️', 
                duration: 3000 
            });
        }

        // Call the service, passing both file sets
        await onSave(
            formData, 
            pcImageFile, 
            pcImageRemoved, 
            mobileImageFile, 
            mobileImageRemoved, 
            isEditMode
        );
    };
    
    const currentPcPreview = pcImageFile ? URL.createObjectURL(pcImageFile) : (pcImageRemoved ? null : pcImagePreviewUrl);
    const currentMobilePreview = mobileImageFile ? URL.createObjectURL(mobileImageFile) : (mobileImageRemoved ? null : mobileImagePreviewUrl);


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
                
                {/* 1. Image Upload Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* PC/Desktop Image Field */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-700 flex items-center">
                            <FaImage className='mr-1 text-blue-500' /> PC/Desktop Banner (Required)
                        </label>
                        <ImageUploadField
                            name="pc_image_file"
                            label="Choose PC Image"
                            existingImageUrl={currentPcPreview}
                            onChange={handlePcFileChange}
                            onRemoveExisting={handlePcRemoveExisting}
                            disabled={isLoading}
                        />
                        <p className="text-xs text-gray-500">
                            (Landscape recommended: e.g., 1200x400px)
                        </p>
                    </div>
                    
                    {/* Mobile Image Field */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-700 flex items-center">
                            <FaImage className='mr-1 text-blue-500' /> Mobile Banner (Optional)
                        </label>
                        <ImageUploadField
                            name="mobile_image_file"
                            label="Choose Mobile Image"
                            existingImageUrl={currentMobilePreview}
                            onChange={handleMobileFileChange}
                            onRemoveExisting={handleMobileRemoveExisting}
                            disabled={isLoading}
                        />
                        <p className="text-xs text-gray-500">
                            (Portrait/Square recommended: e.g., 600x600px)
                        </p>
                    </div>
                </div>

                {/* 2. Target Link (Unchanged) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* ... (Slug Field) ... */}
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
                    {/* ... (Offer Link Field) ... */}
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

                {/* 3. Order and Status (Unchanged) */}
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
                    // Disabled if loading OR if it's new/empty AND PC image is missing
                    disabled={isLoading || (!isEditMode && !pcImageFile)} 
                    className={`
                        px-4 py-2 rounded-lg text-white font-medium flex items-center
                        ${isLoading || (!isEditMode && !pcImageFile)
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