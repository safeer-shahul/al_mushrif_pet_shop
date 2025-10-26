// src/context/CartContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { Cart, CartContextType, CartItem } from '@/types/cart'; 
import { useAuth } from './AuthContext'; 
import { publicClient, getCsrfToken } from '@/utils/ApiClient';
import { AxiosResponse } from 'axios';
import { useProductService } from '@/services/admin/productService'; 
import { v4 as uuidv4 } from 'uuid'; // Used for client-side item IDs

// ------------------------------------
// 1. Context Creation & Constants
// ------------------------------------

const CartContext = createContext<CartContextType | undefined>(undefined);
const LOCAL_STORAGE_CART_KEY = 'localGuestCart'; 

// --- Local Cart Types (Minimal structure for localStorage) ---
// These types are deliberately lighter than the full backend CartItem
type LocalCartItem = {
    id: string; // Client-side unique ID for the item instance
    prod_variant_id: string;
    quantity: number;
    // Minimal mock for required properties (replaces deep nesting needed for full CartItem)
    variant: { 
        id: string; 
        price: number | null; 
        offer_price: number | null; 
        product: { id: string, prod_name: string, base_price: number | null }; 
    };
};
type LocalCart = { items: LocalCartItem[] };


// --- Local Storage Helpers ---
const getLocalCart = (): LocalCart => {
    if (typeof window === 'undefined') return { items: [] };
    const storedCart = localStorage.getItem(LOCAL_STORAGE_CART_KEY);
    try {
        return storedCart ? JSON.parse(storedCart) : { items: [] };
    } catch (e) {
        console.error("Failed to parse local cart, resetting.", e);
        return { items: [] };
    }
};

const saveLocalCart = (cart: LocalCart) => {
    if (typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_STORAGE_CART_KEY, JSON.stringify(cart));
    }
};


// ------------------------------------
// 2. Provider Component
// ------------------------------------

export function CartProvider({ children }: { children: React.ReactNode }) {
    const { token, isAuthenticated, isLoading: isAuthLoading } = useAuth();
    const { getStorageUrl } = useProductService(); 

    const [cart, setCart] = useState<Cart | null>(null);
    const [cartLoading, setCartLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // 💡 Drawer State: Managed globally within the context
    const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false); 


    const cartCount = useMemo(() => {
        return cart?.items.reduce((total, item) => total + item.quantity, 0) || 0;
    }, [cart]);
    
    // Helper to process the *backend* data structure for the frontend display
    const processCartData = useCallback((rawCart: Cart | null): Cart | null => {
        if (!rawCart) return null;
        
        const processedItems: CartItem[] = rawCart.items.map(item => {
            const primaryImage = item.variant.images?.find(img => img.is_primary) || item.variant.images?.[0];
            return {
                ...item,
                // Injects the resolved URL path
                primary_image_url: primaryImage?.image_url ? getStorageUrl(primaryImage.image_url) : null
            } as CartItem; // Cast ensures the calculated fields from the backend are accepted
        });

        return { ...rawCart, items: processedItems };
    }, [getStorageUrl]);

    // Fetches the entire cart instance from the Laravel API
    const fetchBackendCart = useCallback(async () => {
        try {
            const response: AxiosResponse<Cart> = await publicClient.get('/cart');
            return response.data;
        } catch (error) {
            // A non-200 response likely means no cart exists for the session/user
            return null;
        }
    }, []);
    

    // ---------------------------------------------------------------------
    // CORE FETCH LOGIC: Forks based on Auth status
    // ---------------------------------------------------------------------

    const fetchCart = useCallback(async () => {
        const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
        if (pathname.startsWith('/mushrif-admin')) {
            setCart(null); 
            setCartLoading(false);
            return;
        }

        if (isAuthLoading) return;
        setCartLoading(true);
        setError(null);
        
        if (isAuthenticated) {
            // 1. LOGGED IN: Fetch from Backend (triggers the merge via Laravel's cookie logic)
            try {
                const rawCart = await fetchBackendCart();
                setCart(rawCart ? processCartData(rawCart) : null);
                
                // IMPORTANT: If a merge occurred, the cookie is cleared by the server. 
                // We should also clear local storage immediately after a successful backend fetch 
                // to prevent old local items from being re-added later.
                saveLocalCart({ items: [] });

            } catch (err: any) {
                console.error("Backend Cart Fetch Error:", err);
                setCart(null);
                setError("Failed to load shopping cart.");
            }
        } else {
            // 2. GUEST: Load directly from Local Storage
            const local = getLocalCart();
            // Cast to Cart type (TS hack, as the structure is incomplete but sufficient for display)
            setCart(local as unknown as Cart); 
        }
        
        setCartLoading(false);
    }, [isAuthLoading, isAuthenticated, processCartData, fetchBackendCart]);


    // ------------------------------------
    // Item Actions (Add/Update/Remove)
    // ------------------------------------

    const addItem = useCallback(async (prodVariantId: string, quantity: number) => {
        setCartLoading(true);
        setError(null);

        if (isAuthenticated) {
            // LOGGED IN: API Call
            try {
                await getCsrfToken(); 
                await publicClient.post('/cart', { prod_variant_id: prodVariantId, quantity });
                await fetchCart(); 
            } catch (err: any) {
                setError(err.response?.data?.message || 'Failed to add item to cart.');
            }
        } else {
            // GUEST: Local Storage Logic
            let localCart = getLocalCart();
            let existingItem = localCart.items.find(item => item.prod_variant_id === prodVariantId);
            
            if (existingItem) {
                existingItem.quantity += quantity;
            } else {
                 // Fetch product details for *minimal* local display fidelity
                 const { data: productData } = await publicClient.get(`/products/${prodVariantId}`);

                 localCart.items.push({
                    id: uuidv4(), // Generate client-side ID
                    prod_variant_id: prodVariantId,
                    quantity: quantity,
                    variant: {
                        id: productData.id,
                        price: productData.base_price,
                        offer_price: productData.base_offer_price,
                        product: { id: productData.id, prod_name: productData.prod_name, base_price: productData.base_price }
                    }
                 } as unknown as LocalCartItem);
            }
            
            saveLocalCart(localCart);
            setCart(localCart as unknown as Cart);
        }
        setCartLoading(false);
    }, [isAuthenticated, fetchCart]);


    const updateItemQuantity = useCallback(async (prodVariantId: string, quantity: number) => {
        setCartLoading(true);
        
        if (isAuthenticated) {
            // LOGGED IN: API Call
            try {
                await getCsrfToken(); 
                await publicClient.put(`/cart/${prodVariantId}`, { quantity });
                await fetchCart();
            } catch (err: any) {
                setError(err.response?.data?.message || 'Failed to update item quantity.');
            }
        } else {
            // GUEST: Local Storage Logic
            let localCart = getLocalCart();
            
            if (quantity === 0) {
                localCart.items = localCart.items.filter(item => item.prod_variant_id !== prodVariantId);
            } else {
                let existingItem = localCart.items.find(item => item.prod_variant_id === prodVariantId);
                if (existingItem) {
                    existingItem.quantity = quantity;
                }
            }
            
            saveLocalCart(localCart);
            setCart(localCart as unknown as Cart);
        }
        setCartLoading(false);
    }, [isAuthenticated]);


    const removeItem = useCallback(async (prodVariantId: string) => {
        setCartLoading(true);

        if (isAuthenticated) {
            // LOGGED IN: API Call
            try {
                await getCsrfToken(); 
                await publicClient.delete(`/cart/${prodVariantId}`);
                await fetchCart();
            } catch (err: any) {
                setError(err.response?.data?.message || 'Failed to remove item from cart.');
            }
        } else {
            // GUEST: Local Storage Logic
            let localCart = getLocalCart();
            localCart.items = localCart.items.filter(item => item.prod_variant_id !== prodVariantId);
            saveLocalCart(localCart);
            setCart(localCart as unknown as Cart);
        }
        setCartLoading(false);
    }, [isAuthenticated]);


    // ---------------------------------------------------------------------
    // INITIAL LOAD / AUTH STATE CHANGE EFFECT
    // ---------------------------------------------------------------------

    useEffect(() => {
        // Triggers the initial load and the essential merge logic after login
        if (!isAuthLoading) {
            fetchCart();
        }
    }, [isAuthLoading, token, fetchCart]); 


    const contextValue: CartContextType = useMemo(() => ({
        cart,
        cartCount,
        cartLoading,
        error,
        
        // Expose Drawer State and Setter
        isCartDrawerOpen,
        setIsCartDrawerOpen,
        
        fetchCart,
        addItem,
        updateItemQuantity,
        removeItem,
    }), [cart, cartCount, cartLoading, error, isCartDrawerOpen, fetchCart, addItem, updateItemQuantity, removeItem]);

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