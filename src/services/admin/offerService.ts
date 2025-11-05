import { useAuth } from '@/context/AuthContext';
import { getCsrfToken, createAuthenticatedClient, publicClient } from '@/utils/ApiClient';
import { Offer } from '@/types/offer'; 
import { useCallback } from 'react';
import { Product } from '@/types/product';

// Define the API endpoints
const OFFER_API_ENDPOINT = '/admin/offers';
// CRITICAL FIX: Point to the new public route to fetch IDs for the static build
const OFFER_STATIC_EXPORT_ENDPOINT = '/public/offer-ids'; 

interface PaginatedProductList {
    data: Product[];
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
}

// Interface to handle the API response for the list endpoint (if paginated or wrapped)
interface OfferListResponse {
    data: Offer[];
    // Include other pagination/meta fields if applicable, otherwise use Offer[] directly
}

/**
 * UTILITY FUNCTION FOR NEXT.JS BUILD (Server-side compatible)
 * Fetches all offer IDs for generateStaticParams. Uses publicClient for build time execution.
 * NOTE: This relies on the new public route /public/offer-ids
 */
export const fetchAllOfferIdsForStaticExport = async (): Promise<string[]> => {
    try {
        // Hitting the new public endpoint
        const response = await publicClient.get<string[]>(OFFER_STATIC_EXPORT_ENDPOINT); 

        // The Laravel route now explicitly returns a Collection of IDs, which Axios handles as string[]
        const ids = Array.isArray(response.data) ? response.data : [];
            
        return ids.map(id => id.toString());
        
    } catch (error) {
        console.error('Failed to fetch Offer IDs for static export (Check API endpoint security):', error);
        return []; 
    }
}


export const useOfferService = () => {
    const { token } = useAuth();
    
    // getClient is ONLY used by the hook functions (which are client-side or server-side protected)
    const getClient = useCallback((isFileUpload: boolean = false) => {
        if (!token) throw new Error("Authentication token missing.");
        const config = isFileUpload ? { omitContentType: true } : {};
        return createAuthenticatedClient(token, config); 
    }, [token]);

    const fetchAllOffers = useCallback(async (): Promise<Offer[]> => {
        const api = getClient();
        const response = await api.get<Offer[]>(OFFER_API_ENDPOINT); 
        return response.data;
    }, [getClient]);
    
    const fetchOfferById = useCallback(async (id: string): Promise<Offer> => {
        const api = getClient();
        try {
            const response = await api.get<Offer>(`${OFFER_API_ENDPOINT}/${id}`);
            if (!response.data) {
                throw new Error("API returned empty data.");
            }
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to load offer details.');
        }
    }, [getClient]);

    const saveOfferWithImage = useCallback(async (id: string | undefined, formData: FormData, isUpdate: boolean = false): Promise<{ message: string, offer: Offer }> => {
        const api = getClient(true); 
        await getCsrfToken();
        
        try {
            if (isUpdate && id) {
                if (!formData.has('_method')) {
                     formData.append('_method', 'PUT');
                }
                const response = await api.post(`${OFFER_API_ENDPOINT}/${id}`, formData);
                return response.data;
            } else {
                const response = await api.post(OFFER_API_ENDPOINT, formData);
                return response.data;
            }
        } catch (error: any) {
            const msg = error.response?.data?.message || 'Failed to save offer.';
            throw new Error(msg);
        }
    }, [getClient]);

    const deleteOffer = useCallback(async (id: string) => {
        const api = getClient();
        await getCsrfToken();
        await api.delete(`${OFFER_API_ENDPOINT}/${id}`);
    }, [getClient]);

    const searchProductsForDropdown = useCallback(async (searchQuery: string): Promise<PaginatedProductList> => {
        const api = getClient();
        try {
            const response = await api.get<PaginatedProductList>('/admin/products/search-dropdown', {
                params: { search: searchQuery }
            });
            return response.data;
        } catch (error: any) {
            console.error('API Error in searchProductsForDropdown:', error);
            throw new Error('Failed to search products.');
        }
    }, [getClient]);

    return {
        fetchAllOffers,
        fetchOfferById,
        saveOfferWithImage,
        deleteOffer,
        searchProductsForDropdown
    };
};