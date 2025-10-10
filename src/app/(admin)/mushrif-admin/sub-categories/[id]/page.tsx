// src/app/(admin)/mushrif-admin/sub-categories/[id]/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import SubCategoryForm from '@/components/admin/category/SubCategoryForm';
import { useCategoryService } from '@/services/admin/categoryService';
import { RootCategory, SubCategory } from '@/types/category';

const SubCategoryEditPage: React.FC = () => {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;
    const { fetchSubCategoryById, updateSubCategory, fetchAllParentCategories, getStorageUrl } = useCategoryService();

    const [currentCategory, setCurrentCategory] = useState<SubCategory | null>(null);
    const [allParents, setAllParents] = useState<(RootCategory | SubCategory)[]>([]);
    const [loading, setLoading] = useState(true);
    const [apiError, setApiError] = useState<string | null>(null);
    const [localLoading, setLocalLoading] = useState(false);

    // Fetch category and parent list
    const fetchData = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        try {
            // 1. Fetch the specific Sub Category
            const categoryData = await fetchSubCategoryById(id);
            categoryData.sub_cat_image = getStorageUrl(categoryData.sub_cat_image); 
            setCurrentCategory(categoryData);
            
            // 2. Fetch all parents (excluding the current category itself, which cannot be its own parent)
            const parents = await fetchAllParentCategories();
            setAllParents(parents.filter(cat => cat.id !== id));
            
        } catch (err) {
            setApiError('Failed to load category details or parent list.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [id, fetchSubCategoryById, fetchAllParentCategories, getStorageUrl]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);


    // Handle the form submission (Update)
    const handleUpdate = async (
        data: Partial<SubCategory>, 
        imageFile: File | null, 
        imageRemoved: boolean, 
        categoryId?: string
    ) => {
        setApiError(null);
        if (!categoryId) {
            setApiError("Update failed: Category ID is missing.");
            return;
        }
        setLocalLoading(true);

        const formData = new FormData();
        
        // 1. Append Text fields (using sub_cat_name for the model update)
        formData.append('sub_cat_name', data.sub_cat_name || '');
        formData.append('sub_cat_description', data.sub_cat_description || '');

        // NOTE: parent_id is immutable, so it is not sent in the update payload.

        // 2. Append File or Removal Flag
        if (imageFile) {
            formData.append('sub_cat_image', imageFile);
        } else if (imageRemoved) {
            formData.append('sub_cat_image_removed', 'true');
        }
        
        // 3. CRITICAL: Append the method spoofing field for Laravel PUT
        formData.append('_method', 'PUT'); 

        try {
            const response = await updateSubCategory(categoryId, formData);
            alert(response.message);
            router.push('/mushrif-admin/sub-categories'); 
        } catch (err: any) {
            const errorMsg = err.message || 'A network error occurred.';
            setApiError(errorMsg);
        } finally {
            setLocalLoading(false);
        }
    };

    if (loading) return <LoadingSpinner />;
    if (!currentCategory) return <div className="text-red-500">Category not found or failed to load.</div>;
    
    return (
        <div className="space-y-6">
            <SubCategoryForm 
                initialData={currentCategory} 
                isEditMode={true}
                onSave={(data, file, removed, id) => handleUpdate(data, file, removed, id)}
                allParentCategories={allParents}
                isLoading={localLoading}
                error={apiError}
            />
        </div>
    );
};

export default SubCategoryEditPage;