// src/app/(admin)/mushrif-admin/categories/[id]/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useApiClient, getCsrfToken } from '@/utils/ApiClient';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import CategoryForm from '@/components/admin/category/CategoryForm';
import { AnyCategory, CategoryIndexResponse } from '@/types/category';

const API_ENDPOINT = '/admin/categories';

const CategoryEditPage: React.FC = () => {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;
    const api = useApiClient();

    const [currentCategory, setCurrentCategory] = useState<AnyCategory | null>(null);
    const [allCategories, setAllCategories] = useState<AnyCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [apiError, setApiError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;

        const fetchData = async () => {
            try {
                // 1. Fetch the specific category to edit
                const singleRes = await api.get<{ category: AnyCategory }>(`${API_ENDPOINT}/${id}`);
                
                // Map the category object to match the common form structure
                const categoryData = singleRes.data.category;
                const normalizedData = {
                    ...categoryData,
                    // Map the model's distinct name fields to the common 'cat_name' field for the form state
                    cat_name: 'cat_name' in categoryData ? categoryData.cat_name : ('sub_cat_name' in categoryData ? categoryData.sub_cat_name : ''),
                } as AnyCategory;

                setCurrentCategory(normalizedData);

                // 2. Fetch all categories for the parent dropdown selector
                const indexRes = await api.get<CategoryIndexResponse>(API_ENDPOINT);
                const allCats = [...indexRes.data.root_categories, ...indexRes.data.sub_categories] as AnyCategory[];
                setAllCategories(allCats.filter(cat => cat.id !== id)); // Exclude current category from parent list
                
            } catch (err) {
                setApiError('Failed to load category details or parent list.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id, api]);

    // FIX: Changed signature to accept the ID as a required string when updating
    const handleUpdate = async (data: any, categoryId?: string) => {
        setApiError(null);
        
        // Ensure categoryId is passed and exists for update operation
        if (!categoryId) {
            setApiError("Update failed: Category ID is missing.");
            return;
        }
        
        try {
            await getCsrfToken();
            // Send PUT request to update the category
            const response = await api.put(`${API_ENDPOINT}/${categoryId}`, data);
            
            alert(response.data.message);
            router.push('/mushrif-admin/categories'); // Go back to list on success
        } catch (err: any) {
            const errorMsg = err.response?.data?.message || 'A network error occurred.';
            setApiError(errorMsg);
        }
    };

    if (loading) return <LoadingSpinner />;
    if (!currentCategory) return <div className="text-red-500">Category not found or failed to load.</div>;
    
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">Edit Category</h1>
            <CategoryForm 
                // Pass the current category's ID to the form for the update handler
                initialData={currentCategory} 
                isEditMode={true}
                onSave={(data, id) => handleUpdate(data, id)} // Call handler with data and ID
                allCategories={allCategories}
                isLoading={loading}
                error={apiError}
            />
        </div>
    );
};

export default CategoryEditPage;