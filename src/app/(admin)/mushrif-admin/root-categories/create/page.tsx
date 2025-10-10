// src/app/(admin)/mushrif-admin/root-categories/create/page.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import RootCategoryForm from '@/components/admin/category/RootCategoryForm';
import { useCategoryService } from '@/services/admin/categoryService';
import { RootCategory } from '@/types/category';

const RootCategoryCreatePage: React.FC = () => {
    const router = useRouter();
    const { createRootCategory } = useCategoryService();
    const [apiError, setApiError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSave = async (data: Partial<RootCategory>, imageFile: File | null, imageRemoved: boolean) => {
        setApiError(null);
        setLoading(true);
        
        const formData = new FormData();
        formData.append('cat_name', data.cat_name || '');
        formData.append('cat_description', data.cat_description || '');

        if (imageFile) {
            formData.append('cat_image', imageFile); // This is the crucial part
        }
        // No need to append 'imageRemoved' on create

        try {
            const response = await createRootCategory(formData);
            alert(response.message);
            router.push('/mushrif-admin/root-categories'); 
        } catch (err: any) {
            const errorMsg = err.message || 'A network error occurred.';
            setApiError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <RootCategoryForm 
                isEditMode={false}
                onSave={handleSave}
                isLoading={loading}
                error={apiError}
            />
        </div>
    );
};

export default RootCategoryCreatePage;