// src/app/(admin)/mushrif-admin/products/[id]/client-page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
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

// Renamed component
const ProductEditPageClient: React.FC = () => {
    const params = useParams();
    const router = useRouter(); 
    const productId = params.id as string;
    const { fetchProductById, updateProduct } = useProductService();
    
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


    // Fetch all required data (Product + Dependencies)
    const fetchData = useCallback(async () => {
        if (!productId) return;
        setProductLoading(true);
        setDependenciesLoading(true);
        setProductApiError(null);
        setDependenciesError(null);
        
        try {
            const [productData, brands, rootCategories, subCategories, filters] = await Promise.all([
                fetchProductById(productId),
                fetchAllBrands(),
                fetchAllRootCategories(), 
                fetchAllSubCategories(), 
                fetchAllFilterTypes(),
            ]);
            
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


    // Handle the main product form submission (Update)
    const handleSave = async (data: Partial<Product>, id?: string) => {
        setProductApiError(null);
        const updateId = id || productId;

        if (!updateId) {
            setProductApiError("Update failed: Product ID is missing.");
            return;
        }
        setFormLoading(true);

        try {
            const updatedProduct = await updateProduct(updateId, data);
            
            alert(`Product ${updatedProduct.prod_name} updated successfully.`);
            
            setCurrentProduct(prev => (prev ? { ...prev, ...updatedProduct } : null)); 
            
        } catch (err: any) {
            setProductApiError(err.message || 'A network error occurred during product update.');
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
    if (!currentProduct) return <div className="text-red-500">Product not found or failed to load.</div>;
    
    return (
        <div className="space-y-6">
            {/* 1. Main Product Details Form */}
            <ProductForm 
                initialData={currentProduct} 
                isEditMode={true}
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

            {/* 2. Variant Management Section */}
            <ProductVariantManager 
                product={currentProduct}
                onVariantsUpdated={handleVariantsUpdate}
                onFullDataRefresh={handleFullDataRefresh}
            />
        </div>
    );
};

export default ProductEditPageClient;