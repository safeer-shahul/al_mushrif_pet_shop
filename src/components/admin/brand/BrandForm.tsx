// src/components/admin/brand/BrandForm.tsx
// Modified version with fix for category selection

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaSave, FaTimes, FaUpload, FaImage, FaTrash, FaCheck, FaFolder } from 'react-icons/fa';
import { Brand } from '@/types/brand';
import { RootCategory, RootCategoryIndexResponse } from '@/types/category';
import { useCategoryService } from '@/services/admin/categoryService';

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
    const router = useRouter();
    const { fetchAllRootCategories } = useCategoryService();
    
    // State for form data and image handling
    const [formData, setFormData] = useState<Partial<Brand>>(initialData || { is_active: true }); 
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imageRemoved, setImageRemoved] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [localLoading, setLocalLoading] = useState(false);
    const [showImageOptions, setShowImageOptions] = useState(false);
    
    // State for categories
    const [rootCategories, setRootCategories] = useState<RootCategory[]>([]);
    const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
    const [loadingCategories, setLoadingCategories] = useState(false);
    const [categoriesLoaded, setCategoriesLoaded] = useState(false); // New state to track when categories are loaded

    // Load root categories on component mount
    useEffect(() => {
        const loadCategories = async () => {
            setLoadingCategories(true);
            try {
                console.log("Fetching root categories...");
                const response = await fetchAllRootCategories();
                console.log("Root categories fetched:", response);
                
                let categoriesArray: RootCategory[] = [];
                
                // Handle different response formats with proper type assertions
                if (Array.isArray(response)) {
                    categoriesArray = [...response];
                    console.log("Direct array format, length:", categoriesArray.length);
                } else {
                    // Use a type assertion to tell TypeScript about the structure
                    const typedResponse = response as unknown as { root_categories?: RootCategory[] };
                    if (typedResponse.root_categories && Array.isArray(typedResponse.root_categories)) {
                        categoriesArray = [...typedResponse.root_categories];
                        console.log("Object format with root_categories, length:", categoriesArray.length);
                    }
                }
                
                console.log("Setting root categories:", categoriesArray);
                setRootCategories(categoriesArray);
                setCategoriesLoaded(true);
                
                // If we already have initialData, update selected categories now that categories are loaded
                if (initialData) {
                    // Check for both camelCase and snake_case variants
                    const rootCats = (initialData.rootCategories || (initialData as any).root_categories);
                    if (rootCats && rootCats.length > 0) {
                        const categoryIds = rootCats.map((cat: RootCategory) => cat.id);
                        console.log("Setting selected categories from initialData:", categoryIds);
                        setSelectedCategoryIds(categoryIds);
                    }
                }
            } catch (error) {
                console.error('Failed to load root categories:', error);
                setRootCategories([]);
            } finally {
                setLoadingCategories(false);
            }
        };
        
        loadCategories();
    }, [fetchAllRootCategories, initialData]);

// No need for separate useEffect to set selected categories, as we're doing it directly
// in the loadCategories function when categories are available

// Add debugging logs for the render
console.log("Render - Selected categories:", selectedCategoryIds);
console.log("Render - Root categories:", rootCategories);
console.log("Render - Initial data root categories:", initialData?.rootCategories);

    // Initialize form data when initialData changes
    useEffect(() => {
        console.log("Initial data changed:", initialData);
        setFormData(initialData || { is_active: true });
        setImageRemoved(false);
        setImageFile(null);
        setImagePreview(initialData?.brand_logo || null);
        setLocalLoading(false);
        setShowImageOptions(!!initialData?.brand_logo);
    }, [initialData]);

    // Separate effect for initializing selected categories - only runs when categories AND initialData are both available
    useEffect(() => {
        if (!categoriesLoaded || !initialData) return; // Don't run until both are ready
        
        console.log("Categories loaded and initial data available, setting selected categories");
        if (initialData.rootCategories && initialData.rootCategories.length > 0) {
            const categoryIds = initialData.rootCategories.map(cat => cat.id);
            console.log("Setting selected categories:", categoryIds);
            setSelectedCategoryIds(categoryIds);
        } else {
            console.log("No root categories in initialData, clearing selection");
            setSelectedCategoryIds([]);
        }
    }, [initialData, categoriesLoaded]); // This runs when either initialData or categoriesLoaded changes

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
            setShowImageOptions(true);
        }
    };

    const handleRemoveImage = () => {
        setImageRemoved(true);
        setImageFile(null);
        setImagePreview(null);
        setShowImageOptions(false);
    };
    
    const handleCategoryToggle = (categoryId: string) => {
        setSelectedCategoryIds(prev => {
            if (prev.includes(categoryId)) {
                return prev.filter(id => id !== categoryId);
            } else {
                return [...prev, categoryId];
            }
        });
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalLoading(true);
        
        try {
            console.log("Submitting with selected categories:", selectedCategoryIds);
            
            // Include the selected category IDs in the form data
            const dataWithCategories = {
                ...formData,
                category_ids: selectedCategoryIds
            };
            
            await onSave(dataWithCategories, imageFile, imageRemoved, formData.brand_id);
        } catch (e) {
            console.error(e);
        } finally {
            setLocalLoading(false);
        }
    };

    // For debugging
    useEffect(() => {
        console.log("Selected category IDs updated:", selectedCategoryIds);
    }, [selectedCategoryIds]);

    const isDisabled = isLoading || localLoading;

    // Rest of your component remains the same
    return (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            {/* Form Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-gray-50 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-slate-800">
                    {isEditMode ? `Edit Brand: ${formData.brand_name || ''}` : 'Create New Brand'}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                    {isEditMode ? 'Update brand details, logo, and category mappings' : 'Add a new product brand and assign it to categories'}
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
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all"
                        disabled={isDisabled}
                    />
                </div>
                
                {/* Brand Logo Upload */}
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
                                            name="brand_logo_file"
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
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all"
                        disabled={isDisabled}
                    />
                </div>

                {/* Category Mapping Section */}
                <div className="space-y-4 pt-4 border-t border-gray-100">
                    <h3 className="text-md font-semibold text-slate-800 flex items-center">
                        <FaFolder className="mr-2 text-blue-500" />
                        Category Mappings
                    </h3>
                    
                    {loadingCategories ? (
                        <div className="py-4 text-center text-sm text-gray-500">
                            Loading categories...
                        </div>
                    ) : rootCategories.length === 0 ? (
                        <div className="py-4 text-center text-sm text-gray-500">
                            No categories available. Please create categories first.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {rootCategories.map(category => (
                                <div 
                                    key={category.id}
                                    className={`
                                        p-3 border rounded-lg flex items-center space-x-3 cursor-pointer transition-colors
                                        ${selectedCategoryIds.includes(category.id) 
                                            ? 'bg-blue-50 border-blue-200' 
                                            : 'bg-white border-gray-200 hover:bg-gray-50'}
                                    `}
                                    onClick={() => handleCategoryToggle(category.id)}
                                >
                                    <div className={`
                                        w-5 h-5 flex items-center justify-center rounded-full border
                                        ${selectedCategoryIds.includes(category.id) 
                                            ? 'bg-blue-500 border-blue-500' 
                                            : 'border-gray-300'}
                                    `}>
                                        {selectedCategoryIds.includes(category.id) && (
                                            <FaCheck className="w-3 h-3 text-white" />
                                        )}
                                    </div>
                                    <div className="flex-grow">
                                        <p className="text-sm font-medium text-gray-800">{category.cat_name}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    
                    <p className="text-xs text-gray-500 mt-1">
                        Select the categories where products of this brand should appear.
                    </p>
                </div>

                {/* Is Active Toggle */}
                <div className="flex items-center pt-4 border-t border-gray-100">
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
                        Brand is active
                    </label>
                </div>
                <p className="text-xs text-gray-500 ml-7">
                    Inactive brands won't appear on the storefront but will still be available in admin reports.
                </p>
            </div>
            
            {/* Form Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
                <button
                    type="button"
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={() => router.push('/mushrif-admin/brands')}
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