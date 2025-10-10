// src/app/(admin)/mushrif-admin/root-categories/[id]/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import RootCategoryForm from '@/components/admin/category/RootCategoryForm';
import { useCategoryService } from '@/services/admin/categoryService';
import { RootCategory } from '@/types/category';

const RootCategoryEditPage: React.FC = () => {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;
    const { fetchRootCategoryById, updateRootCategory, getStorageUrl } = useCategoryService();

    const [currentCategory, setCurrentCategory] = useState<RootCategory | null>(null);
    const [loading, setLoading] = useState(true);
    const [apiError, setApiError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;

        const fetchData = async () => {
            try {
                const categoryData = await fetchRootCategoryById(id);
                // Prepend storage URL for display
                categoryData.cat_image = getStorageUrl(categoryData.cat_image); 
                setCurrentCategory(categoryData);
            } catch (err) {
                setApiError('Failed to load category details.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id, fetchRootCategoryById, getStorageUrl]);

    const handleUpdate = async (data: Partial<RootCategory>, imageFile: File | null, imageRemoved: boolean, categoryId?: string) => {
        setApiError(null);
        if (!categoryId) {
            setApiError("Update failed: Category ID is missing.");
            return;
        }

        const formData = new FormData();
        // Append all text fields
        formData.append('cat_name', data.cat_name || '');
        formData.append('cat_description', data.cat_description || '');

        // Append file or signal removal
        if (imageFile) {
            formData.append('cat_image', imageFile);
        } else if (imageRemoved) {
            // Signal to backend to remove existing image
            formData.append('cat_image_removed', 'true');
        }

        try {
            const response = await updateRootCategory(categoryId, formData);
            alert(response.message);
            router.push('/mushrif-admin/root-categories'); 
        } catch (err: any) {
            const errorMsg = err.message || 'A network error occurred.';
            setApiError(errorMsg);
        }
    };

    if (loading) return <LoadingSpinner />;
    if (!currentCategory) return <div className="text-red-500">Category not found or failed to load.</div>;
    
    return (
        <div className="space-y-6">
            <RootCategoryForm 
                initialData={currentCategory} 
                isEditMode={true}
                onSave={(data, file, removed, id) => handleUpdate(data, file, removed, id)}
                isLoading={loading}
                error={apiError}
            />
        </div>
    );
};

export default RootCategoryEditPage;