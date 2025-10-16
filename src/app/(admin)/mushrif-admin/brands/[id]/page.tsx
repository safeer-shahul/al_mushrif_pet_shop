// src/app/(admin)/mushrif-admin/brands/[id]/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import BrandForm from '@/components/admin/brand/BrandForm';
import { useBrandService } from '@/services/admin/brandService';
import { Brand } from '@/types/brand';

const BrandEditPage: React.FC = () => {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string; 
    const { fetchBrandById, updateBrand, getStorageUrl } = useBrandService();

    const [currentBrand, setCurrentBrand] = useState<Brand | null>(null);
    const [loading, setLoading] = useState(true);
    const [apiError, setApiError] = useState<string | null>(null);
    const [localLoading, setLocalLoading] = useState(false);

    // Fetch the specific brand data
    const fetchData = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        try {
            const brandData = await fetchBrandById(id);
            console.log("Fetched brand data:", brandData);
            
            // Convert the relative path to an absolute URL for the image preview
            brandData.brand_logo = getStorageUrl(brandData.brand_logo);
            
            // Fix the naming mismatch - API returns snake_case but TS expects camelCase
            if (brandData.root_categories && !brandData.rootCategories) {
                brandData.rootCategories = brandData.root_categories;
            }
            
            console.log("Processed brand data with rootCategories:", brandData);
            
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

    // Handle the form submission (Update)
    const handleUpdate = async (
        data: Partial<Brand>, 
        imageFile: File | null, 
        imageRemoved: boolean, 
        brandId?: string
    ) => {
        setApiError(null);
        if (!brandId) {
            setApiError("Update failed: Brand ID is missing.");
            return;
        }
        setLocalLoading(true);

        const formData = new FormData();
        
        // 1. Append Text fields
        formData.append('brand_name', data.brand_name || '');
        formData.append('brand_description', data.brand_description || '');
        formData.append('is_active', (data.is_active ? '1' : '0')); 

        // 2. Append Category IDs properly for PHP array handling
        if (data.category_ids && Array.isArray(data.category_ids)) {
            console.log("Appending category IDs to form:", data.category_ids);
            data.category_ids.forEach(categoryId => {
                formData.append('category_ids[]', categoryId);
            });
        }

        // 3. Append File or Removal Flag
        if (imageFile) {
            console.log("Appending image file:", imageFile.name);
            formData.append('brand_logo', imageFile);
        } else if (imageRemoved && currentBrand?.brand_logo) {
            console.log("Marking logo for removal");
            formData.append('brand_logo_removed', 'true'); 
        }
        
        // 4. Append the method spoofing field for Laravel PUT
        formData.append('_method', 'PUT');
        
        // Log the form data for debugging
        console.log("Form data entries:");
        for (const pair of formData.entries()) {
            console.log(pair[0], pair[1]);
        }
        
        try {
            const response = await updateBrand(brandId, formData);
            console.log("Update brand response:", response);
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
                onSave={handleUpdate}
                isLoading={localLoading}
                error={apiError}
            />
        </div>
    );
};

export default BrandEditPage;