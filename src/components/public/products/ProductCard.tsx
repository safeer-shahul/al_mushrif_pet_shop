// src/components/public/products/ProductCard.tsx
'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { FaBoxOpen, FaShoppingCart, FaSpinner } from 'react-icons/fa';
import { Product, ProdVariant } from '@/types/product';
import { useCategoryService } from '@/services/admin/categoryService';
import { useCart } from '@/context/CartContext';
import { toast } from 'react-hot-toast';

interface ProductCardProps {
    product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
    const { getStorageUrl } = useCategoryService();
    const { addItem, cartLoading, setIsCartDrawerOpen } = useCart();
    
    // --- Pricing and Variant Logic ---
    
    // Determine the base variant for display (either the first explicit variant or the implicit product)
    const displayVariant: ProdVariant | null = useMemo(() => {
        // If product has explicit variants, use the first one for the price display.
        if (product.variants && product.variants.length > 0) {
            // 💡 Ensure prices are parsed when accessing variants
            return {
                ...product.variants[0],
                price: parseFloat(String(product.variants[0].price)),
                offer_price: product.variants[0].offer_price !== null ? parseFloat(String(product.variants[0].offer_price)) : null,
            } as ProdVariant; 
        }
        // If it does NOT have variants, create the implicit variant from base fields
        if (product.base_price) {
             // 💡 Ensure base prices are parsed
             return {
                id: product.id, 
                prod_id: product.id,
                variant_name: "Default",
                price: parseFloat(String(product.base_price)),
                offer_price: product.base_offer_price !== null ? parseFloat(String(product.base_offer_price)) : null,
                color_value: null,
                images: product.images,
             } as ProdVariant; 
        }
        return null;
    }, [product]);

    if (!displayVariant) return null;

    const basePrice = displayVariant.price || 0;
    const offerPrice = displayVariant.offer_price;
    const finalPrice = offerPrice !== null ? offerPrice : basePrice; // Final price is always a number here
    
    // Determine Primary Image
    const primaryImage = product.images?.[0] || displayVariant.images?.[0];
    const imageUrl = getStorageUrl(primaryImage?.image_url || null);
    
    // --- Action Handlers ---
    const handleAddToCart = async (e: React.MouseEvent) => {
        e.preventDefault(); 
        e.stopPropagation();
        
        // Use the ID of the display variant (or base product ID if implicit)
        const variantId = displayVariant!.id; // Safely assume displayVariant exists here.

        try {
             // 1. Add the item to the cart
            await addItem(variantId, 1); 
            
            // 2. Open the Cart Drawer after success
            setIsCartDrawerOpen(true); 

            // 3. Optional: Show a brief success toast
            // toast.success(`${product.prod_name} added to cart!`);

        } catch (error) {
             // Handle cart addition error if necessary
             console.error("Failed to add to cart:", error);
             // toast.error("Failed to add item.");
        }
    };

    return (
        <Link href={`/product/${product.id}`} passHref>
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-200 cursor-pointer flex flex-col h-full group">
                
                {/* Image Section */}
                <div className="w-full h-48 bg-gray-100 flex items-center justify-center relative p-2">
                    {offerPrice && <span className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">DEAL</span>}
                    {imageUrl ? (
                        <img 
                            src={imageUrl} 
                            alt={product.prod_name} 
                            className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-[1.05]" 
                        />
                    ) : (
                        <FaBoxOpen className="w-8 h-8 text-gray-300" />
                    )}
                </div>
                
                {/* Details */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                        <p className="text-xs text-gray-500 line-clamp-1">{product.brand?.brand_name || 'Generic'}</p>
                        <h3 className="text-base font-semibold text-slate-800 line-clamp-2 min-h-12 mt-1">
                            {product.prod_name}
                        </h3>
                    </div>
                    
                    {/* Pricing */}
                    <div className="mt-2 flex items-center">
                        <p className="text-xl font-bold">
                            {/* 💡 FIX: finalPrice is now guaranteed to be a number/float */}
                            <span className="text-red-600">AED {finalPrice.toFixed(2)}</span> 
                        </p>
                        {offerPrice && (
                            <p className="text-sm text-gray-500 line-through ml-2">
                                AED {basePrice.toFixed(2)}
                            </p>
                        )}
                    </div>
                    
                    {/* Variant Slider */}
                    {product.variants && product.variants.length > 1 && (
                        <div className="flex space-x-2 overflow-x-auto py-2 whitespace-nowrap scrollbar-hide">
                            {product.variants.map((variant) => (
                                <span 
                                    key={variant.id} 
                                    className="text-xs px-2 py-1 border border-gray-300 rounded-full bg-gray-50 text-slate-700 flex-shrink-0"
                                >
                                    {variant.variant_name || `${parseFloat(String(variant.price)).toFixed(0)} AED`}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
                
                {/* Action Button */}
                <button 
                    onClick={handleAddToCart}
                    disabled={cartLoading}
                    className="w-full py-2 text-white font-medium text-center flex items-center justify-center transition-colors disabled:bg-gray-400"
                    style={{ backgroundColor: 'var(--color-primary)' }}
                >
                    <FaShoppingCart className="mr-2" />
                    {cartLoading ? <FaSpinner className="animate-spin" /> : 'Add to Cart'}
                </button>
            </div>
        </Link>
    );
}

export default ProductCard;