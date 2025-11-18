// src/components/admin/category/SubCategoryForm.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { FaSave, FaTimes, FaUpload, FaImage, FaTrash } from 'react-icons/fa';
import { RootCategory, SubCategory } from '@/types/category';

interface FlatCategory {
    id: string;
    name: string;
    path: string;
    rootName: string; // Key for grouping
    depth: number;
}

interface GroupedCategoriesType {
    [key: string]: FlatCategory[];
}

interface SubCategoryFormProps {
    initialData?: Partial<SubCategory>;
    isEditMode: boolean;
    onSave: (
        data: Partial<SubCategory>, 
        imageFile: File | null, 
        imageRemoved: boolean, 
        id?: string
    ) => Promise<void>; 
    allParentCategories: (RootCategory | SubCategory)[];
    isLoading: boolean;
    error: string | null;
}

// Helper hook to process the mixed, potentially redundant category data
const useFlattenedParents = (allParentCategories: (RootCategory | SubCategory)[], currentId?: string) => {
    return useMemo(() => {
        const uniqueFlatList: { [id: string]: FlatCategory } = {};

        const getChildren = (category: any): any[] => {
            if (category.sub_categories && Array.isArray(category.sub_categories)) return category.sub_categories;
            if (category.children && Array.isArray(category.children)) return category.children;
            return [];
        };

        const traverse = (category: any, path: string[], depth: number, rootName: string) => {
            const categoryId = category.id || category.cat_id;
            const categoryName = category.cat_name || category.sub_cat_name || "Unknown";
            
            if (!categoryId || categoryId === currentId) return;

            const currentPath = [...path, categoryName];

            // Add the current category to the unique list (Root or Sub)
            if (!uniqueFlatList[categoryId]) {
                uniqueFlatList[categoryId] = {
                    id: categoryId,
                    name: categoryName,
                    path: currentPath.join(' > '),
                    rootName: rootName,
                    depth: depth
                };
            }
            
            // Recurse through children
            const children = getChildren(category);
            children.forEach(child => {
                traverse(child, currentPath, depth + 1, rootName);
            });
        };

        // 1. Traverse the full RootCategory tree structures for paths (first part of the array)
        allParentCategories.filter(c => 'cat_name' in c).forEach(root => {
            traverse(root, [], 0, root.cat_name);
        });

        const flatList = Object.values(uniqueFlatList);
        
        // 2. Group the flattened list by the top-level root name
        const groupedMap: GroupedCategoriesType = {};
        flatList.forEach(cat => {
            if (!groupedMap[cat.rootName]) {
                groupedMap[cat.rootName] = [];
            }
            groupedMap[cat.rootName].push(cat);
        });

        // 3. Sort the categories within each group by path (for correct hierarchy order)
        Object.keys(groupedMap).forEach(key => {
            groupedMap[key].sort((a, b) => a.path.localeCompare(b.path));
        });

        return groupedMap;
    }, [allParentCategories, currentId]);
};


const SubCategoryForm: React.FC<SubCategoryFormProps> = ({ 
    initialData, 
    isEditMode, 
    onSave, 
    allParentCategories,
    isLoading, 
    error 
}) => {
    const [formData, setFormData] = useState<Partial<SubCategory>>(initialData || {}); 
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imageRemoved, setImageRemoved] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [localLoading, setLocalLoading] = useState(false);
    const [showImageOptions, setShowImageOptions] = useState(false);

    // Generate the grouped and path-aware list of parent categories
    const parentCategoryMap = useFlattenedParents(allParentCategories, formData.id);

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
            setImagePreview(initialData.sub_cat_image || null);
        } else {
            setFormData({});
            setImagePreview(null);
        }
        setImageRemoved(false);
        setImageFile(null);
        setLocalLoading(false);
    }, [initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            const file = files[0];
            setImageFile(file);
            setImageRemoved(false);
            setImagePreview(URL.createObjectURL(file));
            setShowImageOptions(false);
        }
    };

    const handleRemoveImage = () => {
        setImageRemoved(true);
        setImageFile(null);
        setImagePreview(null);
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
            <div className="px-6 py-4 bg-gradient-to-r from-indigo-50 to-slate-50 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-slate-800">
                    {isEditMode ? `Edit: ${formData.sub_cat_name || ''}` : 'Create New Sub Category'}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                    {isEditMode ? 'Update sub category information' : 'Add a new sub category under a parent'}
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
                {/* Parent Selector */}
                <div className="space-y-2">
                    <label htmlFor="parent_id" className="block text-sm font-medium text-slate-700">
                        Parent Category <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <select
                            id="parent_id"
                            name="parent_id"
                            value={formData.parent_id || ''}
                            onChange={handleChange}
                            required
                            className="w-full appearance-none px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all pr-10"
                            disabled={isEditMode || isDisabled}
                        >
                            <option value="">-- Select Parent Category --</option>
                            
                            {/* Render Grouped Categories with Full Path */}
                            {Object.entries(parentCategoryMap).map(([groupName, categories]) => (
                                categories.length > 0 && (
                                    <optgroup key={groupName} label={groupName}>
                                        {categories.map((cat) => (
                                            <option key={cat.id} value={cat.id} className="font-medium">
                                                {cat.path} 
                                            </option>
                                        ))}
                                    </optgroup>
                                )
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </div>
                    </div>
                    {isEditMode && (
                        <p className="text-xs text-indigo-500 italic mt-1">
                            Parent relationship cannot be changed after creation
                        </p>
                    )}
                </div>

                {/* Sub Category Name */}
                <div className="space-y-2">
                    <label htmlFor="sub_cat_name" className="block text-sm font-medium text-slate-700">
                        Sub Category Name <span className="text-red-500">*</span>
                    </label>
                    <input
                        id="sub_cat_name"
                        type="text"
                        name="sub_cat_name" 
                        value={formData.sub_cat_name || ''} 
                        onChange={handleChange}
                        required
                        placeholder="Enter sub category name"
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        disabled={isDisabled}
                    />
                </div>
                
                {/* Image Upload */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">
                        Sub Category Image
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
                                        className="px-3 py-1.5 text-xs text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors"
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
                                        htmlFor="sub-image-upload"
                                        className="mx-auto relative cursor-pointer rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none"
                                    >
                                        <span>Upload an image</span>
                                        <input
                                            id="sub-image-upload"
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
                                        id="sub-file-upload"
                                        className="block w-full text-sm text-gray-500
                                            file:mr-4 file:py-2 file:px-4
                                            file:rounded-md file:border-0
                                            file:text-sm file:font-medium
                                            file:bg-indigo-50 file:text-indigo-700
                                            hover:file:bg-indigo-100"
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
                    <label htmlFor="sub_cat_description" className="block text-sm font-medium text-slate-700">
                        Description
                    </label>
                    <textarea
                        id="sub_cat_description"
                        name="sub_cat_description"
                        value={formData.sub_cat_description || ''}
                        onChange={handleChange}
                        rows={4}
                        placeholder="Enter sub category description"
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
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
                            : 'bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 shadow-sm'}
                    `}
                >
                    <FaSave className="w-4 h-4 mr-2" />
                    {isEditMode 
                        ? (localLoading ? 'Updating...' : 'Update Sub Category') 
                        : (localLoading ? 'Creating...' : 'Create Sub Category')
                    }
                </button>
            </div>
        </form>
    );
};

export default SubCategoryForm;