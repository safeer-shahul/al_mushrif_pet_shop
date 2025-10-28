'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { Cart, CartContextType, CartItem } from '@/types/cart'; 
import { useAuth } from './AuthContext'; 
// CRITICAL FIX: Import necessary utility functions from ApiClient.ts
import { publicClient, getCsrfToken, createAuthenticatedClient } from '@/utils/ApiClient'; 
import { AxiosResponse, AxiosInstance } from 'axios';
import { useCategoryService } from '@/services/admin/categoryService'; 
import { v4 as uuidv4 } from 'uuid'; 
import { toast } from 'react-hot-toast';

// ------------------------------------
// 1. Context Creation & Constants
// ------------------------------------

const CartContext = createContext<CartContextType | undefined>(undefined);
const LOCAL_STORAGE_CART_KEY = 'localGuestCart'; 

// --- Local Cart Types (for guest mode) ---
type LocalCartItem = {
    id: string; // Client-side unique ID for the item instance
    prod_variant_id: string;
    quantity: number;
    primary_image_url: string | null; 
    variant: { 
        id: string; 
        price: number | null; 
        offer_price: number | null; 
        product: { id: string, prod_name: string, base_price: number | null, images?: any[] }; // Added images for local cart lookup
        images?: any[];
        quantity?: number; 
        is_active?: boolean; 
    };
};
type LocalCart = { items: LocalCartItem[] };


// --- Local Storage Helpers ---
const getLocalCart = (): LocalCart => {
    if (typeof window === 'undefined') return { items: [] };
    try {
        const storedCart = localStorage.getItem(LOCAL_STORAGE_CART_KEY);
        const parsedCart = storedCart ? JSON.parse(storedCart) : { items: [] };
        if (!Array.isArray(parsedCart.items)) throw new Error('Local cart items corrupted.');
        return parsedCart;
    } catch (e) {
        console.error("Failed to parse local cart, resetting.", e);
        const newCart = { items: [] };
        saveLocalCart(newCart);
        return newCart;
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
    const { getStorageUrl } = useCategoryService(); 

    const [cart, setCart] = useState<Cart | null>(null);
    const [cartLoading, setCartLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false); 
    const [invalidItems, setInvalidItems] = useState<{id: string, reason: string}[]>([]);


    const cartCount = useMemo(() => {
        return cart?.items.reduce((total, item) => total + item.quantity, 0) || 0;
    }, [cart]);
    
    // 💡 HELPER: Dynamically selects the correct Axios client (Authenticated or Public)
    const getClient = useCallback((): AxiosInstance => {
        return isAuthenticated && token 
            ? createAuthenticatedClient(token) 
            : publicClient;
    }, [isAuthenticated, token]);


    // Helper to process the *backend* data structure for the frontend display
    const processCartData = useCallback((rawCart: Cart | null): Cart | null => {
        if (!rawCart) return null;
        
        const processedItems: CartItem[] = rawCart.items.map(item => {
            
            // CRITICAL: Ensure images is an array before using .find()
            let variantImages = item.variant.images || [];
            if (typeof variantImages === 'string') {
                try {
                    variantImages = JSON.parse(variantImages);
                } catch (e) {
                    variantImages = [];
                }
            }
            
            let primaryImage: any = null;

            // --- IMAGE RESOLUTION LOGIC ---
            if (variantImages.length > 0) {
                // 1. Use the image linked to the variant (standard variant)
                primaryImage = (variantImages as any[]).find(img => img.is_primary) || (variantImages as any[])[0];
            } 
            
            // CRITICAL FIX: Explicitly check if item.variant.product.images is truthy (not null/undefined) 
            // before checking its length, and confirm it's a base product.
            const productHasImages = item.variant.product.images && item.variant.product.images.length > 0;

            if (!primaryImage && productHasImages && item.variant.product.has_variants === false) {
                // 2. If no variant images AND it's a BASE PRODUCT, use product images.
                primaryImage = item.variant.product.images!.find(img => img.is_primary) || item.variant.product.images![0];
            } 
            // --- END IMAGE RESOLUTION LOGIC ---
            
            return {
                ...item,
                // Injects the resolved URL path
                primary_image_url: primaryImage?.image_url ? getStorageUrl(primaryImage.image_url) : null
            } as CartItem; 
        });

        return { ...rawCart, items: processedItems };
    }, [getStorageUrl]);

    // Fetches the entire cart instance from the Laravel API
    const fetchBackendCart = useCallback(async () => {
        // Use the dynamic client here. If authenticated, it sends the token.
        const client = getClient();
        try {
            // NOTE: Requires backend eager loading of 'items.variant.product.images'
            const response: AxiosResponse<Cart> = await client.get('/cart');
            return response.data;
        } catch (error) {
            return null;
        }
    }, [getClient]);
    
    // Check if a product variant is valid (in stock and active) - always public route
    const checkProductValidity = useCallback(async (prodVariantId: string): Promise<{valid: boolean, reason?: string}> => {
        try {
            const response = await publicClient.get(`/products/${prodVariantId}/validate`);
            return response.data;
        } catch (error) {
            return { valid: true };
        }
    }, []);

    // CORE FETCH LOGIC
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
            // 1. LOGGED IN: Fetch from Backend (will use Auth Client)
            try {
                const rawCart = await fetchBackendCart();
                setCart(rawCart ? processCartData(rawCart) : null);
            } catch (err: any) {
                console.error("Backend Cart Fetch Error:", err);
                setCart(null);
                setError("Failed to load shopping cart.");
            }
        } else {
            // 2. GUEST: Load directly from Local Storage
            const local = getLocalCart();
            setCart(local as unknown as Cart); 
        }
        
        setCartLoading(false);
    }, [isAuthLoading, isAuthenticated, processCartData, fetchBackendCart]);

    // NEW: Synchronize guest cart with user cart after login
    const syncGuestCartWithUser = useCallback(async () => {
        if (!isAuthenticated) return;
        
        const localCart = getLocalCart();
        if (localCart.items.length === 0) return;
        
        setCartLoading(true);
        const client = getClient();
        
        try {
            const newInvalidItems = [];
            
            for (const item of localCart.items) {
                try {
                    const validity = await checkProductValidity(item.prod_variant_id);
                    
                    if (!validity.valid) {
                        newInvalidItems.push({
                            id: item.prod_variant_id,
                            reason: validity.reason || 'Product is no longer available'
                        });
                        continue;
                    }
                    
                    await getCsrfToken();
                    // Use the authenticated client for POSTing guest items to the user's backend cart
                    await client.post('/cart', { 
                        prod_variant_id: item.prod_variant_id, 
                        quantity: item.quantity 
                    });
                } catch (err) {
                    console.error('Failed to sync item:', item, err);
                }
            }
            
            if (newInvalidItems.length > 0) {
                setInvalidItems(newInvalidItems);
                toast.error(`${newInvalidItems.length} item(s) couldn't be added to your cart`);
            }
            
            saveLocalCart({ items: [] });
            await fetchCart();
            
        } catch (err) {
            console.error('Failed to sync guest cart:', err);
            setError('Failed to sync your cart. Please try again.');
        } finally {
            setCartLoading(false);
        }
    }, [isAuthenticated, fetchCart, checkProductValidity, getClient]); 

    // NEW: Listen for login events to trigger cart sync
    useEffect(() => {
        const handleLoginSync = () => {
            syncGuestCartWithUser();
        };
        
        window.addEventListener('user-logged-in', handleLoginSync);
        
        return () => {
            window.removeEventListener('user-logged-in', handleLoginSync);
        };
    }, [syncGuestCartWithUser]);

    // Item Actions (Add/Update/Remove)

    const addItem = useCallback(async (prodVariantId: string, quantity: number) => {
        setCartLoading(true);
        setError(null);

        const validity = await checkProductValidity(prodVariantId);
        if (!validity.valid) {
            setCartLoading(false);
            throw new Error(validity.reason || 'This product cannot be added to your cart');
        }

        if (isAuthenticated) {
            // Use the dynamic client for authenticated actions
            const client = getClient(); 
            try {
                await getCsrfToken(); 
                await client.post('/cart', { prod_variant_id: prodVariantId, quantity });
                await fetchCart(); 
            } catch (err: any) {
                setCartLoading(false); 
                throw new Error(err.response?.data?.message || 'Failed to add item to cart.');
            }
        } else {
            // GUEST: Local Storage Logic (using publicClient for product detail lookup)
            let localCart = getLocalCart();
            let existingItem = localCart.items.find(item => item.prod_variant_id === prodVariantId);
            
            try {
                if (existingItem) {
                    existingItem.quantity += quantity;
                } else {
                    // Fetch detailed product for image/price data (public endpoint)
                    const response = await publicClient.get(`/products/${prodVariantId}`);
                    const productData = response.data;

                    // Extract and Resolve Image URL
                    const allImages = (productData.variants?.[0]?.images || []).concat(productData.images || []);
                    const primaryImage = allImages.find((img: any) => img.is_primary) || allImages[0];
                    const imageUrl = primaryImage?.image_url ? getStorageUrl(primaryImage.image_url) : null;
                    
                    const hasVariants = productData.variants && productData.variants.length > 0;
                    const variantQuantity = hasVariants ? productData.variants[0].quantity : productData.base_quantity;
                    const isActive = !productData.is_disabled;
                    
                    if (!isActive) {
                        throw new Error('This product is currently not available');
                    }
                    
                    if (variantQuantity !== null && variantQuantity < quantity) {
                        throw new Error(`Only ${variantQuantity} units available`);
                    }
                    
                    localCart.items.push({
                        id: uuidv4(), 
                        prod_variant_id: prodVariantId,
                        quantity: quantity,
                        primary_image_url: imageUrl,
                        variant: {
                            id: hasVariants ? productData.variants[0].id : productData.id,
                            price: hasVariants ? productData.variants[0].price : productData.base_price,
                            offer_price: hasVariants ? productData.variants[0].offer_price : productData.base_offer_price,
                            quantity: variantQuantity, 
                            is_active: isActive, 
                            product: { 
                                id: productData.id, 
                                prod_name: productData.prod_name, 
                                base_price: productData.base_price 
                            }
                        }
                    } as LocalCartItem); 
                }
            } catch (err: any) {
                console.error("Guest Cart Add Error:", err);
                setCartLoading(false);
                throw new Error(err.message || 'Failed to add product to cart');
            }
            
            saveLocalCart(localCart);
            setCart(localCart as unknown as Cart);
        }
        setCartLoading(false);
    }, [isAuthenticated, fetchCart, getStorageUrl, checkProductValidity, getClient]);


    const updateItemQuantity = useCallback(async (prodVariantId: string, quantity: number) => {
        setCartLoading(true);
        
        if (isAuthenticated) {
            // Use the dynamic client for authenticated actions
            const client = getClient(); 
            try {
                await getCsrfToken(); 
                await client.put(`/cart/${prodVariantId}`, { quantity });
                await fetchCart();
            } catch (err: any) {
                setError(err.response?.data?.message || 'Failed to update item quantity.');
            }
        } else {
            // GUEST: Local Storage Logic (unchanged)
            let localCart = getLocalCart();
            
            if (quantity === 0) {
                localCart.items = localCart.items.filter(item => item.prod_variant_id !== prodVariantId);
            } else {
                let existingItem = localCart.items.find(item => item.prod_variant_id === prodVariantId);
                if (existingItem) {
                    if (existingItem.variant.quantity !== undefined && quantity > existingItem.variant.quantity) {
                        toast.error(`Only ${existingItem.variant.quantity} units available`);
                        quantity = existingItem.variant.quantity;
                    }
                    existingItem.quantity = quantity;
                }
            }
            
            saveLocalCart(localCart);
            setCart(localCart as unknown as Cart);
        }
        setCartLoading(false);
    }, [isAuthenticated, fetchCart, getClient]);


    const removeItem = useCallback(async (prodVariantId: string) => {
        setCartLoading(true);

        if (isAuthenticated) {
            // Use the dynamic client for authenticated actions
            const client = getClient();
            try {
                await getCsrfToken(); 
                await client.delete(`/cart/${prodVariantId}`);
                await fetchCart();
            } catch (err: any) {
                setError(err.response?.data?.message || 'Failed to remove item from cart.');
            }
        } else {
            // GUEST: Local Storage Logic (unchanged)
            let localCart = getLocalCart();
            localCart.items = localCart.items.filter(item => item.prod_variant_id !== prodVariantId);
            saveLocalCart(localCart);
            setCart(localCart as unknown as Cart);
        }
        setCartLoading(false);
    }, [isAuthenticated, fetchCart, getClient]);

    // NEW: Function to validate all cart items before checkout
    const validateCart = useCallback(async (): Promise<boolean> => {
        if (!cart || cart.items.length === 0) return false;
        
        setCartLoading(true);
        const newInvalidItems: {id: string, reason: string}[] = [];
        const client = getClient();

        try {
            if (isAuthenticated) {
                try {
                    // Use the authenticated client for server-side validation
                    const response = await client.post('/cart/validate');
                    
                    if (response.data.invalid_items && response.data.invalid_items.length > 0) {
                        setInvalidItems(response.data.invalid_items);
                        
                        for (const item of response.data.invalid_items) {
                            // removeItem uses the dynamic client, ensuring authenticity
                            await removeItem(item.id); 
                            toast.error(`${item.name || 'An item'} was removed from your cart: ${item.reason}`);
                        }
                        
                        return false;
                    }
                    return true;
                } catch (err) {
                    setError('Failed to validate cart items');
                    return false;
                }
            } else {
                // Guest cart validation (frontend check)
                const localCart = getLocalCart();
                
                for (const item of localCart.items) {
                    const validity = await checkProductValidity(item.prod_variant_id);
                    
                    if (!validity.valid) {
                        newInvalidItems.push({
                            id: item.prod_variant_id,
                            reason: validity.reason || 'Product is no longer available'
                        });
                    }
                    
                    if (item.variant.quantity !== undefined && item.quantity > item.variant.quantity) {
                        newInvalidItems.push({
                            id: item.prod_variant_id,
                            reason: `Only ${item.variant.quantity} units available`
                        });
                    }
                }
                
                if (newInvalidItems.length > 0) {
                    setInvalidItems(newInvalidItems);
                    
                    localCart.items = localCart.items.filter(
                        item => !newInvalidItems.some(invalid => invalid.id === item.prod_variant_id)
                    );
                    
                    saveLocalCart(localCart);
                    setCart(localCart as unknown as Cart);
                    
                    toast.error(`${newInvalidItems.length} item(s) were removed from your cart`);
                    
                    return false;
                }
                
                return true;
            }
        } finally {
            setCartLoading(false);
        }
    }, [cart, isAuthenticated, removeItem, checkProductValidity, getClient]);


    useEffect(() => {
        if (!isAuthLoading) {
            fetchCart();
            
            if (isAuthenticated) {
                syncGuestCartWithUser();
            }
        }
    }, [isAuthLoading, isAuthenticated, fetchCart, syncGuestCartWithUser]);


    const contextValue: CartContextType = useMemo(() => ({
        cart,
        cartCount,
        cartLoading,
        error,
        isCartDrawerOpen,
        setIsCartDrawerOpen,
        fetchCart,
        addItem,
        updateItemQuantity,
        removeItem,
        validateCart,
        invalidItems,
    }), [
        cart, 
        cartCount, 
        cartLoading, 
        error, 
        isCartDrawerOpen, 
        fetchCart, 
        addItem, 
        updateItemQuantity, 
        removeItem,
        validateCart,
        invalidItems
    ]);

    return (
        <CartContext.Provider value={contextValue}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}