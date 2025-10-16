// src/app/(admin)/mushrif-admin/brands/create/page.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import BrandForm from '@/components/admin/brand/BrandForm';
import { useBrandService } from '@/services/admin/brandService';
import { Brand } from '@/types/brand';

const BrandCreatePage: React.FC = () => {
    const router = useRouter();
    const { createBrand } = useBrandService();
    
    const [apiError, setApiError] = useState<string | null>(null);
    const [localLoading, setLocalLoading] = useState(false);

    const handleSave = async (data: Partial<Brand>, imageFile: File | null, imageRemoved: boolean) => {
        setApiError(null);
        setLocalLoading(true);
        
        const formData = new FormData();
        formData.append('brand_name', data.brand_name || '');
        formData.append('brand_description', data.brand_description || '');
        formData.append('is_active', (data.is_active ? '1' : '0'));

        // Handle category IDs
        if (data.category_ids && Array.isArray(data.category_ids)) {
            console.log("Appending category IDs to form:", data.category_ids);
            data.category_ids.forEach(categoryId => {
                formData.append('category_ids[]', categoryId);
            });
        }

        if (imageFile) {
            console.log("Appending image file:", imageFile.name);
            formData.append('brand_logo', imageFile); 
        }

        // Log the form data for debugging
        console.log("Form data entries:");
        for (const pair of formData.entries()) {
            console.log(pair[0], pair[1]);
        }

        try {
            const response = await createBrand(formData);
            console.log("Create brand response:", response);
            alert(response.message);
            router.push('/mushrif-admin/brands'); 
        } catch (err: any) {
            const errorMsg = err.message || 'A network error occurred.';
            setApiError(errorMsg);
        } finally {
            setLocalLoading(false);
        }
    };
    
    // The imageRemoved argument is included for API consistency
    const onSaveWrapper = (data: Partial<Brand>, imageFile: File | null, imageRemoved: boolean, id?: string) => 
        handleSave(data, imageFile, imageRemoved);

    return (
        <div className="space-y-6">
            <BrandForm 
                isEditMode={false}
                onSave={onSaveWrapper}
                isLoading={localLoading}
                error={apiError}
            />
        </div>
    );
};

export default BrandCreatePage;