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
import { useModal } from '@/context/ModalContext';

interface ProductCardProps {
    product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
    const { getStorageUrl } = useCategoryService();
    const { addItem, cartLoading, setIsCartDrawerOpen } = useCart();
    const { isAuthenticated } = useAuth();
    const { openLoginModal } = useModal();
    const { addToWishlist, removeFromWishlist, checkWishlistStatus } = useWishlistService();
    const router = useRouter();

    const [wishlistItem, setWishlistItem] = useState<any | null>(null);
    const [isHovered, setIsHovered] = useState(false);
    const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
    const isWishlisted = !!wishlistItem;

    // Check stock status
    const isOutOfStock = useMemo(() => {
        if (product.variants && product.variants.length > 0) {
            return product.variants.every(v =>
                v.quantity !== undefined && v.quantity !== null && v.quantity <= 0
            );
        }
        return product.base_quantity !== undefined && product.base_quantity !== null && product.base_quantity <= 0;
    }, [product]);

    const isProductDisabled = useMemo(() => product.is_disabled === true, [product]);

    // Normalize variants
    const variants = useMemo(() => {
        if (product.variants && product.variants.length > 0) {
            return product.variants.map(variant => ({
                ...variant,
                price: parseFloat(String(variant.price || 0)),
                offer_price: variant.offer_price !== null && variant.offer_price !== undefined
                    ? parseFloat(String(variant.offer_price))
                    : null,
            }));
        }

        if (product.base_price !== undefined && product.base_price !== null) {
            return [{
                id: product.id,
                prod_id: product.id,
                variant_name: "Default",
                price: parseFloat(String(product.base_price || 0)),
                offer_price: product.base_offer_price !== null && product.base_offer_price !== undefined
                    ? parseFloat(String(product.base_offer_price))
                    : null,
                color_value: null,
                quantity: product.base_quantity,
                images: product.images,
            } as ProdVariant];
        }

        return [];
    }, [product]);

    const selectedVariant = useMemo(() => {
        if (variants.length === 0) return null;
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

    // ✅ FIXED IMAGE LOGIC — Handles variant and fallback images
    const variantImages = useMemo(() => {
        console.log('Product:', product.prod_name);
        console.log('Product images:', product.images);
        console.log('Selected variant:', selectedVariant);
        console.log('All variants:', product.variants);

        // First, try to get images from the selected variant
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

        console.log('Selected variant images after parsing:', images);

        // If selected variant has no images, try to find images from ANY variant
        if (images.length === 0 && product.variants && product.variants.length > 0) {
            for (const variant of product.variants) {
                let variantImages = variant.images || [];

                if (typeof variantImages === 'string') {
                    try {
                        variantImages = JSON.parse(variantImages);
                    } catch (e) {
                        continue;
                    }
                }

                if (Array.isArray(variantImages) && variantImages.length > 0) {
                    console.log('Found images in variant:', variant.variant_name, variantImages);
                    images = variantImages;
                    break;
                }
            }
        }

        // If still no images, fallback to product-level images
        if (images.length === 0 && product.images && product.images.length > 0) {
            console.log('Using product-level images:', product.images);
            return product.images;
        }

        console.log('Final images:', images);
        return images;
    }, [product.images, product.variants, selectedVariant]);

    const primaryImage = variantImages.find(img => img.is_primary) || variantImages[0];
    const secondaryImage = variantImages[1] || primaryImage;
    const displayImage = isHovered && variantImages.length > 1 ? secondaryImage : primaryImage;
    const imageUrl = getStorageUrl(displayImage?.image_url || null);

    // Wishlist check
    useEffect(() => {
        const checkStatus = async () => {
            if (isAuthenticated && selectedVariant) {
                try {
                    const item = await checkWishlistStatus(selectedVariant.id);
                    setWishlistItem(item);
                } catch {
                    setWishlistItem(null);
                }
            } else {
                setWishlistItem(null);
            }
        };
        checkStatus();
    }, [isAuthenticated, selectedVariant, checkWishlistStatus]);

    // Wishlist toggle
    const handleToggleWishlist = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!isAuthenticated) {
            openLoginModal();
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

    // Add to cart
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

    // Variant switch
    const handleVariantChange = (e: React.MouseEvent, index: number) => {
        e.preventDefault();
        e.stopPropagation();
        setSelectedVariantIndex(index);
    };

    return (
        <Link href={`/product/${product.id}`} passHref>
            <div
                className="relative bg-white rounded-lg min-h-86 md:min-h-112 overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300 flex flex-col h-full group"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {/* Image Section */}
                <div className="relative w-full pt-[100%] bg-gray-50 overflow-hidden">
                    {imageUrl ? (
                        <img
                            src={imageUrl}
                            alt={product.prod_name}
                            className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 ${(isVariantOutOfStock || isProductDisabled) ? 'opacity-60' : ''} ${isHovered ? 'scale-105' : 'scale-100'}`}
                        />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                            <FaBoxOpen className="w-16 h-16 text-gray-300" />
                        </div>
                    )}

                    {discountPercent && (
                        <div className="absolute top-3 left-3 bg-[#FF0000] text-white text-xs font-bold px-3 py-1.5 rounded">
                            {discountPercent}% Off
                        </div>
                    )}

                    {/* Wishlist */}
                    <button
                        onClick={handleToggleWishlist}
                        className="absolute top-3 right-3 p-2 rounded-full bg-white shadow-md hover:scale-110 transition-transform z-10"
                        title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
                    >
                        <FaHeart className={`w-4 h-4 transition-colors ${isWishlisted ? 'text-red-500 fill-current' : 'text-gray-400'}`} />
                    </button>

                    {(isVariantOutOfStock || isProductDisabled) && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                            <span className="bg-red-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
                                {isVariantOutOfStock ? 'OUT OF STOCK' : 'UNAVAILABLE'}
                            </span>
                        </div>
                    )}
                </div>

                {/* Product Info */}
                <div className="py-1 px-3 flex-1 flex flex-col justify-start">
                    <div className="flex items-baseline gap-2">
                        <span className="text-sm md:text-lg font-bold text-gray-900">
                            AED {finalPrice.toFixed(2)}
                        </span>
                        {offerPrice !== null && (
                            <span className="text-xs md:text-sm text-gray-400 line-through">
                                AED {basePrice.toFixed(2)}
                            </span>
                        )}
                    </div>

                    <h3 className="text-sm font-semibold text-gray-800 mb-2 line-clamp-2 flex-shrink-0 min-h-12">
                        {product.prod_name}
                    </h3>

                    {/* Variant Selector */}
                    {product.has_variants && variants.length > 1 && (
                        <div className="mb-3 flex gap-2 overflow-x-auto pb-1" style={{ WebkitOverflowScrolling: 'touch' }}>
                            {variants.map((variant, index) => {
                                const isOutOfStock = typeof variant.quantity === 'number' && variant.quantity <= 0;
                                const percentOff = variant.offer_price !== null && variant.price > 0
                                    ? Math.round(((variant.price - variant.offer_price) / variant.price) * 100)
                                    : null;

                                return (
                                    <button
                                        key={variant.id}
                                        type="button"
                                        onClick={(e) => handleVariantChange(e, index)}
                                        disabled={isOutOfStock}
                                        className={`relative overflow-hidden rounded-md flex-shrink-0 transition-all ${isOutOfStock ? 'opacity-40 cursor-not-allowed' : ''}`}
                                    >
                                        <div className={`px-3 py-1.5 text-xs font-semibold transition-colors ${selectedVariantIndex === index
                                            ? 'bg-black text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}>
                                            {variant.variant_name || 'Default'}
                                        </div>
                                        {percentOff && (
                                            <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-1 rounded-bl-md leading-none">
                                                {percentOff}%
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Add to Cart */}
                <button
                    onClick={handleAddToCart}
                    disabled={isVariantOutOfStock || isProductDisabled || cartLoading}
                    className={`w-full py-3 text-white font-semibold text-sm flex items-center justify-center transition-all flex-shrink-0 ${isVariantOutOfStock || isProductDisabled || cartLoading
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-[var(--color-primary,#003a8c)] hover:bg-[var(--color-primary,#003a8c)]/90'
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
