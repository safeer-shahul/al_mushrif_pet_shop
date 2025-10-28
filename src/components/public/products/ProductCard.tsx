// src/components/public/products/ProductCard.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { FaBoxOpen, FaShoppingCart, FaSpinner, FaExclamationCircle, FaHeart } from 'react-icons/fa';
import { Product, ProdVariant } from '@/types/product';
import { useCategoryService } from '@/services/admin/categoryService';
import { useCart } from '@/context/CartContext';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useWishlistService } from '@/services/public/wishlistService';

interface ProductCardProps {
    product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
    const { getStorageUrl } = useCategoryService();
    const { addItem, cartLoading, setIsCartDrawerOpen } = useCart();
    const { isAuthenticated, user } = useAuth();
    const { addToWishlist, removeFromWishlist, checkWishlistStatus } = useWishlistService(); // Use Wishlist Service
    const router = useRouter();

    const [wishlistItem, setWishlistItem] = useState<any | null>(null); 
    const isWishlisted = !!wishlistItem;
    
    // Track the selected variant index
    const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
    
    // Determine if product is out of stock or inactive
    const isOutOfStock = useMemo(() => {
        if (product.variants && product.variants.length > 0) {
            return product.variants.every(v => 
                (v.quantity !== undefined && v.quantity !== null && v.quantity <= 0)
            );
        }
        return product.base_quantity !== undefined && product.base_quantity !== null && product.base_quantity <= 0;
    }, [product]);
    
    const isProductDisabled = useMemo(() => {
        return product.is_disabled === true;
    }, [product]);
    
    // Get all variants (or create implicit variant for base product)
    const variants = useMemo(() => {
        if (product.variants && product.variants.length > 0) {
            return product.variants.map(variant => ({
                ...variant,
                price: parseFloat(String(variant.price || 0)),
                offer_price: variant.offer_price !== null && variant.offer_price !== undefined ? 
                    parseFloat(String(variant.offer_price)) : null,
            }));
        }
        
        // Create implicit variant for non-variant products
        if (product.base_price !== undefined && product.base_price !== null) {
            return [{
                id: product.id,
                prod_id: product.id,
                variant_name: "Default",
                price: parseFloat(String(product.base_price || 0)),
                offer_price: product.base_offer_price !== null && product.base_offer_price !== undefined ? 
                    parseFloat(String(product.base_offer_price)) : null,
                color_value: null,
                quantity: product.base_quantity,
                images: product.images,
            } as ProdVariant];
        }
        
        return [];
    }, [product]);
    
    // Get the currently selected variant
    const selectedVariant = useMemo(() => {
        if (variants.length === 0) return null;
        return variants[selectedVariantIndex] || variants[0];
    }, [variants, selectedVariantIndex]);
    
    // Cannot render if no valid variant
    if (!selectedVariant) return null;
    
    // Calculate prices based on selected variant
    const basePrice = selectedVariant.price || 0;
    const offerPrice = selectedVariant.offer_price;
    const finalPrice = offerPrice !== null ? offerPrice : basePrice;
    
    // Get discount percentage if available
    const discountPercent = useMemo(() => {
        if (offerPrice !== null && basePrice > 0) {
            return Math.round(((basePrice - offerPrice) / basePrice) * 100);
        }
        return null;
    }, [basePrice, offerPrice]);
    
    // Determine selected variant's stock status
    const isVariantOutOfStock = selectedVariant.quantity !== undefined && 
                               selectedVariant.quantity <= 0;
    
    // Determine Primary Image
    const primaryImage = useMemo(() => {
    // 1. Get images, ensuring fallback to an array if null or undefined
    let variantImages: any[] = selectedVariant?.images || [];

    // 2. CRITICAL FIX: If images came back as a string "[]" (a common Laravel JSON issue), parse it.
    if (typeof variantImages === 'string') {
        try {
            variantImages = JSON.parse(variantImages);
        } catch (e) {
            variantImages = [];
        }
    }
    
    // 3. Ensure the result is an array before using .find()
    if (!Array.isArray(variantImages)) {
        variantImages = [];
    }
    
    // Check 1: Try to get image from selected variant first
    if (variantImages.length > 0) {
        // Now variantImages is guaranteed to be a valid array
        const primary = variantImages.find(img => img.is_primary); 
        return primary || variantImages[0];
    }
    
    // Check 2: Fall back to product's main images (images array where prod_variant_id is null)
    if (product.images && product.images.length > 0) {
        const primary = product.images.find(img => img.is_primary);
        return primary || product.images[0];
    }
    
    return null;
}, [product.images, selectedVariant]);
    
    const imageUrl = getStorageUrl(primaryImage?.image_url || null);
    
    useEffect(() => {
        const checkStatus = async () => {
            if (isAuthenticated && selectedVariant) {
                // Check if the current selected variant is wishlisted
                try {
                    // Use the ID that represents the shippable item in the cart (variant ID or base product ID)
                    const item = await checkWishlistStatus(selectedVariant.id);
                    setWishlistItem(item);
                } catch (err) {
                    // console.error("Failed to check wishlist status:", err);
                    setWishlistItem(null);
                }
            } else {
                setWishlistItem(null);
            }
        };

        // Re-run check only if auth status or selected variant changes
        checkStatus();
    }, [isAuthenticated, selectedVariant, checkWishlistStatus]);

    
    // --- UPDATED: Wishlist Handler (using state ID for removal) ---
    const handleToggleWishlist = async (e: React.MouseEvent) => {
        e.preventDefault(); 
        e.stopPropagation();
        
        if (!isAuthenticated) {
            toast.error("Please log in to manage your wishlist.");
            return;
        }
        
        // Use the selected variant ID as the item to add/check
        const variantId = selectedVariant.id; 

        try {
            if (isWishlisted && wishlistItem) {
                // REMOVE: Use the unique Wishlist Item ID for the DELETE request
                await removeFromWishlist(wishlistItem.id); 
                setWishlistItem(null);
                toast.success(`Removed ${product.prod_name} from wishlist.`);
            } else {
                // ADD: Use the product variant ID for the POST request
                const newItem = await addToWishlist(variantId);
                setWishlistItem(newItem);
                toast.success(`Added ${product.prod_name} to wishlist!`);
            }
        } catch (error: any) {
             toast.error(error.message || "Failed to update wishlist.");
        }
    };

    // Action Handlers
    const handleAddToCart = async (e: React.MouseEvent) => {
        e.preventDefault(); 
        e.stopPropagation();
        
        if (!selectedVariant) {
            toast.error('Please select a variant');
            return;
        }
        
        // Prevent adding if out of stock
        if (isVariantOutOfStock || isProductDisabled) {
            toast.error(isVariantOutOfStock ? 'This variant is out of stock' : 'This product is not available');
            return;
        }
        
        try {
            // Use the ID of the selected variant
            await addItem(selectedVariant.id, 1);
            setIsCartDrawerOpen(true);
            toast.success(`Added to cart: ${product.prod_name} - ${selectedVariant.variant_name || 'Default'}`);
        } catch (error: any) {
            toast.error(error.message || "Failed to add item to cart");
        }
    };

    const handleVariantChange = (e: React.MouseEvent, index: number) => {
        e.preventDefault();
        e.stopPropagation();
        setSelectedVariantIndex(index);
    };

    return (
        <Link href={`/product/${product.id}`} passHref>
            <div className="relative bg-white border border-gray-200 rounded-lg overflow-hidden shadow hover:shadow-md transition-all duration-200 flex flex-col h-full group">
                
                {/* Image Section - Full Width */}
                <div className="relative w-full pt-[100%] bg-gray-100">
                    {/* ... (Image and Discount Badge rendering remains unchanged) ... */}
                    {imageUrl ? (
                        <img 
                            src={imageUrl} 
                            alt={product.prod_name} 
                            className={`absolute inset-0 w-full h-full object-contain p-3 transition-transform duration-300 group-hover:scale-[1.05] ${
                                (isVariantOutOfStock || isProductDisabled) ? 'opacity-60' : ''
                            }`}
                        />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <FaBoxOpen className="w-12 h-12 text-gray-300" />
                        </div>
                    )}
                    
                    {/* Deal Badge */}
                    {discountPercent && (
                        <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                            {discountPercent}% OFF
                        </div>
                    )}
                    
                    {/* NEW: Wishlist Icon */}
                    <button
                        onClick={handleToggleWishlist}
                        className="absolute top-2 right-2 p-2 rounded-full bg-white/80 hover:bg-white text-red-500 shadow-md transition-colors z-10"
                        title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
                    >
                        <FaHeart className={`w-4 h-4 ${isWishlisted ? 'text-red-600' : 'text-gray-400 hover:text-red-500'}`} />
                    </button>
                    
                    {/* Stock Status Badge */}
                    {(isVariantOutOfStock || isProductDisabled) && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-10">
                            <span className="bg-red-600 text-white px-3 py-1.5 rounded-full text-xs font-semibold">
                                {isVariantOutOfStock ? 'OUT OF STOCK' : 'UNAVAILABLE'}
                            </span>
                        </div>
                    )}
                </div>
                
                {/* Content Section */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                    {/* ... (Brand, Title, Variant Selector, Pricing remains unchanged) ... */}
                    <div>
                        <p className="text-xs text-gray-500 line-clamp-1 mb-1">
                            {product.brand?.brand_name || 'Generic'}
                        </p>
                        <h3 className="text-sm font-semibold text-slate-800 line-clamp-2 min-h-[40px] mb-2">
                            {product.prod_name}
                        </h3>
                    </div>
                    
                    {product.has_variants === true && variants.length > 1 && (
                        <div className="flex flex-wrap gap-1.5 my-2" onClick={e => e.stopPropagation()}>
                            {variants.map((variant, index) => (
                                <button
                                    key={variant.id}
                                    type="button"
                                    onClick={(e) => handleVariantChange(e, index)}
                                    disabled={variant.quantity !== undefined && variant.quantity <= 0}
                                    className={`text-xs py-1 px-2 border rounded transition-all ${
                                        selectedVariantIndex === index
                                            ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold'
                                            : 'border-gray-300 bg-gray-50 text-gray-700 hover:border-gray-400'
                                    } ${
                                        variant.quantity !== undefined && variant.quantity <= 0
                                            ? 'opacity-40 cursor-not-allowed'
                                            : ''
                                    }`}
                                >
                                    {variant.variant_name || `AED ${(variant.price || 0).toFixed(0)}`}
                                </button>
                            ))}
                        </div>
                    )}
                    
                    <div className="mt-auto">
                        <div className="flex items-baseline">
                            <p className="text-base font-bold text-red-600">
                                AED {finalPrice.toFixed(2)}
                            </p>
                            {offerPrice && (
                                <p className="text-xs text-gray-500 line-through ml-2">
                                    AED {basePrice.toFixed(2)}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
                
                {/* Add to Cart Button */}
                <button 
                    onClick={handleAddToCart}
                    disabled={isVariantOutOfStock || isProductDisabled || cartLoading}
                    className={`w-full py-2.5 text-white font-medium text-center flex items-center justify-center transition-colors ${
                        isVariantOutOfStock || isProductDisabled || cartLoading
                            ? 'bg-gray-400 cursor-not-allowed' 
                            : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                >
                    {isVariantOutOfStock ? (
                        <>
                            <FaExclamationCircle className="mr-2" />
                            Out of Stock
                        </>
                    ) : isProductDisabled ? (
                        <>
                            <FaExclamationCircle className="mr-2" />
                            Unavailable
                        </>
                    ) : cartLoading ? (
                        <FaSpinner className="animate-spin" />
                    ) : (
                        <>
                            <FaShoppingCart className="mr-2" />
                            Add to Cart
                        </>
                    )}
                </button>
            </div>
        </Link>
    );
};

export default ProductCard;