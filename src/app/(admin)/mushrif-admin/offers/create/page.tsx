// src/app/(admin)/mushrif-admin/offers/create/page.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useOfferService } from '@/services/admin/offerService';
import OfferForm from '@/components/admin/offer/OfferForm'; 
import { Offer } from '@/types/offer';

const OfferCreatePage: React.FC = () => {
    const router = useRouter();
    const { saveOfferWithImage } = useOfferService();
    
    const [apiError, setApiError] = useState<string | null>(null);
    const [localLoading, setLocalLoading] = useState(false);

    const handleSave = async (data: Partial<Offer> & { offer_image_file?: File | null, offer_image_removed?: boolean }) => {
        setApiError(null);
        setLocalLoading(true);
        
        const formData = new FormData();
        
        // 1. Append all fields, converting non-file data to strings/JSON
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
        
        // 2. Append file and removal flag using the backend's expected names ('offer_image')
        if (data.offer_image_file) { // Check the transient name
            formData.append('offer_image', data.offer_image_file); // Backend expects 'offer_image'
        } else if (data.offer_image_removed) {
            formData.append('offer_image_removed', 'true');
        }
        
        try {
            const response = await saveOfferWithImage(data.id, formData, false);
            alert(response.offer.offer_name + " created successfully.");
            router.push('/mushrif-admin/offers'); 
        } catch (err: any) {
            setApiError(err.message || 'A network error occurred.');
        } finally {
            setLocalLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <OfferForm 
                isEditMode={false}
                onSave={handleSave}
                isLoading={localLoading}
                error={apiError}
            />
        </div>
    );
};

export default OfferCreatePage;