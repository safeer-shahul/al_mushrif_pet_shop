// src/app/(admin)/mushrif-admin/categories/create/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApiClient, getCsrfToken } from '@/utils/ApiClient';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import CategoryForm from '@/components/admin/category/CategoryForm';
import { AnyCategory, CategoryIndexResponse } from '@/types/category';

const API_ENDPOINT = '/admin/categories';

const CategoryCreatePage: React.FC = () => {
    const router = useRouter();
    const api = useApiClient();
    const [allCategories, setAllCategories] = useState<AnyCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [apiError, setApiError] = useState<string | null>(null);

    // Fetch all categories for the parent dropdown selector
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await api.get<CategoryIndexResponse>(API_ENDPOINT);
                
                const rootCats = response.data.root_categories as AnyCategory[];
                const subCats = response.data.sub_categories as AnyCategory[];

                // Combine and store
                setAllCategories([...rootCats, ...subCats]); 
            } catch (err) {
                setApiError('Failed to load parent categories.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchCategories();
    }, [api]);

    const handleSave = async (data: any) => {
        setApiError(null);
        try {
            await getCsrfToken();
            const response = await api.post(API_ENDPOINT, data);
            
            alert(response.data.message);
            router.push('/mushrif-admin/categories'); // Go back to list on success
        } catch (err: any) {
            // Display Laravel validation errors (often nested under data.errors)
            const errorMsg = err.response?.data?.message || 'A network error occurred.';
            setApiError(errorMsg);
        }
    };

    if (loading) return <LoadingSpinner />;
    
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">Create New Category</h1>
            <CategoryForm 
                initialData={{}}
                isEditMode={false}
                onSave={handleSave}
                allCategories={allCategories}
                isLoading={loading}
                error={apiError}
            />
        </div>
    );
};

export default CategoryCreatePage;