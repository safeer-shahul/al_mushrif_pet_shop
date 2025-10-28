// src/services/public/wishlistService.ts
import { createAuthenticatedClient, getCsrfToken } from '@/utils/ApiClient';
import { useAuth } from '@/context/AuthContext';
import { useCallback } from 'react';
import { ProductImage, ProdVariant } from '@/types/product';

const WISHLIST_API_ENDPOINT = '/user/wishlists';

// Define the expected Wishlist Item structure based on your API response
export interface WishlistItem {
    id: string; // Wishlist item UUID
    user_id: string;
    prod_variant_id: string;
    // Eager-loaded relationship from your API: ->with('variant.product')
    variant: ProdVariant & { 
        product: { 
            id: string, 
            prod_name: string, 
            images?: ProductImage[] // Assuming images are available via product relation
        } 
    };
}


/**
 * Custom hook for managing the authenticated user's wishlist.
 */
export const useWishlistService = () => {
    const { isAuthenticated, token } = useAuth();
    
    // Helper to get authenticated client, throws if token is missing
    const getClient = useCallback(() => {
        if (!isAuthenticated || !token) {
            throw new Error("Authentication required for wishlist operations.");
        }
        return createAuthenticatedClient(token); 
    }, [isAuthenticated, token]);

    /**
     * Fetches the entire wishlist for the authenticated user. (GET /user/wishlists)
     */
    const fetchWishlist = useCallback(async (): Promise<WishlistItem[]> => {
        const api = getClient();
        const response = await api.get<WishlistItem[]>(WISHLIST_API_ENDPOINT);
        return response.data;
    }, [getClient]);

    /**
     * Adds a product variant to the wishlist. (POST /user/wishlists)
     * @param prodVariantId The ID of the item variant to add.
     * @returns The newly created WishlistItem.
     */
    const addToWishlist = useCallback(async (prodVariantId: string): Promise<WishlistItem> => {
        const api = getClient();
        await getCsrfToken();
        
        const response = await api.post<{ message: string, item: WishlistItem }>(WISHLIST_API_ENDPOINT, {
            prod_variant_id: prodVariantId,
        });
        
        return response.data.item;
    }, [getClient]);

    /**
     * Removes an item from the wishlist by the Wishlist Item ID. (DELETE /user/wishlists/{id})
     * @param wishlistId The ID of the wishlist item record (NOT the product ID).
     */
    const removeFromWishlist = useCallback(async (wishlistId: string): Promise<void> => {
        const api = getClient();
        await getCsrfToken();
        await api.delete(`${WISHLIST_API_ENDPOINT}/${wishlistId}`);
    }, [getClient]);

    /**
     * Checks if a specific product variant is already in the wishlist.
     * This is used by ProductCard to set the initial heart state.
     * @param prodVariantId The ID of the item variant to check.
     * @returns Promise<WishlistItem | null>
     */
    const checkWishlistStatus = useCallback(async (prodVariantId: string): Promise<WishlistItem | null> => {
        const api = getClient();
        // Assuming your backend supports a filtered GET request, e.g., ?variant_id=...
        // If not, you must fetch the whole list and check it locally (less efficient).
        
        // Since the backend API currently doesn't provide a single 'check' route, 
        // we'll rely on fetching the list and checking locally for simplicity.
        const wishlist = await fetchWishlist();
        const existingItem = wishlist.find(item => item.prod_variant_id === prodVariantId);
        
        // Return the full item if found, null otherwise.
        return existingItem || null;
    }, [getClient, fetchWishlist]); // fetchWishlist is used here

    return {
        fetchWishlist,
        addToWishlist,
        removeFromWishlist,
        checkWishlistStatus, // <-- NEW METHOD EXPOSED
        isAuthenticated // Expose for quick check in UI
    };
};