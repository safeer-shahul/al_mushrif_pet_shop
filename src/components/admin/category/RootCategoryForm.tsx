// src/components/admin/category/RootCategoryForm.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { FaSave, FaTimes, FaUpload, FaImage, FaTrash } from 'react-icons/fa';
import { RootCategory } from '@/types/category';

interface RootCategoryFormProps {
    initialData?: Partial<RootCategory>;
    isEditMode: boolean;
    onSave: (
        data: Partial<RootCategory>,
        imageFile: File | null,
        imageRemoved: boolean,
        id?: string
    ) => Promise<void>;
    isLoading: boolean;
    error: string | null;
}

const RootCategoryForm: React.FC<RootCategoryFormProps> = ({
    initialData,
    isEditMode,
    onSave,
    isLoading,
    error
}) => {
    const [formData, setFormData] = useState<Partial<RootCategory>>({});
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imageRemoved, setImageRemoved] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [localLoading, setLocalLoading] = useState(false);
    const [showImageOptions, setShowImageOptions] = useState(false);

    useEffect(() => {
        setFormData(initialData || {});
        setImageRemoved(false);
        setImageFile(null);
        setImagePreview(initialData?.cat_image || null);
    }, [initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        if (file) {
            setImageFile(file);
            setImageRemoved(false);
            setImagePreview(URL.createObjectURL(file));

            if (showImageOptions) {
                setShowImageOptions(false);
            }
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
            await onSave(formData, imageFile, imageRemoved, formData.id);
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
            <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-slate-800">
                    {isEditMode ? `Edit: ${formData.cat_name || ''}` : 'Create New Root Category'}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                    {isEditMode ? 'Update category information' : 'Add a new root level category'}
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
                {/* Category Name */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">
                        Category Name <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        name="cat_name"
                        value={formData.cat_name || ''}
                        onChange={handleChange}
                        required
                        placeholder="Enter category name"
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        disabled={isDisabled}
                    />
                </div>

                {/* Image Upload */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">
                        Category Image
                    </label>

                    {/* Image Preview Area */}
                    <div className="relative flex flex-col items-center p-6 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                        {imagePreview ? (
                            <div className="relative w-full">
                                <div className="mx-auto w-48 h-48 mb-2 rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                                    <img
                                        src={imagePreview}
                                        alt="Category Preview"
                                        className="w-full h-full object-cover"
                                    />
                                </div>

                                {/* Image Actions */}
                                <div className="flex justify-center space-x-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowImageOptions(true)}
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
                                        htmlFor="image-upload"
                                        className="mx-auto relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none"
                                    >
                                        <span>Upload an image</span>
                                        <input
                                            id="image-upload"
                                            type="file"
                                            className="sr-only"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            disabled={isDisabled}
                                        />
                                    </label>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    Max 2MB. JPG, PNG, GIF, SVG accepted
                                </p>
                            </div>
                        )}

                        {/* Hidden file input that shows when change is clicked */}
                        {showImageOptions && (
                            <div className="absolute inset-0 bg-gray-800/75 flex items-center justify-center rounded-lg">
                                <div className="bg-white p-4 rounded-lg shadow-lg max-w-xs w-full">
                                    <h3 className="text-sm font-medium text-gray-900 mb-3">Update Image</h3>
                                    <input
                                        type="file"
                                        id="file-upload"
                                        className="block w-full text-sm text-gray-500
                                            file:mr-4 file:py-2 file:px-4
                                            file:rounded-md file:border-0
                                            file:text-sm file:font-medium
                                            file:bg-blue-50 file:text-blue-700
                                            hover:file:bg-blue-100"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                    />
                                    <div className="flex justify-end mt-4 space-x-2">
                                        <button
                                            type="button"
                                            onClick={() => setShowImageOptions(false)}
                                            className="px-3 py-1.5 text-xs text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">
                        Description
                    </label>
                    <textarea
                        name="cat_description"
                        value={formData.cat_description || ''}
                        onChange={handleChange}
                        rows={4}
                        placeholder="Enter category description"
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        disabled={isDisabled}
                    />
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
                        ? (localLoading ? 'Updating...' : 'Update Category')
                        : (localLoading ? 'Creating...' : 'Create Category')
                    }
                </button>
            </div>
        </form>
    );
};

export default RootCategoryForm;