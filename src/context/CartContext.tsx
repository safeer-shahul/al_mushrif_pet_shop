'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { Cart, CartContextType, CartItem } from '@/types/cart'; 
import { useAuth } from './AuthContext'; 
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
        product: { id: string, prod_name: string, base_price: number | null, images?: any[] };
        images?: any[];
        quantity?: number | null; // Must match the ProdVariant type
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
    
    // HELPER: Dynamically selects the correct Axios client (Authenticated or Public)
    const getClient = useCallback((): AxiosInstance => {
        return isAuthenticated && token 
            ? createAuthenticatedClient(token) 
            : publicClient;
    }, [isAuthenticated, token]);


    // Helper to process the *backend* data structure for the frontend display
    const processCartData = useCallback((rawCart: Cart | null): Cart | null => {
        if (!rawCart) return null;
        
        const processedItems: CartItem[] = rawCart.items.map(item => {
            
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
                primaryImage = (variantImages as any[]).find(img => img.is_primary) || (variantImages as any[])[0];
            } 
            
            const productHasImages = item.variant.product.images && item.variant.product.images.length > 0;

            if (!primaryImage && productHasImages && item.variant.product.has_variants === false) {
                primaryImage = item.variant.product.images!.find(img => img.is_primary) || item.variant.product.images![0];
            } 
            // --- END IMAGE RESOLUTION LOGIC ---
            
            return {
                ...item,
                primary_image_url: primaryImage?.image_url ? getStorageUrl(primaryImage.image_url) : null
            } as CartItem; 
        });

        return { ...rawCart, items: processedItems };
    }, [getStorageUrl]);

    // Fetches the entire cart instance from the Laravel API
    const fetchBackendCart = useCallback(async () => {
        const client = getClient();
        try {
            const response: AxiosResponse<Cart> = await client.get('/cart');
            return response.data;
        } catch (error) {
            return null;
        }
    }, [getClient]);
    
    // Check if a product variant is valid (in stock and active) - always public route
    const checkProductValidity = useCallback(async (prodVariantId: string): Promise<{valid: boolean, reason?: string, available_quantity?: number}> => {
        try {
            const response = await publicClient.get(`/products/${prodVariantId}/validate`);
            // Check if stock is 0 but item is still technically valid/active
            if (response.data.stock !== undefined && response.data.stock !== 'untracked' && response.data.stock <= 0) {
                 return { valid: false, reason: 'Out of stock', available_quantity: response.data.stock };
            }
            return response.data;
        } catch (error: any) {
             // If the API call fails or returns 400/404, capture the error message
             const reason = error.response?.data?.message || 'Product validation failed';
             const stock = error.response?.data?.available_quantity;
             return { valid: false, reason: reason, available_quantity: stock };
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
                } catch (err: any) {
                    // API might throw 400 due to stock limits, capture error
                    console.error('Failed to sync item:', item, err);
                    newInvalidItems.push({
                        id: item.prod_variant_id,
                        reason: err.response?.data?.message || 'Stock issue prevented sync.'
                    });
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
        
        // This relies on the AuthProvider dispatching a custom event on successful login
        window.addEventListener('user-logged-in', handleLoginSync);
        
        return () => {
            window.removeEventListener('user-logged-in', handleLoginSync);
        };
    }, [syncGuestCartWithUser]);

    // Item Actions (Add/Update/Remove)

    const addItem = useCallback(async (prodVariantId: string, quantity: number) => {
        setCartLoading(true);
        setError(null);

        // Perform client-side validation check first
        const validity = await checkProductValidity(prodVariantId);
        if (!validity.valid) {
            setCartLoading(false);
            // Throw a precise error so the calling component can handle the out-of-stock toast
            throw new Error(validity.reason || 'This product cannot be added to your cart'); 
        }

        if (isAuthenticated) {
            // LOGGED IN: Backend logic
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
            // GUEST: Local Storage Logic 
            let localCart = getLocalCart();
            let existingItem = localCart.items.find(item => item.prod_variant_id === prodVariantId);
            
            // Re-fetch product data for price/image if it's a NEW item or if data is stale
            let productData;
            
            if (!existingItem) {
                 try {
                    const response = await publicClient.get(`/products/${prodVariantId}`);
                    productData = response.data;
                 } catch (err: any) {
                    setCartLoading(false);
                    throw new Error(err.response?.data?.message || 'Failed to fetch product details for guest cart.');
                 }
            } else {
                 // Use existing data for quick update
                 productData = existingItem.variant.product; 
            }

            // Check final quantity against available stock (Local Check using validation stock)
            const currentQty = existingItem ? existingItem.quantity : 0;
            const newTotalQty = currentQty + quantity;
            const variantQuantity = validity.available_quantity; 

            if (variantQuantity !== null && variantQuantity !== undefined && newTotalQty > variantQuantity) {
                 setCartLoading(false);
                 throw new Error(`Only ${variantQuantity} units available.`);
            }
            
            try {
                 if (existingItem) {
                     existingItem.quantity = newTotalQty;
                 } else {
                     // Create new item structure for local storage
                     const allImages = (productData.variants?.[0]?.images || []).concat(productData.images || []);
                     const primaryImage = allImages.find((img: any) => img.is_primary) || allImages[0];
                     const imageUrl = primaryImage?.image_url ? getStorageUrl(primaryImage.image_url) : null;
                     
                     const hasVariants = productData.variants && productData.variants.length > 0;

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
                             is_active: true, 
                             product: { 
                                 id: productData.id, 
                                 prod_name: productData.prod_name, 
                                 base_price: productData.base_price 
                             }
                         }
                     } as LocalCartItem); 
                 }
            } catch (err: any) {
                 // Catch any unexpected structural error during local cart manipulation
                 console.error("Guest Cart Local Manipulation Error:", err);
                 setCartLoading(false);
                 throw new Error(err.message || 'Error updating local cart.');
            }
            
            saveLocalCart(localCart);
            setCart(localCart as unknown as Cart);
        }
        setCartLoading(false);
    }, [isAuthenticated, fetchCart, getStorageUrl, checkProductValidity, getClient]);


    const updateItemQuantity = useCallback(async (prodVariantId: string, quantity: number) => {
        setCartLoading(true);
        
        if (isAuthenticated) {
            // LOGGED IN: Backend logic
            const client = getClient(); 
            try {
                await getCsrfToken(); 
                await client.put(`/cart/${prodVariantId}`, { quantity });
                await fetchCart();
            } catch (err: any) {
                setError(err.response?.data?.message || 'Failed to update item quantity.');
            }
        } else {
            // GUEST: Local Storage Logic 
            let localCart = getLocalCart();
            let existingItem = localCart.items.find(item => item.prod_variant_id === prodVariantId);
            
            if (quantity === 0) {
                 localCart.items = localCart.items.filter(item => item.prod_variant_id !== prodVariantId);
            } else if (existingItem) {
                 // FIX: Re-check stock before setting quantity
                 const available = existingItem.variant.quantity;
                 
                 // CRITICAL FIX: Use type check to ensure 'available' is a number before comparison
                 if (available !== undefined && available !== null && quantity > available) {
                     toast.error(`Only ${available} units available`);
                     quantity = available; // Cap the quantity
                 }
                 existingItem.quantity = quantity;
            }
            
            saveLocalCart(localCart);
            setCart(localCart as unknown as Cart);
        }
        setCartLoading(false);
    }, [isAuthenticated, fetchCart, getClient]);


    const removeItem = useCallback(async (prodVariantId: string) => {
        setCartLoading(true);

        if (isAuthenticated) {
            const client = getClient();
            try {
                await getCsrfToken(); 
                await client.delete(`/cart/${prodVariantId}`);
                await fetchCart();
            } catch (err: any) {
                setError(err.response?.data?.message || 'Failed to remove item from cart.');
            }
        } else {
            let localCart = getLocalCart();
            localCart.items = localCart.items.filter(item => item.prod_variant_id !== prodVariantId);
            saveLocalCart(localCart);
            setCart(localCart as unknown as Cart);
        }
        setCartLoading(false);
    }, [isAuthenticated, fetchCart, getClient]);

    // Function to validate all cart items before checkout (used in CheckoutModal)
    const validateCart = useCallback(async (): Promise<boolean> => {
         if (!cart || cart.items.length === 0) return false;
        
         setCartLoading(true);
         const client = getClient();
         let isValid = true;
         
         try {
             if (isAuthenticated) {
                 // Server-side validation
                 const response = await client.post('/cart/validate');
                 
                 if (response.data.invalid_items && response.data.invalid_items.length > 0) {
                     setInvalidItems(response.data.invalid_items);
                     await fetchCart();
                     isValid = false;
                 }
             } else {
                 // Guest cart validation (frontend check)
                 const localCart = getLocalCart();
                 const itemsToRemove: string[] = [];
                 
                 for (const item of localCart.items) {
                     const validity = await checkProductValidity(item.prod_variant_id);
                     if (!validity.valid) {
                         itemsToRemove.push(item.prod_variant_id);
                         toast.error(`"${item.variant.product.prod_name}" removed: ${validity.reason}`);
                         isValid = false;
                         continue;
                     }
                     
                     // Check stock again for local items
                     const available = item.variant.quantity;
                     
                     // CRITICAL FIX: Use type guard for null/undefined check
                     if (typeof available === 'number' && item.quantity > available) { 
                         
                         if (available <= 0) {
                             itemsToRemove.push(item.prod_variant_id);
                             toast.error(`"${item.variant.product.prod_name}" removed: Out of stock`);
                             isValid = false;
                         } else {
                             // Adjust quantity locally
                             item.quantity = available;
                             toast.error(`"${item.variant.product.prod_name}" quantity adjusted to ${available}.`);
                             isValid = false;
                         }
                     }
                 }
                 
                 if (itemsToRemove.length > 0) {
                     localCart.items = localCart.items.filter(
                         item => !itemsToRemove.some(invalid => invalid === item.prod_variant_id)
                     );
                     
                     saveLocalCart(localCart);
                     setCart(localCart as unknown as Cart);
                     
                     // Toast handled inside the loop
                     isValid = false;
                 }
             }
         } catch (err: any) {
             setError(err.response?.data?.message || 'Failed to validate cart items.');
             isValid = false;
         } finally {
             setCartLoading(false);
         }
         
         return isValid;
    }, [cart, isAuthenticated, getClient, checkProductValidity, fetchCart]);


    useEffect(() => {
        if (!isAuthLoading) {
            fetchCart();
            
            // Note: Login sync is now handled by the 'user-logged-in' event listener
        }
    }, [isAuthLoading, fetchCart]);


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