// src/app/(admin)/mushrif-admin/sub-categories/create/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import SubCategoryForm from '@/components/admin/category/SubCategoryForm';
import { useCategoryService } from '@/services/admin/categoryService';
import { RootCategory, SubCategory } from '@/types/category';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const SubCategoryCreatePage: React.FC = () => {
    const router = useRouter();
    // Destructure the function needed
    const { createSubCategory, fetchAllParentCategories } = useCategoryService();
    
    const [allParents, setAllParents] = useState<(RootCategory | SubCategory)[]>([]);
    const [loadingParents, setLoadingParents] = useState(true);
    const [apiError, setApiError] = useState<string | null>(null);
    const [localLoading, setLocalLoading] = useState(false);

    // FIX: Memoize the fetch function to ensure stability and runs only once.
    const fetchParents = useCallback(async () => {
        setLoadingParents(true);
        try {
            // This is the call that hits the two APIs (root-categories, sub-categories)
            const parents = await fetchAllParentCategories();
            setAllParents(parents); 
            setApiError(null);
        } catch (err) {
            setApiError('Failed to load parent categories.');
            console.error(err);
        } finally {
            setLoadingParents(false);
        }
    }, [fetchAllParentCategories]); // Dependency: the stable service function

    // Initial load
    useEffect(() => {
        fetchParents();
    }, [fetchParents]); // Dependency: the stable fetchParents function (fixed loop)

    const handleSave = async (data: Partial<SubCategory>, imageFile: File | null, imageRemoved: boolean) => {
        setApiError(null);
        setLocalLoading(true);
        
        const formData = new FormData();
        formData.append('sub_cat_name', data.sub_cat_name || '');
        formData.append('sub_cat_description', data.sub_cat_description || '');
        formData.append('parent_id', data.parent_id || ''); 

        if (imageFile) {
            formData.append('sub_cat_image', imageFile);
        }

        try {
            const response = await createSubCategory(formData);
            alert(response.message);
            router.push('/mushrif-admin/sub-categories'); 
        } catch (err: any) {
            const errorMsg = err.message || 'A network error occurred.';
            setApiError(errorMsg);
        } finally {
            setLocalLoading(false);
        }
    };

    if (loadingParents) return <LoadingSpinner />;
    
    return (
        <div className="space-y-6">
            <SubCategoryForm 
                isEditMode={false}
                onSave={handleSave}
                allParentCategories={allParents}
                isLoading={localLoading}
                error={apiError}
            />
        </div>
    );
};

export default SubCategoryCreatePage;