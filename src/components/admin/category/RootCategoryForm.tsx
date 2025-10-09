// src/components/admin/category/RootCategoryForm.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { FaSave, FaTimes } from 'react-icons/fa';
import { RootCategory } from '@/types/category';
import ImageUploadField from '@/components/ui/ImageUploadField';

/**
 * Props for the RootCategoryForm component.
 * * NOTE on onSave signature:
 * data: The text field data (name, description).
 * imageFile: The newly selected File object, or null.
 * imageRemoved: Boolean flag indicating if the user explicitly clicked the remove button on an existing image.
 * id: Optional ID, present only in Edit mode.
 */
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

const RootCategoryForm: React.FC<RootCategoryFormProps> = ({ initialData, isEditMode, onSave, isLoading, error }) => {
    // State to manage text inputs
    const [formData, setFormData] = useState<Partial<RootCategory>>({}); 
    // State to hold the binary file selected by the user
    const [imageFile, setImageFile] = useState<File | null>(null);
    // Flag to tell the parent handler (and thus the backend) that an existing image should be deleted
    const [imageRemoved, setImageRemoved] = useState(false);
    // Local loading state for form submission feedback
    const [localLoading, setLocalLoading] = useState(false);

    // 1. Initialize/Reset Form Data on initialData change (e.g., navigating to edit another category)
    useEffect(() => {
        setFormData(initialData || {});
        setImageRemoved(false);
        setImageFile(null); // Clear any previous file selection
    }, [initialData]);

    // 2. Handle Text Input Changes
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // 3. Handle File Input Changes (passed from ImageUploadField)
    const handleImageChange = (file: File | null) => {
        setImageFile(file);
        // If a new file is selected, it means the existing one (if any) is replaced, not removed explicitly.
        if (file) {
            setImageRemoved(false); 
        }
    };
    
    // 4. Handle Explicit Removal of Existing Image (passed from ImageUploadField)
    const handleImageRemoveExisting = (removed: boolean) => {
        setImageRemoved(removed);
        // If the existing image is explicitly removed, ensure no file is queued for upload.
        if (removed) {
            setImageFile(null); 
        }
    };

    // 5. Form Submission Handler
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalLoading(true);
        
        try {
            // Call the parent onSave handler with all necessary data
            await onSave(formData, imageFile, imageRemoved, formData.id); 
        } catch (e) {
            // Error handling is primarily done in the parent component, but log locally
            console.error(e); 
        } finally {
            setLocalLoading(false);
        }
    };
    
    const title = isEditMode 
        ? `Edit Root Category: ${formData.cat_name || ''}`
        : `Create New Root Category`;

    // Disable state check
    const isDisabled = isLoading || localLoading;

    return (
        <div className="p-6 bg-white rounded-xl shadow-lg border-t-4 border-primary">
            <h2 className="text-xl font-semibold mb-6 text-primary">{title}</h2>
            
            {error && (
                <div className="p-3 mb-4 text-sm font-medium rounded-lg text-red-700 bg-red-100">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Category Name */}
                <label className="block">
                    <span className="text-gray-700 font-medium">Category Name *</span>
                    <input
                        type="text"
                        name="cat_name" 
                        value={formData.cat_name || ''} 
                        onChange={handleChange}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                        disabled={isDisabled}
                    />
                </label>
                
                {/* Image Upload Component */}
                <ImageUploadField 
                    name="cat_image"
                    label="Category Image"
                    existingImageUrl={formData.cat_image} // The URL from the backend
                    onChange={handleImageChange} // Handles new file selection
                    onRemoveExisting={handleImageRemoveExisting} // Handles explicit removal in edit mode
                    disabled={isDisabled}
                />

                {/* Description */}
                <label className="block">
                    <span className="text-gray-700 font-medium">Description</span>
                    <textarea
                        name="cat_description"
                        value={formData.cat_description || ''}
                        onChange={handleChange}
                        rows={3}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                        disabled={isDisabled}
                    />
                </label>

                {/* Save Button */}
                <div className="pt-4 border-t border-gray-200">
                    <button
                        type="submit"
                        disabled={isDisabled}
                        className={`flex items-center justify-center w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white ${
                            isDisabled
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-primary hover:bg-primary-light transition'
                        }`}
                    >
                        <FaSave className="mr-2" /> 
                        {isEditMode 
                            ? (localLoading ? 'Updating...' : 'Update Category') 
                            : (localLoading ? 'Creating...' : 'Create Category')
                        }
                    </button>
                </div>
            </form>
        </div>
    );
};

export default RootCategoryForm;