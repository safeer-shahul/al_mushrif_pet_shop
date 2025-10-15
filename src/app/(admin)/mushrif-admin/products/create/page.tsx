// src/app/(admin)/mushrif-admin/products/create/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import ProductForm from '@/components/admin/product/ProductForm';
import { useProductService } from '@/services/admin/productService';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Product } from '@/types/product';
import { useCategoryService } from '@/services/admin/categoryService';
import { useBrandService } from '@/services/admin/brandService';
import { useFilterService } from '@/services/admin/filterService';
import { SubCategory } from '@/types/category';
import { Brand } from '@/types/brand';
import { FilterType } from '@/types/filter';

const ProductCreatePage: React.FC = () => {
    const router = useRouter();
    const { createProduct } = useProductService();
    
    // Dependencies hooks
    const { fetchAllSubCategories } = useCategoryService();
    const { fetchAllBrands } = useBrandService();
    const { fetchAllFilterTypes } = useFilterService();

    // State for dependencies
    const [allBrands, setAllBrands] = useState<Brand[]>([]);
    const [allSubCategories, setAllSubCategories] = useState<SubCategory[]>([]);
    const [allFilterTypes, setAllFilterTypes] = useState<FilterType[]>([]);
    const [dependenciesLoading, setDependenciesLoading] = useState(true);
    const [dependenciesError, setDependenciesError] = useState<string | null>(null);

    const [apiError, setApiError] = useState<string | null>(null);
    const [localLoading, setLocalLoading] = useState(false);

    // Fetch all required data once
    const fetchDependencies = useCallback(async () => {
        setDependenciesLoading(true);
        setDependenciesError(null);
        try {
            const [brands, categories, filters] = await Promise.all([
                fetchAllBrands(),
                fetchAllSubCategories(), 
                fetchAllFilterTypes(),
            ]);
            
            // --- Filter SubCategories to only show leaf nodes (no children) ---
            const allParentIds = new Set(categories.map(c => c.parent_id).filter(Boolean));
            const leafSubCategories = categories.filter(category => {
                return !allParentIds.has(category.id);
            });
            // ----------------------------------------------------------------------
            
            setAllBrands(brands);
            setAllSubCategories(leafSubCategories); 
            setAllFilterTypes(filters);
            
        } catch (err: any) {
            setDependenciesError(err.message || 'Failed to load essential product dependencies.');
        } finally {
            setDependenciesLoading(false);
        }
    }, [fetchAllBrands, fetchAllSubCategories, fetchAllFilterTypes]);

    useEffect(() => {
        fetchDependencies();
    }, [fetchDependencies]);


    const handleSave = async (data: Partial<Product>) => {
        setApiError(null);
        setLocalLoading(true);
        
        // Prepare the payload - now including has_variants
        const payload: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'variants' | 'category' | 'brand' | 'images'> = {
            prod_id: data.prod_id || '',
            prod_name: data.prod_name || '',
            sub_cat_id: data.sub_cat_id || null,
            brand_id: data.brand_id || '',
            
            // --- BASE PRICE/QUANTITY FIELDS ---
            base_price: data.base_price || null,
            base_offer_price: data.base_offer_price || null,
            base_quantity: data.base_quantity || null,
            // ----------------------------------
            
            has_variants: data.has_variants || false, // Add the missing property
            can_return: data.can_return ?? true,
            can_replace: data.can_replace ?? true,
            product_filters: data.product_filters || null,
        };

        try {
            const response = await createProduct(payload);
            
            alert(`Product ${response.prod_name} created successfully.`);
            
            router.push(`/mushrif-admin/products/${response.id}`); 
        } catch (err: any) {
            const errorMsg = err.message || 'A network error occurred.';
            setApiError(errorMsg);
        } finally {
            setLocalLoading(false);
        }
    };

    // Dummy function for onFullDataRefresh (not needed in create page but required by component)
    const handleFullDataRefresh = useCallback(() => {
        // This is a no-op since this is the create page
        // No data to refresh yet
    }, []);

    if (dependenciesLoading) return <LoadingSpinner />;
    
    return (
        <div className="space-y-6">
            <ProductForm 
                isEditMode={false}
                onSave={handleSave}
                isLoading={localLoading}
                error={apiError}
                
                allBrands={allBrands}
                allSubCategories={allSubCategories}
                allFilterTypes={allFilterTypes}
                dependenciesLoading={dependenciesLoading}
                dependenciesError={dependenciesError}
                onFullDataRefresh={handleFullDataRefresh} // Add the missing prop
            />
        </div>
    );
};

export default ProductCreatePage;