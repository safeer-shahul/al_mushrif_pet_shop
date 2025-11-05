// src/app/(admin)/mushrif-admin/brands/[id]/client-page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import BrandForm from '@/components/admin/brand/BrandForm';
import { useBrandService } from '@/services/admin/brandService';
import { Brand } from '@/types/brand';

// Renamed the component to reflect it is the client-side implementation
const BrandEditPageClient: React.FC = () => { 
    const router = useRouter();
    const params = useParams();
    const id = params.id as string; 
    const { fetchBrandById, updateBrand, getStorageUrl } = useBrandService();

    const [currentBrand, setCurrentBrand] = useState<Brand | null>(null);
    const [loading, setLoading] = useState(true);
    const [apiError, setApiError] = useState<string | null>(null);
    const [localLoading, setLocalLoading] = useState(false);

    const fetchData = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        try {
            const brandData = await fetchBrandById(id);
            console.log("Fetched brand data:", brandData);
            
            // Convert the relative path to an absolute URL for the image preview (handled here)
            brandData.brand_logo = getStorageUrl(brandData.brand_logo);
            
            // Fix the naming mismatch (Accessing data that might be snake_case from the API)
            if ((brandData as any).root_categories && !brandData.rootCategories) {
                (brandData as any).rootCategories = (brandData as any).root_categories;
            }
            
            setCurrentBrand(brandData);
            setApiError(null);
        } catch (err) {
            setApiError('Failed to load brand details.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [id, fetchBrandById, getStorageUrl]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleUpdate = async (
        data: Partial<Brand>, 
        imageFile: File | null, 
        imageRemoved: boolean, 
        brandId?: string
    ) => {
        setApiError(null);
        const updateId = brandId || id; 

        if (!updateId) {
            setApiError("Update failed: Brand ID is missing.");
            return;
        }
        setLocalLoading(true);

        const formData = new FormData();
        formData.append('brand_name', data.brand_name || '');
        formData.append('brand_description', data.brand_description || '');
        formData.append('is_active', (data.is_active ? '1' : '0')); 

        if (data.category_ids && Array.isArray(data.category_ids)) {
            data.category_ids.forEach(categoryId => {
                formData.append('category_ids[]', categoryId);
            });
        }

        if (imageFile) {
            formData.append('brand_logo', imageFile);
        } else if (imageRemoved && currentBrand?.brand_logo) {
            formData.append('brand_logo_removed', 'true'); 
        }
        
        formData.append('_method', 'PUT');
        
        try {
            const response = await updateBrand(updateId, formData);
            alert(response.message);
            router.push('/mushrif-admin/brands'); 
        } catch (err: any) {
            const errorMsg = err.message || 'A network error occurred.';
            setApiError(errorMsg);
        } finally {
            setLocalLoading(false);
        }
    };

    if (loading) return <LoadingSpinner />;
    if (!currentBrand) return <div className="text-red-500">Brand not found or failed to load.</div>;
    
    return (
        <div className="space-y-6">
            <BrandForm 
                initialData={currentBrand} 
                isEditMode={true}
                onSave={(data, file, removed, formId) => handleUpdate(data, file, removed, formId || id)}
                isLoading={localLoading}
                error={apiError}
            />
        </div>
    );
};

export default BrandEditPageClient;