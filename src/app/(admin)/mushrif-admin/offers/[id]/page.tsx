// src/app/(admin)/mushrif-admin/offers/[id]/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import OfferForm from '@/components/admin/offer/OfferForm'; 
import { useOfferService } from '@/services/admin/offerService';
import { Offer } from '@/types/offer';

const OfferEditPage: React.FC = () => {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string; 
    const { fetchOfferById, saveOffer } = useOfferService();

    const [currentOffer, setCurrentOffer] = useState<Offer | null>(null);
    const [loading, setLoading] = useState(true);
    const [apiError, setApiError] = useState<string | null>(null);
    const [localLoading, setLocalLoading] = useState(false);

    // Fetch the specific offer data
    const fetchData = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        try {
            const offerData = await fetchOfferById(id);
            setCurrentOffer(offerData);
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
    const handleUpdate = async (data: Partial<Offer>) => {
        setApiError(null);
        if (!data.id) {
            setApiError("Update failed: Offer ID is missing.");
            return;
        }
        setLocalLoading(true);

        try {
            const response = await saveOffer(data, true); // true for update mode
            alert(response.offer_name + " updated successfully.");
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