// src/app/(admin)/mushrif-admin/offers/create/page.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useOfferService } from '@/services/admin/offerService';
import { Offer } from '@/types/offer';
import OfferForm from '@/components/admin/offer/OfferForm';

const OfferCreatePage: React.FC = () => {
    const router = useRouter();
    const { saveOffer } = useOfferService();
    
    const [apiError, setApiError] = useState<string | null>(null);
    const [localLoading, setLocalLoading] = useState(false);

    const handleSave = async (data: Partial<Offer>) => {
        setApiError(null);
        setLocalLoading(true);
        
        try {
            const response = await saveOffer(data, false); // false for create mode
            alert(response.offer_name + " created successfully.");
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