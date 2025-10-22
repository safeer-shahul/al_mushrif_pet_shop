// src/context/CartContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { Cart, CartContextType, CartItem } from '@/types/cart'; // Assuming you created cart.ts
import { useAuth } from './AuthContext'; // Import from local AuthContext
import { createAuthenticatedClient, publicClient, getCsrfToken } from '@/utils/ApiClient';
import { AxiosResponse } from 'axios';
import { useProductService } from '@/services/admin/productService'; // Use this for getStorageUrl utility

// ------------------------------------
// 1. Context Creation
// ------------------------------------

const CartContext = createContext<CartContextType | undefined>(undefined);

// ------------------------------------
// 2. Provider Component
// ------------------------------------

export function CartProvider({ children }: { children: React.ReactNode }) {
    const { token, isAuthenticated, isLoading: isAuthLoading } = useAuth();
    const { getStorageUrl } = useProductService(); // Use this utility to get image URLs

    const [cart, setCart] = useState<Cart | null>(null);
    const [cartLoading, setCartLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Helper to calculate the total number of items in the cart
    const cartCount = useMemo(() => {
        return cart?.items.reduce((total, item) => total + item.quantity, 0) || 0;
    }, [cart]);

    // Helper to process raw CartItem data with absolute image URLs
    const processCartData = useCallback((rawCart: Cart | null): Cart | null => {
        if (!rawCart) return null;

        const processedItems: CartItem[] = rawCart.items.map(item => {
            // Find the primary image in the variant's images array
            const primaryImage = item.variant.images?.find(img => img.is_primary) || item.variant.images?.[0];
            
            return {
                ...item,
                // Add the convenience image URL field
                primary_image_url: primaryImage?.image_url ? getStorageUrl(primaryImage.image_url) : null
            };
        });

        return { ...rawCart, items: processedItems };
    }, [getStorageUrl]);


    // ---------------------------------------------------------------------
    // API ACTIONS
    // ---------------------------------------------------------------------

    const fetchCart = useCallback(async () => {
        if (isAuthLoading) return;

        setCartLoading(true);
        setError(null);
        
        try {
            // Use the public client for all cart reads/writes.
            // Authentication status is handled by the Laravel CartController via the cookie/token logic.
            const client = publicClient;
            
            const response: AxiosResponse<Cart> = await client.get('/cart');
            
            const processedCart = processCartData(response.data);
            setCart(processedCart);
            
        } catch (err: any) {
            console.error("Cart fetch error:", err.response?.data || err);
            // Ignore common guest cart 404/network errors, but reset cart state
            setCart(null); 
            setError("Failed to load shopping cart.");
        } finally {
            setCartLoading(false);
        }
    }, [isAuthLoading, processCartData]);


    const addItem = useCallback(async (prodVariantId: string, quantity: number) => {
        setCartLoading(true);
        setError(null);
        try {
            await getCsrfToken(); 
            const client = publicClient;

            const response: AxiosResponse<{ message: string, cart_item: CartItem }> = await client.post('/cart', {
                prod_variant_id: prodVariantId,
                quantity,
            });

            // Optimistically update the cart or fetch the whole cart to ensure state consistency
            await fetchCart(); 

        } catch (err: any) {
            const msg = err.response?.data?.message || err.response?.data?.errors?.prod_variant_id?.[0] || 'Failed to add item to cart.';
            setError(msg);
        } finally {
            setCartLoading(false);
        }
    }, [fetchCart]);


    const updateItemQuantity = useCallback(async (prodVariantId: string, quantity: number) => {
        setCartLoading(true);
        setError(null);
        try {
            await getCsrfToken(); 
            const client = publicClient; 

            // Use POST with _method=PUT for cross-browser compatibility, although Axios PUT often works.
            const response: AxiosResponse<{ message: string, cart_item?: CartItem }> = await client.put(`/cart/${prodVariantId}`, {
                quantity,
            });
            
            // Re-fetch the cart to ensure totals and state are correct after update/delete
            await fetchCart();

        } catch (err: any) {
            const msg = err.response?.data?.message || 'Failed to update item quantity.';
            setError(msg);
        } finally {
            setCartLoading(false);
        }
    }, [fetchCart]);


    const removeItem = useCallback(async (prodVariantId: string) => {
        setCartLoading(true);
        setError(null);
        try {
            await getCsrfToken(); 
            const client = publicClient;

            await client.delete(`/cart/${prodVariantId}`);

            // Re-fetch the cart after successful deletion
            await fetchCart();

        } catch (err: any) {
            const msg = err.response?.data?.message || 'Failed to remove item from cart.';
            setError(msg);
        } finally {
            setCartLoading(false);
        }
    }, [fetchCart]);


    // ---------------------------------------------------------------------
    // INITIAL LOAD / AUTH STATE CHANGE EFFECT
    // ---------------------------------------------------------------------

    useEffect(() => {
        // Load cart whenever the authentication status or token state changes
        if (!isAuthLoading) {
            fetchCart();
        }
    }, [isAuthLoading, token, fetchCart]); // token is here to trigger a sync when a user logs in (token changes)


    const contextValue = useMemo(() => ({
        cart,
        cartCount,
        cartLoading,
        error,
        fetchCart,
        addItem,
        updateItemQuantity,
        removeItem,
    }), [cart, cartCount, cartLoading, error, fetchCart, addItem, updateItemQuantity, removeItem]);

    return (
        <CartContext.Provider value={contextValue}>
            {children}
        </CartContext.Provider>
    );
}

// ------------------------------------
// 3. Custom Hook
// ------------------------------------

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}