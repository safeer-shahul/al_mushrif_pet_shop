// src/app/(admin)/mushrif-admin/offers/[id]/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import OfferForm from '@/components/admin/offer/OfferForm'; 
import { useOfferService } from '@/services/admin/offerService';
import { Offer } from '@/types/offer'; 
import { Product as ProductType } from '@/types/product'; 

const OfferEditPage: React.FC = () => {
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
            // 💡 CRITICAL FIX: Ensure offerData exists before accessing .products
            if (!offerData || !offerData.products) {
                 // Handle case where offer is valid but product list is empty/null
                 setCurrentOffer(offerData as Offer & { products_details?: ProductType[] });
                 setApiError(null);
                 setLoading(false);
                 return;
            }
            
            // Manually map the product IDs into mock Product objects for display lookup
            const productsDetails: ProductType[] = offerData.products.map(productId => ({
                // We use the fetched products (string array) but construct ProductType objects
                id: productId,
                prod_name: `Product ID: ${productId.substring(0, 8)}...`,
                prod_id: `SKU: ${productId.substring(0, 8)}`,
            })) as ProductType[]; 

            const offerForForm: Offer & { products_details?: ProductType[] } = {
                ...offerData,
                products_details: productsDetails // Pass the mock details for display
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
        if (!data.id) {
            setApiError("Update failed: Offer ID is missing.");
            return;
        }
        setLocalLoading(true);

        const formData = new FormData();

        // 1. Append non-file fields
        Object.entries(data).forEach(([key, value]) => {
            if (key === 'offer_image_file' || key === 'offer_image_removed') return; 

            if (value !== null && value !== undefined) {
                if (key === 'products' && Array.isArray(value)) {
                    formData.append(key, JSON.stringify(value));
                } else if (typeof value === 'boolean') {
                    formData.append(key, value ? '1' : '0');
                } else {
                    formData.append(key, String(value));
                }
            }
        });
        
        // 2. Append file and removal flag using the backend's expected names
        if (data.offer_image_file) {
            formData.append('offer_image', data.offer_image_file); 
        } else if (data.offer_image_removed) {
            formData.append('offer_image_removed', 'true');
        }

        try {
            const response = await saveOfferWithImage(data.id, formData, true); 
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

export default OfferEditPage;