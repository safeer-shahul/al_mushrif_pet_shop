'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { FaHeart, FaExclamationTriangle, FaSpinner, FaShoppingCart, FaTrash } from 'react-icons/fa';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { toast } from 'react-hot-toast';
import { useWishlistService, WishlistItem } from '@/services/public/wishlistService';
import { useCategoryService } from '@/services/admin/categoryService'; 
import { ProductImage } from '@/types/product'; 
import Link from 'next/link';

const WishlistPage: React.FC = () => {
    const { isAuthenticated, isLoading } = useAuth();
    const { fetchWishlist, removeFromWishlist } = useWishlistService();
    const { addItem, setIsCartDrawerOpen } = useCart();
    const { getStorageUrl } = useCategoryService(); 
    const router = useRouter();
    
    const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
    const [pageLoading, setPageLoading] = useState(true);
    const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

    // --- Helper for safe JSON parsing (CRITICAL FIX) ---
    const getSafeImages = (images: any): ProductImage[] => {
        if (Array.isArray(images)) return images;
        if (typeof images === 'string') {
            try {
                // Safely parse the JSON string (e.g., "[]")
                return JSON.parse(images) as ProductImage[];
            } catch (e) {
                return [];
            }
        }
        return [];
    };

    // Helper function to find the best image candidate (primary or first valid object)
    const findPrimaryOrFirst = (images: any[]): any | null => {
        if (!images || images.length === 0) return null;
        
        // 1. Try to find primary image
        const primary = images.find(img => img && img.is_primary);
        if (primary) return primary;

        // 2. Fall back to the first non-null image object
        const firstImage = images.find(img => img);
        return firstImage || null;
    };
    // --- End Helpers ---

    const loadWishlist = useCallback(async () => {
        if (!isAuthenticated) return;
        setPageLoading(true);
        try {
            const data = await fetchWishlist();
            setWishlist(data || []);
        } catch (error) {
            toast.error("Failed to load wishlist. Please try refreshing.");
            setWishlist([]);
        } finally {
            setPageLoading(false);
        }
    }, [isAuthenticated, fetchWishlist]);

    // Fetch wishlist on mount/auth status change
    useEffect(() => {
        if (!isLoading) {
            if (!isAuthenticated) {
                // Redirect unauthenticated users to login
                router.replace(`/login?redirect=/user/wishlist`);
            } else {
                loadWishlist();
            }
        }
    }, [isAuthenticated, isLoading, router, loadWishlist]);
    
    const handleRemove = async (wishlistId: string, prodName: string) => {
        if (!window.confirm(`Are you sure you want to remove "${prodName}" from your wishlist?`)) return;

        setActionLoadingId(wishlistId);
        try {
            await removeFromWishlist(wishlistId);
            setWishlist(prev => prev.filter(item => item.id !== wishlistId));
            toast.success(`Removed ${prodName} from wishlist.`);
        } catch (error: any) {
            toast.error(error.message || "Failed to remove item.");
        } finally {
            setActionLoadingId(null);
        }
    };
    
    const handleAddToCart = async (prodVariantId: string, prodName: string, wishlistId: string) => {
        setActionLoadingId(prodVariantId);
        try {
            await addItem(prodVariantId, 1);
            setIsCartDrawerOpen(true);
            toast.success(`Added ${prodName} to cart.`);
        } catch (error: any) {
            toast.error(error.message || "Failed to add item to cart.");
        } finally {
            setActionLoadingId(null);
        }
    };

    if (isLoading || pageLoading || !isAuthenticated) {
        return <LoadingSpinner />;
    }
    
    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-slate-800 flex items-center mb-6">
                <FaHeart className="mr-3 text-red-500" /> My Wishlist ({wishlist.length})
            </h1>
            
            {wishlist.length === 0 ? (
                <div className="p-10 text-center border rounded-xl bg-gray-50">
                    <FaExclamationTriangle className="w-10 h-10 mx-auto mb-3 text-red-400" />
                    <p className="text-lg font-medium text-slate-700">Your wishlist is empty.</p>
                    <p className="text-gray-500 mt-1">Start browsing products to save your favorites!</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {wishlist.map(item => {
                        const product = item.variant.product;
                        
                        // 1. SAFELY RESOLVE VARIANT IMAGES
                        const variantImages = getSafeImages(item.variant.images);
                        
                        // 2. SAFELY RESOLVE PRODUCT IMAGES (Requires backend to load product.images)
                        const productImages = product.images && product.images.length > 0 
                            ? product.images 
                            : [];

                        // 3. IMAGE RESOLUTION: Find the best candidate
                        const primaryImageCandidate = findPrimaryOrFirst(variantImages) || findPrimaryOrFirst(productImages);
                        const imageUrl = getStorageUrl(primaryImageCandidate?.image_url || null);
                        
                        // FIX: Safely parse price and use offer_price if available
                        const price = parseFloat(String(item.variant.offer_price || item.variant.price || '0'));
                        
                        return (
                            <div key={item.id} className="p-4 bg-white border rounded-lg shadow-sm flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <div className="w-16 h-16 bg-gray-100 rounded flex-shrink-0 overflow-hidden">
                                        {imageUrl ? (
                                            <img 
                                                src={imageUrl} 
                                                alt={product.prod_name} 
                                                className="w-full h-full object-contain p-1"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No Image</div>
                                        )}
                                    </div>
                                    <div className='flex-1'>
                                        <Link href={`/product/${product.id}`} className="font-semibold text-slate-800 hover:text-blue-600 transition-colors">
                                            {product.prod_name}
                                        </Link>
                                        <p className="text-sm text-gray-500">{item.variant.variant_name || 'Default'}</p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end flex-shrink-0 ml-4">
                                    
                                    <p className="font-bold text-lg text-red-600">AED {price.toFixed(2)}</p>
                                    <div className="mt-2 flex space-x-2">
                                        
                                        <button 
                                            onClick={() => handleAddToCart(item.prod_variant_id, product.prod_name, item.id)}
                                            disabled={actionLoadingId === item.prod_variant_id}
                                            className="px-3 py-1 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 text-sm disabled:opacity-50 flex items-center"
                                        >
                                            {actionLoadingId === item.prod_variant_id ? <FaSpinner className="animate-spin mr-1" /> : <FaShoppingCart className='mr-1' />}
                                            Cart
                                        </button>
                                        
                                        <button 
                                            onClick={() => handleRemove(item.id, product.prod_name)}
                                            disabled={actionLoadingId === item.id}
                                            className="px-3 py-1 text-red-600 border border-red-600 rounded-lg hover:bg-red-50 text-sm disabled:opacity-50 flex items-center"
                                        >
                                            {actionLoadingId === item.id ? <FaSpinner className="animate-spin mr-1" /> : <FaTrash className='mr-1' />}
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default WishlistPage;