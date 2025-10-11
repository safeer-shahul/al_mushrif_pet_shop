// src/components/admin/brand/BrandForm.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { FaSave, FaTimes, FaUpload, FaImage, FaTrash } from 'react-icons/fa';
import { Brand } from '@/types/brand';

interface BrandFormProps {
    initialData?: Partial<Brand>;
    isEditMode: boolean;
    onSave: (
        data: Partial<Brand>, 
        imageFile: File | null, 
        imageRemoved: boolean, 
        id?: string
    ) => Promise<void>; 
    isLoading: boolean;
    error: string | null;
}

const BrandForm: React.FC<BrandFormProps> = ({ 
    initialData, 
    isEditMode, 
    onSave, 
    isLoading, 
    error 
}) => {
    // Note: Brand uses 'brand_logo' and 'brand_name' properties
    const [formData, setFormData] = useState<Partial<Brand>>(initialData || { is_active: true }); 
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imageRemoved, setImageRemoved] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [localLoading, setLocalLoading] = useState(false);
    const [showImageOptions, setShowImageOptions] = useState(false);

    // Reset form when initialData changes
    useEffect(() => {
        setFormData(initialData || { is_active: true });
        setImageRemoved(false);
        setImageFile(null);
        setImagePreview(initialData?.brand_logo || null);
        setLocalLoading(false);
        setShowImageOptions(!!initialData?.brand_logo);
    }, [initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type, checked } = e.target as HTMLInputElement;
        setFormData(prev => ({ 
            ...prev, 
            [name]: type === 'checkbox' ? checked : value 
        }));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        if (file) {
            setImageFile(file);
            setImageRemoved(false);
            setImagePreview(URL.createObjectURL(file));
            setShowImageOptions(true); // Show options after selection
        }
    };

    const handleRemoveImage = () => {
        setImageRemoved(true);
        setImageFile(null);
        setImagePreview(null);
        setShowImageOptions(false);
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalLoading(true);
        
        try {
            // Pass the primary key 'brand_id'
            await onSave(formData, imageFile, imageRemoved, formData.brand_id); 
        } catch (e) {
            console.error(e); 
        } finally {
            setLocalLoading(false);
        }
    };

    const isDisabled = isLoading || localLoading;

    return (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Form Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-teal-50 to-slate-50 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-slate-800">
                    {isEditMode ? `Edit Brand: ${formData.brand_name || ''}` : 'Create New Brand'}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                    {isEditMode ? 'Update brand details and logo' : 'Add a new product brand'}
                </p>
            </div>

            {/* Error Display */}
            {error && (
                <div className="mx-6 mt-4 p-3 bg-red-50 border-l-4 border-red-500 rounded-md">
                    <div className="flex items-center">
                        <FaTimes className="w-5 h-5 text-red-500 mr-2" />
                        <p className="text-sm text-red-700 font-medium">{error}</p>
                    </div>
                </div>
            )}

            {/* Form Content */}
            <div className="p-6 space-y-6">
                
                {/* Brand Name */}
                <div className="space-y-2">
                    <label htmlFor="brand_name" className="block text-sm font-medium text-slate-700">
                        Brand Name <span className="text-red-500">*</span>
                    </label>
                    <input
                        id="brand_name"
                        type="text"
                        name="brand_name" 
                        value={formData.brand_name || ''} 
                        onChange={handleChange}
                        required
                        placeholder="Enter brand name"
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        disabled={isDisabled}
                    />
                </div>
                
                {/* Brand Logo Upload (Reusing the robust image logic) */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">
                        Brand Logo
                    </label>
                    
                    {/* Image Preview Area */}
                    <div className="relative flex flex-col items-center p-6 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                        {imagePreview && !imageRemoved ? (
                            <div className="relative w-full">
                                <div className="mx-auto w-40 h-20 mb-4 rounded-lg overflow-hidden border border-gray-200 shadow-sm flex items-center justify-center">
                                    <img 
                                        src={imagePreview}
                                        alt="Brand Logo Preview" 
                                        className="max-w-full max-h-full object-contain p-2"
                                    />
                                </div>
                                
                                {/* Image Actions */}
                                <div className="flex justify-center space-x-2">
                                    <button
                                        type="button"
                                        onClick={() => { document.getElementById('brand-image-upload')?.click(); }}
                                        className="px-3 py-1.5 text-xs text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                                    >
                                        <FaUpload className="inline-block w-3 h-3 mr-1" />
                                        Change
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleRemoveImage}
                                        className="px-3 py-1.5 text-xs text-red-700 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
                                    >
                                        <FaTrash className="inline-block w-3 h-3 mr-1" />
                                        Remove
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center">
                                <FaImage className="mx-auto h-12 w-12 text-gray-400" />
                                <div className="mt-4 flex text-sm text-gray-500">
                                    <label
                                        htmlFor="brand-image-upload"
                                        className="mx-auto relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none"
                                    >
                                        <span>Upload Logo</span>
                                        <input
                                            id="brand-image-upload"
                                            type="file"
                                            name="brand_logo_file" // Use a file name distinct from the API field name
                                            className="sr-only"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            disabled={isDisabled}
                                        />
                                    </label>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    Max 2MB. Recommended: Landscape logo for best display.
                                </p>
                            </div>
                        )}
                        {/* Hidden input to handle the actual file selection */}
                        <input
                            id="brand-file-upload-hidden"
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleImageChange}
                        />
                    </div>
                </div>
                
                {/* Description */}
                <div className="space-y-2">
                    <label htmlFor="brand_description" className="block text-sm font-medium text-slate-700">
                        Description
                    </label>
                    <textarea
                        id="brand_description"
                        name="brand_description"
                        value={formData.brand_description || ''}
                        onChange={handleChange}
                        rows={3}
                        placeholder="Enter a brief description for the brand"
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        disabled={isDisabled}
                    />
                </div>

                {/* Is Active Toggle */}
                <div className="flex items-center">
                    <input
                        id="is_active"
                        name="is_active"
                        type="checkbox"
                        checked={!!formData.is_active}
                        onChange={handleChange}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        disabled={isDisabled}
                    />
                    <label htmlFor="is_active" className="ml-3 block text-sm font-medium text-slate-700">
                        Is Active (Display on frontend)
                    </label>
                </div>
            </div>
            
            {/* Form Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
                <button
                    type="button"
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={() => window.history.back()}
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
                        ? (localLoading ? 'Updating...' : 'Update Brand') 
                        : (localLoading ? 'Creating...' : 'Create Brand')
                    }
                </button>
            </div>
        </form>
    );
};

export default BrandForm;