// src/app/(admin)/mushrif-admin/offers/[id]/client-page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import OfferForm from '@/components/admin/offer/OfferForm'; 
import { useOfferService } from '@/services/admin/offerService';
import { Offer } from '@/types/offer'; 
import { Product as ProductType } from '@/types/product'; 

// Renamed component
const OfferEditPageClient: React.FC = () => {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string; 
    const { fetchOfferById, saveOfferWithImage } = useOfferService(); 

    const [currentOffer, setCurrentOffer] = useState<Offer & { products_details?: ProductType[] } | null>(null);
    const [loading, setLoading] = useState(true);
    const [apiError, setApiError] = useState<string | null>(null);
    const [localLoading, setLocalLoading] = useState(false);

    // Fetch the specific offer data
    const fetchData = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        try {
            const offerData = await fetchOfferById(id);
            console.log("Fetched offer data:", id);

            if (!offerData) {
                setLoading(false);
                return;
            }
            
            // Manually map the product IDs into mock Product objects for display lookup
            const productsDetails: ProductType[] = offerData.products.map(productId => ({
                id: productId,
                prod_name: `Product ID: ${productId.substring(0, 8)}...`,
                prod_id: `SKU: ${productId.substring(0, 8)}`,
                prod_sku: `SKU: ${productId.substring(0, 8)}`,
                prod_price: 0,
                sub_cat_id: null,
                brand_id: '',
                can_return: false,
                can_replace: false,
                product_filters: null,
                description: null,
                base_price: 0,
                base_offer_price: null,
                base_quantity: 0,
                has_variants: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                variants: [],
                images: [],
            })) as ProductType[];

            const offerForForm: Offer & { products_details?: ProductType[] } = {
                ...offerData,
                products_details: productsDetails
            } as Offer & { products_details?: ProductType[] };

            setCurrentOffer(offerForForm);
            setApiError(null);
        } catch (err) {
            setApiError('Failed to load offer details.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [id, fetchOfferById]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Handle the form submission (Update)
    const handleUpdate = async (data: Partial<Offer> & { offer_image_file?: File | null, offer_image_removed?: boolean }) => {
        setApiError(null);
        // Use the ID from URL params as the primary ID
        if (!id) {
            setApiError("Update failed: Offer ID is missing.");
            return;
        }
        setLocalLoading(true);

        const formData = new FormData();

        // 1. Append non-file fields
        Object.entries(data).forEach(([key, value]) => {
            if (key === 'offer_image_file' || key === 'offer_image_removed' || key === 'products_details') return; 

            if (value !== null && value !== undefined) {
                if (key === 'products' && Array.isArray(value)) {
                    // Send product IDs as a JSON string array for Laravel to decode
                    formData.append(key, JSON.stringify(value));
                } else if (typeof value === 'boolean') {
                    formData.append(key, value ? '1' : '0');
                } else {
                    formData.append(key, String(value));
                }
            }
        });
        
        // 2. Append file and removal flag
        if (data.offer_image_file) {
            formData.append('offer_image', data.offer_image_file); 
        } else if (data.offer_image_removed) {
            formData.append('offer_image_removed', 'true');
        }
        
        // Ensure ID is passed in form data if backend requires it, otherwise use URL
        formData.append('id', id); 

        try {
            // Use the ID from the URL path
            const response = await saveOfferWithImage(id, formData, true); 
            alert(response.offer.offer_name + " updated successfully.");
            router.push('/mushrif-admin/offers'); 
        } catch (err: any) {
            setApiError(err.message || 'A network error occurred.');
        } finally {
            setLocalLoading(false);
        }
    };

    if (loading) return <LoadingSpinner />;
    if (!currentOffer) return <div className="text-red-500">Offer not found or failed to load.</div>;
    
    return (
        <div className="space-y-6">
            <OfferForm 
                key={currentOffer.id} 
                initialData={currentOffer} 
                isEditMode={true}
                onSave={handleUpdate} 
                isLoading={localLoading}
                error={apiError}
            />
        </div>
    );
};

export default OfferEditPageClient; // Updated export name