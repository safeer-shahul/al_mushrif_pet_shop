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
    // ... (All existing hooks, state, and memoized values remain the same) ...
    const { getStorageUrl } = useCategoryService();
    const { addItem, cartLoading, setIsCartDrawerOpen } = useCart();
    const { isAuthenticated, user } = useAuth();
    const { addToWishlist, removeFromWishlist, checkWishlistStatus } = useWishlistService();
    const router = useRouter();

    const [wishlistItem, setWishlistItem] = useState<any | null>(null);
    const [isHovered, setIsHovered] = useState(false);
    const isWishlisted = !!wishlistItem;
    
    const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
    
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
    
    const variants = useMemo(() => {
        if (product.variants && product.variants.length > 0) {
            return product.variants.map(variant => ({
                ...variant,
                price: parseFloat(String(variant.price || 0)),
                offer_price: variant.offer_price !== null && variant.offer_price !== undefined ? 
                    parseFloat(String(variant.offer_price)) : null,
            }));
        }
        
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
    
    const selectedVariant = useMemo(() => {
        if (variants.length === 0) return null;
        // Ensure selectedVariantIndex is valid, fallback to 0
        const index = variants[selectedVariantIndex] ? selectedVariantIndex : 0;
        return variants[index] || variants[0];
    }, [variants, selectedVariantIndex]);
    
    if (!selectedVariant) return null;
    
    const basePrice = selectedVariant.price || 0;
    const offerPrice = selectedVariant.offer_price;
    const finalPrice = offerPrice !== null ? offerPrice : basePrice;
    
    const discountPercent = useMemo(() => {
        if (offerPrice !== null && basePrice > 0) {
            return Math.round(((basePrice - offerPrice) / basePrice) * 100);
        }
        return null;
    }, [basePrice, offerPrice]);
    
    const isVariantOutOfStock = selectedVariant.quantity !== undefined && 
                               selectedVariant.quantity !== null &&
                               selectedVariant.quantity <= 0;
    
    const variantImages = useMemo(() => {
        let images: any[] = selectedVariant?.images || [];
        
        if (typeof images === 'string') {
            try {
                images = JSON.parse(images);
            } catch (e) {
                images = [];
            }
        }
        
        if (!Array.isArray(images)) {
            images = [];
        }
        
        if (images.length > 0) {
            return images;
        }
        
        if (product.images && product.images.length > 0) {
            return product.images;
        }
        
        return [];
    }, [product.images, selectedVariant]);
    
    const primaryImage = variantImages.find(img => img.is_primary) || variantImages[0];
    const secondaryImage = variantImages[1] || primaryImage;
    
    const displayImage = isHovered && variantImages.length > 1 ? secondaryImage : primaryImage;
    const imageUrl = getStorageUrl(displayImage?.image_url || null);
    
    useEffect(() => {
        const checkStatus = async () => {
            if (isAuthenticated && selectedVariant) {
                try {
                    const item = await checkWishlistStatus(selectedVariant.id);
                    setWishlistItem(item);
                } catch (err) {
                    setWishlistItem(null);
                }
            } else {
                setWishlistItem(null);
            }
        };
        checkStatus();
    }, [isAuthenticated, selectedVariant, checkWishlistStatus]);
    
    const handleToggleWishlist = async (e: React.MouseEvent) => {
        e.preventDefault(); 
        e.stopPropagation();
        
        if (!isAuthenticated) {
            toast.error("Please log in to manage your wishlist.");
            return;
        }
        
        const variantId = selectedVariant.id;

        try {
            if (isWishlisted && wishlistItem) {
                await removeFromWishlist(wishlistItem.id); 
                setWishlistItem(null);
                toast.success(`Removed from wishlist.`);
            } else {
                const newItem = await addToWishlist(variantId);
                setWishlistItem(newItem);
                toast.success(`Added to wishlist!`);
            }
        } catch (error: any) {
             toast.error(error.message || "Failed to update wishlist.");
        }
    };

    const handleAddToCart = async (e: React.MouseEvent) => {
        e.preventDefault(); 
        e.stopPropagation();
        
        if (!selectedVariant) {
            toast.error('Please select a variant');
            return;
        }
        
        if (isVariantOutOfStock || isProductDisabled) {
            toast.error(isVariantOutOfStock ? 'This variant is out of stock' : 'This product is not available');
            return;
        }
        
        try {
            await addItem(selectedVariant.id, 1);
            setIsCartDrawerOpen(true);
            toast.success(`Added to cart!`);
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
            <div 
                className="relative bg-white rounded-lg min-h-90 md:min-h-112 overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300 flex flex-col h-full group"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                
                {/* Image Section - Fixed Aspect Ratio */}
                <div className="relative w-full pt-[100%] bg-gray-50 overflow-hidden">
                    {/* ... (Image and badges code unchanged) ... */}
                    {imageUrl ? (
                        <img 
                            src={imageUrl} 
                            alt={product.prod_name} 
                            className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 ${
                                (isVariantOutOfStock || isProductDisabled) ? 'opacity-60' : ''
                            } ${isHovered ? 'scale-105' : 'scale-100'}`}
                        />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                            <FaBoxOpen className="w-16 h-16 text-gray-300" />
                        </div>
                    )}
                    
                    {/* Sale Badge */}
                    {discountPercent && (
                        <div className="absolute top-3 left-3 bg-[#FF0000] text-white text-xs font-bold px-3 py-1.5 rounded">
                            {discountPercent}% Off
                        </div>
                    )}
                    
                    {/* Wishlist Icon */}
                    <button
                        onClick={handleToggleWishlist}
                        className="absolute top-3 right-3 p-2 rounded-full bg-white shadow-md hover:scale-110 transition-transform z-10"
                        title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
                    >
                        <FaHeart className={`w-4 h-4 transition-colors ${isWishlisted ? 'text-red-500 fill-current' : 'text-gray-400'}`} />
                    </button>
                    
                    {/* Stock Status Badge */}
                    {(isVariantOutOfStock || isProductDisabled) && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40">
                            <span className="bg-red-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
                                {isVariantOutOfStock ? 'OUT OF STOCK' : 'UNAVAILABLE'}
                            </span>
                        </div>
                    )}
                </div>
                
                {/* Content Section - Use flex-1 to occupy all available vertical space */}
                <div className="py-1 px-3 flex-1 flex flex-col justify-start"> {/* Use justify-end to anchor content to the bottom */}
                    
                    {/* Price with Discount Badge (Consistent height for prices and discount badge area) */}
                    <div className="flex-shrink-0"> 
                        <div className="flex items-baseline gap-2">
                            <span className="text-sm md:text-xl font-bold text-gray-900">
                                AED {finalPrice.toFixed(2)}
                            </span>
                            {offerPrice !== null && (
                                <span className="text-xs md:text-sm text-gray-400 line-through">
                                    AED {basePrice.toFixed(2)}
                                </span>
                            )}
                        </div>
                    </div>
                    
                    {/* Product Title - Fixed height area for 2 lines of text (approx 48px) */}
                    <h3 className="text-base font-semibold text-gray-800 mb-1 line-clamp-2 flex-shrink-0 h-12"> 
                         {/* Added h-12 for fixed height to prevent content jumping */}
                        {product.prod_name}
                    </h3>
                    
                    {/* Variant Selector - Scrollable Container for Mobile/Many Variants */}
                    <div 
                        className={`mb-3 flex-shrink-0`} 
                        onClick={e => e.stopPropagation()}
                    >
                        {product.has_variants === true && variants.length > 1 && (
                            <div 
                                className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide" 
                                style={{ WebkitOverflowScrolling: 'touch' }} // iOS smooth scrolling
                            >
                                {variants.map((variant, index) => {
                                    const isOutOfStock = variant.quantity !== undefined && variant.quantity <= 0;
                                    const percentOff = variant.offer_price !== null && variant.price > 0
                                        ? Math.round(((variant.price - variant.offer_price) / variant.price) * 100)
                                        : null;
                                    
                                    return (
                                        <button
                                            key={variant.id}
                                            type="button"
                                            onClick={(e) => handleVariantChange(e, index)}
                                            disabled={isOutOfStock}
                                            className={`relative overflow-hidden rounded-md flex-shrink-0 transition-all ${
                                                isOutOfStock ? 'opacity-40 cursor-not-allowed' : ''
                                            }`}
                                        >
                                            <div className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
                                                selectedVariantIndex === index
                                                    ? 'bg-black text-white'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}>
                                                {variant.variant_name || 'Default'}
                                            </div>
                                            {percentOff && (
                                                <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-1 rounded-bl-md leading-none">
                                                    {percentOff}%
                                                </div>
                                                // Removed the green-100 badge from the original code for a cleaner look
                                            )}
                                            {isOutOfStock && (
                                                <div className="absolute inset-0 bg-gray-500 opacity-20"></div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                    
                </div>
                
                {/* Add to Cart Button - Fixed Height at the very bottom */}
                <button 
                    onClick={handleAddToCart}
                    disabled={isVariantOutOfStock || isProductDisabled || cartLoading}
                    className={`w-full py-3 text-white font-semibold text-sm flex items-center justify-center transition-all flex-shrink-0 ${
                        isVariantOutOfStock || isProductDisabled || cartLoading
                            ? 'bg-gray-400 cursor-not-allowed' 
                            : 'bg-[var(--color-primary,#FF6B35)] hover:bg-[var(--color-primary,#FF6B35)]/90'
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