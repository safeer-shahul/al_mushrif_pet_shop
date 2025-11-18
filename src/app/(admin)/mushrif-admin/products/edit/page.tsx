// src/app/(admin)/mushrif-admin/products/edit/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation'; // CHANGE: useSearchParams for static export compatibility
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ProductForm from '@/components/admin/product/ProductForm';
import ProductVariantManager from '@/components/admin/product/ProductVariantManager';
import { useProductService } from '@/services/admin/productService';
import { Product, ProdVariant } from '@/types/product';
import { useCategoryService } from '@/services/admin/categoryService';
import { useBrandService } from '@/services/admin/brandService';
import { useFilterService } from '@/services/admin/filterService';
import { SubCategory, RootCategory } from '@/types/category';
import { Brand } from '@/types/brand';
import { FilterType } from '@/types/filter';

// NOTE: This component is now at a static path: /mushrif-admin/products/edit
const ProductEditPageClient: React.FC = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const productId = searchParams.get('id'); // GET ID from '?id=...'

    const { fetchProductById, updateProduct, createProduct } = useProductService(); // Ensure createProduct is available

    // Dependencies hooks
    const { fetchAllRootCategories, fetchAllSubCategories } = useCategoryService();
    const { fetchAllBrands } = useBrandService();
    const { fetchAllFilterTypes } = useFilterService();

    // State for Product
    const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
    const [productLoading, setProductLoading] = useState(true);
    const [productApiError, setProductApiError] = useState<string | null>(null);
    const [formLoading, setFormLoading] = useState(false);

    const [dataRefreshKey, setDataRefreshKey] = useState(0);

    // State for Dependencies
    const [allBrands, setAllBrands] = useState<Brand[]>([]);
    const [allRootCategories, setAllRootCategories] = useState<RootCategory[]>([]);
    const [allSubCategories, setAllSubCategories] = useState<SubCategory[]>([]);
    const [allFilterTypes, setAllFilterTypes] = useState<FilterType[]>([]);
    const [dependenciesLoading, setDependenciesLoading] = useState(true);
    const [dependenciesError, setDependenciesError] = useState<string | null>(null);

    const handleFullDataRefresh = useCallback(() => {
        setDataRefreshKey(prev => prev + 1);
    }, []);

    // 💡 FIX: Revised fetchData to correctly handle Promise.all results based on mode
    const fetchData = useCallback(async () => {
        if (productId) {
            setProductLoading(true);
        }

        setDependenciesLoading(true);
        setProductApiError(null);
        setDependenciesError(null);

        if (!productId) {
            setCurrentProduct(null);
        }

        try {
            const productPromise = productId ? [fetchProductById(productId)] : [];

            const dependencyPromises = [
                fetchAllBrands(),
                fetchAllRootCategories(),
                fetchAllSubCategories(),
                fetchAllFilterTypes(),
            ];

            const results = await Promise.all([
                ...productPromise,
                ...dependencyPromises
            ]);

            let dataIndex = 0;
            let productData: Product | null = null;

            // 1. Check if product data was fetched (Edit Mode)
            if (productId) {
                // The first result is Product data
                productData = results[dataIndex] as Product;
                dataIndex++;
            }

            // 2. Assign the rest of the results (safe due to fixed order)
            const brands = results[dataIndex] as Brand[];
            const rootCategories = results[dataIndex + 1] as RootCategory[];
            const subCategories = results[dataIndex + 2] as SubCategory[];
            const filters = results[dataIndex + 3] as FilterType[];

            setCurrentProduct(productData);
            setAllBrands(brands);
            setAllRootCategories(rootCategories);
            setAllSubCategories(subCategories);
            setAllFilterTypes(filters);

        } catch (err: any) {
            setProductApiError(err.message || 'Failed to load product details or dependencies.');
            console.error(err);
        } finally {
            setProductLoading(false);
            setDependenciesLoading(false);
        }
    }, [productId, dataRefreshKey, fetchProductById, fetchAllBrands, fetchAllRootCategories, fetchAllSubCategories, fetchAllFilterTypes]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);


    // Handle the main product form submission (Create or Update)
    const handleSave = async (data: Partial<Product>, id?: string) => {
        setProductApiError(null);
        setFormLoading(true);

        const updateId = id || productId;
        const isEdit = !!updateId;

        try {
            let savedProduct: Product;

            if (isEdit) {
                if (!updateId) throw new Error("Update failed: Product ID is missing.");
                savedProduct = await updateProduct(updateId, data);
            } else {
                savedProduct = await createProduct(data as any);
            }

            alert(`Product ${savedProduct.prod_name} saved successfully.`);

            if (!isEdit) {
                // CRITICAL FIX 1: On creation success, redirect to the Edit page using query parameter
                router.replace(`/mushrif-admin/products/edit?id=${savedProduct.id}`);

                // CRITICAL FIX 2: Immediately trigger a full data refresh to reload the page state 
                // with the new productId, preventing the blank page error on creation redirect.
                handleFullDataRefresh();
            } else {
                // Update local state and trigger full refresh for images/variants
                setCurrentProduct(prev => (prev ? { ...prev, ...savedProduct } : savedProduct));
                handleFullDataRefresh();
            }

        } catch (err: any) {
            setProductApiError(err.message || 'A network error occurred during product save.');
            console.error(err);
        } finally {
            setFormLoading(false);
        }
    };

    // Handle updates from the Variant Manager component (local state update only)
    const handleVariantsUpdate = (updatedVariants: ProdVariant[]) => {
        if (currentProduct) {
            setCurrentProduct(prev => (prev ? { ...prev, variants: updatedVariants } : null));
        }
    };


    if (productLoading || dependenciesLoading) return <LoadingSpinner />;

    const isEditMode = !!currentProduct?.id;

    // Check if we are in Edit mode but failed to load the product
    if (productId && !isEditMode) return <div className="text-red-500">Product not found or failed to load.</div>;

    return (
        <div className="space-y-6">
            <ProductForm
                initialData={currentProduct || {}}
                isEditMode={isEditMode}
                onSave={handleSave}
                isLoading={formLoading}
                error={productApiError}

                allBrands={allBrands}
                allRootCategories={allRootCategories}
                allSubCategories={allSubCategories}
                allFilterTypes={allFilterTypes}
                dependenciesLoading={false}
                dependenciesError={dependenciesError}
                onFullDataRefresh={handleFullDataRefresh}
            />

            {/* Variant Manager only displays if in Edit mode and variants are enabled */}
            {isEditMode && currentProduct && currentProduct.has_variants && (
                <ProductVariantManager
                    product={currentProduct}
                    onVariantsUpdated={handleVariantsUpdate}
                    onFullDataRefresh={handleFullDataRefresh}
                />
            )}
        </div>
    );
};

export default ProductEditPageClient;