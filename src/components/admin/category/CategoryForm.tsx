// src/components/admin/category/CategoryForm.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { FaSave, FaTimes } from 'react-icons/fa';
import { AnyCategory, RootCategory, SubCategory } from '@/types/category';
import { useApiClient } from '@/utils/ApiClient';

interface CategoryFormProps {
  initialData: Partial<RootCategory & SubCategory & { parent_id: string }>; // FIX: Include SubCategory fields here too for initialData type safety
  isEditMode: boolean;
  // FIX 1: Ensure 'id' parameter is optional and typed as string | undefined
  onSave: (data: any, id?: string) => Promise<void>; 
  allCategories: AnyCategory[]; // Full list of categories for parent selection
  isLoading: boolean;
  error: string | null;
}

const CategoryForm: React.FC<CategoryFormProps> = ({ initialData, isEditMode, onSave, allCategories, isLoading, error }) => {
  // Initialize state with a merged type that includes the necessary fields
  const [formData, setFormData] = useState(initialData); 
  const [isSubCategory, setIsSubCategory] = useState(isEditMode ? ('parent_id' in initialData && !!initialData.parent_id) : false);
  const [localLoading, setLocalLoading] = useState(false);

  useEffect(() => {
    setFormData(initialData);
    if (isEditMode) {
      setIsSubCategory('parent_id' in initialData && !!initialData.parent_id);
    }
  }, [initialData, isEditMode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleToggleCategoryType = () => {
    if (isEditMode) return; 

    setIsSubCategory(prev => !prev);
    setFormData(prev => ({
      ...prev,
      parent_id: !isSubCategory ? '' : undefined, 
      // The API uses the 'is_root_category' flag to determine the model
      is_root_category: isSubCategory, 
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalLoading(true);
    
    // Determine the ID to pass to the parent handler
    const categoryId = formData.id as string | undefined;

    // Payload structure mapping the frontend fields to the backend API fields
    const payload = {
      // The API controller looks for 'cat_name' regardless of root/sub, 
      // but in the sub-category case, Laravel updates 'sub_cat_name'.
      cat_name: (formData.cat_name || formData.sub_cat_name) || '', 
      cat_image: formData.cat_image || null,
      cat_description: formData.cat_description || null,
      
      // Fields needed by the store controller logic:
      parent_id: isSubCategory ? formData.parent_id : null,
      is_root_category: !isSubCategory, // True if creating a root category
    };
    
    try {
      await onSave(payload, categoryId); // Pass the optional ID
    } catch (e) {
      console.error(e); 
    } finally {
      setLocalLoading(false);
    }
  };
  
  // FIX 2: Use the model's specific name fields safely with type assertion and checks
  const currentName = (formData as RootCategory).cat_name || (formData as SubCategory).sub_cat_name;
  
  const formTitle = isEditMode 
    ? `Edit ${isSubCategory ? 'Sub Category' : 'Root Category'}: ${currentName || ''}`
    : `Create New ${isSubCategory ? 'Sub' : 'Root'} Category`;


  return (
    <div className="p-6 bg-white rounded-xl shadow-lg border-t-4 border-primary">
      <h2 className="text-xl font-semibold mb-6 text-primary">{formTitle}</h2>
      
      {(error || !isEditMode) && (
        <div className={`p-3 mb-4 text-sm font-medium rounded-lg ${error ? 'text-red-700 bg-red-100' : 'text-blue-700 bg-blue-100'}`}>
          {error || 'Note: You are creating a new category. Choose its type below.'}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Category Type Toggle (Disabled in Edit Mode) */}
        <div className="flex items-center space-x-4">
            <span className="text-gray-700 font-medium">Category Type:</span>
            <button
                type="button"
                onClick={handleToggleCategoryType}
                disabled={isEditMode || isLoading || localLoading}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                    isSubCategory
                        ? 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200'
                        : 'bg-primary text-white hover:bg-primary-light'
                } ${isEditMode ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
                {isSubCategory ? 'Sub Category' : 'Root Category'}
            </button>
        </div>

        {/* Parent Selector (Only for Sub Categories) */}
        {isSubCategory && (
            <label className="block">
                <span className="text-gray-700">Parent Category *</span>
                <select
                    name="parent_id"
                    value={formData.parent_id || ''}
                    onChange={handleChange}
                    required={isSubCategory}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                    disabled={isEditMode}
                >
                    <option value="">-- Select Parent (Root or Sub) --</option>
                    {allCategories.map(cat => (
                        <option key={cat.id} value={cat.id}>
                            {'parent_id' in cat ? `— ${cat.sub_cat_name} (Sub)` : `${cat.cat_name} (Root)`}
                        </option>
                    ))}
                </select>
            </label>
        )}

        {/* Category Name (cat_name for API submission) */}
        <label className="block">
            <span className="text-gray-700">Category Name *</span>
            <input
                type="text"
                name="cat_name" // Use cat_name for the input name for simplicity
                value={currentName || ''} 
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                disabled={isLoading || localLoading}
            />
        </label>
        
        {/* Image URL */}
        <label className="block">
            <span className="text-gray-700">Image URL (Placeholder)</span>
            <input
                type="text"
                name="cat_image"
                value={formData.cat_image || ''}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                disabled={isLoading || localLoading}
            />
        </label>

        {/* Description */}
        <label className="block">
            <span className="text-gray-700">Description</span>
            <textarea
                name="cat_description"
                value={formData.cat_description || ''}
                onChange={handleChange}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                disabled={isLoading || localLoading}
            />
        </label>

        {/* Save Button */}
        <div className="pt-4 border-t border-gray-200">
            <button
                type="submit"
                disabled={isLoading || localLoading}
                className={`flex items-center justify-center w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white ${
                    isLoading || localLoading
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-primary hover:bg-primary-light transition'
                }`}
            >
                <FaSave className="mr-2" /> {isEditMode ? (localLoading ? 'Updating...' : 'Update Category') : (localLoading ? 'Creating...' : 'Create Category')}
            </button>
        </div>
      </form>
    </div>
  );
};

export default CategoryForm;