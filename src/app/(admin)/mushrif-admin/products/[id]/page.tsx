// src/app/(admin)/mushrif-admin/products/[id]/page.tsx
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
import { SubCategory } from '@/types/category';
import { Brand } from '@/types/brand';
import { FilterType } from '@/types/filter';

const ProductEditPage: React.FC = () => {
    const params = useParams();
    const router = useRouter(); 
    const productId = params.id as string;
    const { fetchProductById, updateProduct } = useProductService();
    
    // Dependencies hooks
    const { fetchAllSubCategories } = useCategoryService();
    const { fetchAllBrands } = useBrandService();
    const { fetchAllFilterTypes } = useFilterService();

    // State for Product
    const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
    const [productLoading, setProductLoading] = useState(true);
    const [productApiError, setProductApiError] = useState<string | null>(null);
    
    // State for Form/API activity
    const [formLoading, setFormLoading] = useState(false);
    
    // State for Dependencies
    const [allBrands, setAllBrands] = useState<Brand[]>([]);
    const [allSubCategories, setAllSubCategories] = useState<SubCategory[]>([]);
    const [allFilterTypes, setAllFilterTypes] = useState<FilterType[]>([]);
    const [dependenciesLoading, setDependenciesLoading] = useState(true);
    const [dependenciesError, setDependenciesError] = useState<string | null>(null);


    // Fetch all required data (Product + Dependencies)
    const fetchData = useCallback(async () => {
        if (!productId) return;
        setProductLoading(true);
        setDependenciesLoading(true);
        setProductApiError(null);
        setDependenciesError(null);
        
        try {
            const [productData, brands, categories, filters] = await Promise.all([
                fetchProductById(productId),
                fetchAllBrands(),
                fetchAllSubCategories(),
                fetchAllFilterTypes(),
            ]);
            
            // --- Filter SubCategories to only show leaf nodes (no children) ---
            const allParentIds = new Set(categories.map(c => c.parent_id).filter(Boolean));
            
            // A SubCategory is a leaf node if its own ID is NOT used as a parent_id by another SubCategory.
            const leafSubCategories = categories.filter(category => {
                return !allParentIds.has(category.id);
            });
            // ----------------------------------------------------------------------

            setCurrentProduct(productData);
            setAllBrands(brands);
            setAllSubCategories(leafSubCategories);
            setAllFilterTypes(filters);
            
        } catch (err: any) {
            setProductApiError(err.message || 'Failed to load product details or dependencies.');
            console.error(err);
        } finally {
            setProductLoading(false);
            setDependenciesLoading(false);
        }
    }, [productId, fetchProductById, fetchAllBrands, fetchAllSubCategories, fetchAllFilterTypes]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);


    // Handle the main product form submission (Update)
    const handleSave = async (data: Partial<Product>, id?: string) => {
        setProductApiError(null);
        if (!id) {
            setProductApiError("Update failed: Product ID is missing.");
            return;
        }
        setFormLoading(true);

        // Prepare payload for update
        const payload: Partial<Product> = {
            prod_id: data.prod_id,
            prod_name: data.prod_name,
            sub_cat_id: data.sub_cat_id,
            brand_id: data.brand_id,
            
            // --- NEW PRICE FIELDS ---
            base_price: data.base_price,
            base_offer_price: data.base_offer_price,
            // ------------------------
            
            can_return: data.can_return,
            can_replace: data.can_replace,
            product_filters: data.product_filters,
        };
        
        try {
            const updatedProduct = await updateProduct(id, payload);
            
            alert(`Product ${updatedProduct.prod_name} updated successfully.`);
            
            // Update the local state with the new data from the API response
            setCurrentProduct(prev => (prev ? { ...prev, ...updatedProduct } : null));
            
        } catch (err: any) {
            setProductApiError(err.message || 'A network error occurred during product update.');
        } finally {
            setFormLoading(false);
        }
    };
    
    // Handle updates from the Variant Manager component
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
                allSubCategories={allSubCategories}
                allFilterTypes={allFilterTypes}
                dependenciesLoading={false} 
                dependenciesError={dependenciesError}
            />

            {/* 2. Variant Management Section */}
            <ProductVariantManager 
                product={currentProduct}
                onVariantsUpdated={handleVariantsUpdate}
            />
        </div>
    );
};

export default ProductEditPage;