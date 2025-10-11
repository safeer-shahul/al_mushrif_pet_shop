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

    const handleSave = async (data: Partial<Brand>, imageFile: File | null) => {
        setApiError(null);
        setLocalLoading(true);
        
        const formData = new FormData();
        formData.append('brand_name', data.brand_name || '');
        formData.append('brand_description', data.brand_description || '');
        formData.append('is_active', (data.is_active ? '1' : '0'));  

        if (imageFile) {
            // Laravel expects 'brand_logo' for the file
            formData.append('brand_logo', imageFile); 
        }

        try {
            const response = await createBrand(formData);
            
            // Show success toast (using a simple alert as placeholder for a real toast library)
            alert(response.message);
            
            router.push('/mushrif-admin/brands'); 
        } catch (err: any) {
            const errorMsg = err.message || 'A network error occurred.';
            setApiError(errorMsg);
        } finally {
            setLocalLoading(false);
        }
    };
    
    // The imageRemoved argument is ignored in the Create flow
    const onSaveWrapper = (data: Partial<Brand>, imageFile: File | null, imageRemoved: boolean, id?: string) => 
        handleSave(data, imageFile);

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