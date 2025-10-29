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
// NOTE: Assuming your LoginModal component is available at this path
import LoginModal from '@/components/public/LoginModal'; 

// Define the primary color variable for easy styling consistency
const PRIMARY_COLOR = 'var(--color-primary, #FF6B35)';

const WishlistPage: React.FC = () => {
    const { isAuthenticated, isLoading } = useAuth();
    const { fetchWishlist, removeFromWishlist } = useWishlistService();
    const { addItem, setIsCartDrawerOpen } = useCart();
    const { getStorageUrl } = useCategoryService(); 
    const router = useRouter();
    
    const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
    const [pageLoading, setPageLoading] = useState(true);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false); // 💡 NEW STATE
    
    // actionLoadingId can be either wishlistId (for remove) or prodVariantId (for add to cart)
    const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

    // --- Helper for safe JSON parsing ---
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

    // Fetch wishlist on mount/auth status change OR open modal
    useEffect(() => {
        if (!isLoading) {
            if (!isAuthenticated) {
                // 💡 FIX: Stop redirection and open the modal immediately
                setPageLoading(false); 
                setIsLoginModalOpen(true);
            } else {
                // Close modal and load data if authentication succeeds
                setIsLoginModalOpen(false);
                loadWishlist();
            }
        }
    }, [isAuthenticated, isLoading, loadWishlist]);
    
    // Handle the case where the user closes the modal without logging in
    const handleModalClose = () => {
        setIsLoginModalOpen(false);
        // If they close the modal while unauthenticated, push them back to the home page
        if (!isAuthenticated) {
            router.push('/');
        }
    };

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
            
            // Optionally remove from wishlist after adding to cart for cleaner experience
            // We pass the actual wishlistId to handleRemove
            handleRemove(wishlistId, prodName); 
            
        } catch (error: any) {
            toast.error(error.message || "Failed to add item to cart.");
        } finally {
            // Note: actionLoadingId is reset by handleRemove if successful, otherwise reset here
            if(actionLoadingId !== wishlistId) setActionLoadingId(null); 
        }
    };

    // Show spinner ONLY while we are checking auth state initially
    if (isLoading) {
        return <LoadingSpinner />;
    }
    
    // If we determined they are NOT authenticated, show the modal instead of the content
    if (!isAuthenticated) {
         // Render a placeholder div while waiting for the modal, or immediately render the modal
         return (
             <>
                <div className="bg-white p-6 rounded-xl shadow-2xl h-96 flex items-center justify-center">
                    <p className="text-xl text-slate-500">Please log in to view your wishlist.</p>
                </div>
                <LoginModal 
                    isOpen={isLoginModalOpen} 
                    onClose={handleModalClose} 
                    onLoginSuccess={loadWishlist} // Reload data after login
                />
             </>
         );
    }
    
    // Once authenticated, show loading state while fetching data
    if (pageLoading) {
        return <LoadingSpinner />;
    }
    
    return (
        <>
            <div className="bg-white p-6 rounded-xl shadow-2xl border border-gray-100 space-y-6">
                <h1 className="text-xl font-bold text-slate-800 flex items-center border-b border-gray-200 pb-4">
                    <FaHeart className="mr-3 w-7 h-7 text-red-600" /> My Wishlist ({wishlist.length})
                </h1>
                
                {wishlist.length === 0 ? (
                    <div className="p-10 text-center border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">
                        <FaHeart className="w-12 h-12 mx-auto mb-3 text-red-400" />
                        <p className="text-lg font-semibold text-slate-700">Your wishlist is empty.</p>
                        <p className="text-gray-600 mt-1">Start browsing products to save your favorites!</p>
                        <Link 
                            href="/products" 
                            className="mt-4 inline-block font-medium text-white px-6 py-2 rounded-lg transition-colors shadow-md" 
                            style={{ backgroundColor: PRIMARY_COLOR, color: 'white' }}
                        >
                            Browse Products
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {wishlist.map(item => {
                            const product = item.variant.product;
                            
                            // --- Image Resolution ---
                            // Note: getSafeImages handles the JSON string issue if present
                            const variantImages = getSafeImages(item.variant.images);
                            const productImages = product.images && product.images.length > 0 ? product.images : [];
                            const primaryImageCandidate = findPrimaryOrFirst(variantImages) || findPrimaryOrFirst(productImages);
                            const imageUrl = getStorageUrl(primaryImageCandidate?.image_url || null);
                            
                            // Price calculation
                            const regularPrice = parseFloat(String(item.variant.price || '0'));
                            const offerPrice = parseFloat(String(item.variant.offer_price || '0'));
                            const price = offerPrice > 0 && offerPrice < regularPrice ? offerPrice : regularPrice;
                            const isDiscounted = offerPrice > 0 && offerPrice < regularPrice;

                            const isAddToCartLoading = actionLoadingId === item.prod_variant_id;
                            const isRemoveLoading = actionLoadingId === item.id;
                            
                            return (
                                <div key={item.id} className="p-4 bg-white border border-gray-200 rounded-xl shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between transition-shadow hover:shadow-xl">
                                    <div className="flex items-start flex-1 w-full sm:w-auto space-x-4">
                                        {/* Product Image */}
                                        <div className="w-20 h-20 bg-gray-50 rounded-lg flex-shrink-0 overflow-hidden border border-gray-200">
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
                                        
                                        {/* Details */}
                                        <div className='flex-1 min-w-0'>
                                            <Link href={`/product/${product.id}`} className="font-bold text-lg text-slate-800 hover:text-[var(--color-primary,#FF6B35)] transition-colors line-clamp-2">
                                                {product.prod_name}
                                            </Link>
                                            <p className="text-sm text-gray-600 mt-1">{item.variant.variant_name || 'Default Variant'}</p>
                                        </div>
                                    </div>
                                    
                                    {/* Price & Actions */}
                                    <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row items-start sm:items-center justify-between sm:justify-end space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
                                        <div className="text-left sm:text-right flex-shrink-0 min-w-[100px]">
                                            <p className="font-extrabold text-xl" style={{ color: isDiscounted ? PRIMARY_COLOR : 'inherit' }}>
                                                AED {price.toFixed(2)}
                                            </p>
                                            {isDiscounted && (
                                                <p className="text-sm text-gray-500 line-through">
                                                    AED {regularPrice.toFixed(2)}
                                                </p>
                                            )}
                                        </div>
                                        
                                        <div className="flex space-x-2 w-full sm:w-auto">
                                            {/* Add to Cart Button (Branded Primary Color) */}
                                            <button 
                                                onClick={() => handleAddToCart(item.prod_variant_id, product.prod_name, item.id)}
                                                disabled={isAddToCartLoading || isRemoveLoading}
                                                className="flex-1 sm:flex-none px-4 py-2 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center shadow-md"
                                                style={{ backgroundColor: PRIMARY_COLOR, color: 'white' }}
                                            >
                                                {isAddToCartLoading ? <FaSpinner className="animate-spin mr-2" /> : <FaShoppingCart className='mr-2' />}
                                                Add to Cart
                                            </button>
                                            
                                            {/* Remove Button (Cautionary Red) */}
                                            <button 
                                                onClick={() => handleRemove(item.id, product.prod_name)}
                                                disabled={isAddToCartLoading || isRemoveLoading}
                                                className="flex-1 sm:flex-none px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center"
                                            >
                                                {isRemoveLoading ? <FaSpinner className="animate-spin mr-2" /> : <FaTrash className='mr-2' />}
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
            {/* The LoginModal is rendered here when needed */}
            <LoginModal 
                isOpen={isLoginModalOpen} 
                onClose={handleModalClose} 
                onLoginSuccess={loadWishlist} // Reload data after successful login
            />
        </>
    );
};

export default WishlistPage;
