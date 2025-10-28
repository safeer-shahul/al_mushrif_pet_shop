// src/app/(public)/product/[id]/page.tsx - Fix for finalPrice error

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { FaShoppingCart, FaTags, FaBox, FaDollarSign, FaSpinner, FaCheckCircle, FaExchangeAlt, FaRegClock } from 'react-icons/fa';
import { usePublicProductService } from '@/services/public/productService';
import { useCart } from '@/context/CartContext';
import { Product, ProdVariant, ProductImage } from '@/types/product';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useCategoryService } from '@/services/admin/categoryService';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

const ProductDetailPage: React.FC = () => {
    const params = useParams();
    const productId = params.id as string;
    const { fetchProductDetail } = usePublicProductService();
    const { addItem, cartLoading } = useCart();
    const { getStorageUrl } = useCategoryService();

    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [apiError, setApiError] = useState<string | null>(null);
    const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>(undefined);
    const [quantity, setQuantity] = useState(1);
    const [isAddingToCart, setIsAddingToCart] = useState(false);

    // 1. Fetch Product Data
    const loadProduct = useCallback(async () => {
        if (!productId) return;
        setLoading(true);
        setApiError(null);
        try {
            const data = await fetchProductDetail(productId);
            setProduct(data);
            
            // Auto-select the first variant/implicit variant on load
            if (data.variants && data.variants.length > 0) {
                setSelectedVariantId(data.variants[0].id);
            }
        } catch (err: any) {
            setApiError(err.message || 'Failed to load product details.');
        } finally {
            setLoading(false);
        }
    }, [productId, fetchProductDetail]);

    useEffect(() => {
        loadProduct();
    }, [loadProduct]);

    // 2. Identify Selected Variant/Pricing
    const selectedVariant: ProdVariant | undefined = useMemo(() => {
        if (!product?.variants) return undefined;
        return product.variants.find(v => v.id === selectedVariantId);
    }, [product?.variants, selectedVariantId]);
    
    // FIX: Ensure finalPrice and basePrice are always numbers
    const finalPrice = useMemo(() => {
        if (selectedVariant?.offer_price !== null && selectedVariant?.offer_price !== undefined) {
            return parseFloat(String(selectedVariant.offer_price));
        }
        if (selectedVariant?.price !== null && selectedVariant?.price !== undefined) {
            return parseFloat(String(selectedVariant.price));
        }
        if (product?.base_offer_price !== null && product?.base_offer_price !== undefined) {
            return parseFloat(String(product.base_offer_price));
        }
        if (product?.base_price !== null && product?.base_price !== undefined) {
            return parseFloat(String(product.base_price));
        }
        return 0;
    }, [selectedVariant, product]);
    
    const basePrice = useMemo(() => {
        if (selectedVariant?.price !== null && selectedVariant?.price !== undefined) {
            return parseFloat(String(selectedVariant.price));
        }
        if (product?.base_price !== null && product?.base_price !== undefined) {
            return parseFloat(String(product.base_price));
        }
        return 0;
    }, [selectedVariant, product]);
    
    // 3. Identify Display Image
    const displayImage: ProductImage | undefined = useMemo(() => {
        if (!product) return undefined;
        
        // Use primary image from selected variant first, if available
        if (selectedVariant?.images?.length) {
            const primaryImage = selectedVariant.images.find(img => img.is_primary);
            if (primaryImage) return primaryImage;
            return selectedVariant.images[0];
        }
        
        // Fall back to base product images
        if (product.images?.length) {
            const primaryImage = product.images.find(img => img.is_primary);
            if (primaryImage) return primaryImage;
            return product.images[0];
        }
        
        return undefined;
    }, [product, selectedVariant]);
    
    // 4. Add to Cart Handler
    const handleAddToCart = async () => {
        if (!selectedVariantId) {
            toast.error("Please select a valid option.");
            return;
        }
        setIsAddingToCart(true);
        try {
            await addItem(selectedVariantId, quantity);
            toast.success(`Added ${quantity}x ${product?.prod_name} to cart!`);
        } catch (error: any) {
            toast.error(error.message || "Failed to add to cart.");
        } finally {
            setIsAddingToCart(false);
        }
    };
    
    // Calculate discount percentage
    const discountPercentage = useMemo(() => {
        if (basePrice > 0 && finalPrice < basePrice) {
            return Math.round(((basePrice - finalPrice) / basePrice) * 100);
        }
        return null;
    }, [basePrice, finalPrice]);
    
    if (loading) return <LoadingSpinner />;
    if (apiError || !product) return <div className="p-8 text-center text-red-600">{apiError || "Product not found."}</div>;

    const hasVariants = product.has_variants === true || (product.variants?.length ?? 0) > 1;

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 bg-white p-6 rounded-xl shadow-lg">
                
                {/* Image Gallery */}
                <div className="space-y-4">
                    <div className="w-full h-96 bg-gray-100 flex items-center justify-center rounded-lg relative border border-gray-200">
                        {displayImage?.image_url ? (
                            <img 
                                src={getStorageUrl(displayImage.image_url) || ''} 
                                alt={product.prod_name} 
                                className="max-w-full max-h-full object-contain p-4" 
                            />
                        ) : (
                            <FaBox className="w-12 h-12 text-gray-300" />
                        )}
                        {discountPercentage && (
                            <span className="absolute top-4 left-4 bg-red-600 text-white text-lg font-bold px-3 py-1 rounded-lg">
                                {discountPercentage}% OFF
                            </span>
                        )}
                    </div>
                    
                    {/* Thumbnail gallery - small image previews */}
                    {((selectedVariant?.images?.length ?? 0) > 1 || (product.images?.length ?? 0) > 1) && (
                        <div className="flex overflow-x-auto space-x-2 p-2">
                            {(selectedVariant?.images?.length ? selectedVariant.images : product.images || []).map((img, idx) => (
                                <div 
                                    key={img.id || idx} 
                                    className="w-20 h-20 flex-shrink-0 border border-gray-200 rounded cursor-pointer overflow-hidden"
                                >
                                    <img 
                                        src={getStorageUrl(img.image_url) || ''} 
                                        alt={`${product.prod_name} - view ${idx+1}`}
                                        className="w-full h-full object-cover" 
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Product Details */}
                <div className="space-y-6">
                    <h1 className="text-3xl font-bold text-slate-800">{product.prod_name}</h1>
                    <Link href={`/brands?id=${product.brand_id}`} className="text-lg text-gray-600 hover:text-blue-600 transition-colors block">
                        {product.brand?.brand_name || 'Generic Brand'}
                    </Link>

                    {/* Price Section */}
                    <div className="flex items-baseline space-x-3 pt-4 border-t border-gray-100">
                        <p className="text-4xl font-extrabold" style={{ color: 'var(--color-primary)' }}>
                            AED {finalPrice.toFixed(2)}
                        </p>
                        {finalPrice < basePrice && (
                            <p className="text-xl text-gray-500 line-through">
                                AED {basePrice.toFixed(2)}
                            </p>
                        )}
                    </div>

                    {/* Variant Selector */}
                    {hasVariants && product.variants && product.variants.length > 0 && (
                        <div className="space-y-2">
                            <h3 className="font-semibold text-slate-700 flex items-center">
                                <FaTags className='mr-2' /> Options
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {product.variants.map(variant => (
                                    <button 
                                        key={variant.id}
                                        onClick={() => setSelectedVariantId(variant.id)}
                                        className={`px-4 py-2 border rounded-full text-sm transition-colors ${
                                            selectedVariantId === variant.id 
                                                ? 'bg-blue-600 text-white border-blue-600'
                                                : 'bg-white text-slate-700 hover:border-blue-300'
                                        }`}
                                    >
                                        {variant.variant_name || `Option ${variant.price}`}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {/* Add to Cart & Quantity */}
                    <div className="flex space-x-4 pt-4 border-t border-gray-100">
                        <div className="flex border border-gray-300 rounded-lg">
                            <button 
                                className="px-3 py-2 text-gray-700 hover:bg-gray-100"
                                onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                            >
                                -
                            </button>
                            <input
                                type="number"
                                value={quantity}
                                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                min="1"
                                className="w-16 px-3 py-2 border-x border-gray-300 text-center"
                            />
                            <button 
                                className="px-3 py-2 text-gray-700 hover:bg-gray-100"
                                onClick={() => setQuantity(prev => prev + 1)}
                            >
                                +
                            </button>
                        </div>
                        <button
                            onClick={handleAddToCart}
                            disabled={isAddingToCart || cartLoading || !selectedVariantId}
                            className="flex-1 py-3 text-white font-semibold rounded-lg flex items-center justify-center transition-colors disabled:bg-gray-400"
                            style={{ backgroundColor: 'var(--color-primary)' }}
                        >
                            {isAddingToCart ? (
                                <FaSpinner className='animate-spin mr-2' />
                            ) : (
                                <FaShoppingCart className='mr-2' />
                            )}
                            {isAddingToCart ? 'Adding...' : 'Add to Cart'}
                        </button>
                    </div>
                    
                    {/* Policies */}
                    <div className="pt-4 space-y-2 text-sm text-gray-600">
                        <p className="flex items-center">
                            <FaCheckCircle className='mr-2 text-green-500' /> 
                            {selectedVariant?.quantity !== undefined && selectedVariant?.quantity !== null ? 
                                `In Stock (${selectedVariant.quantity} available)` : 
                                `In Stock ${product.base_quantity !== null && product.base_quantity !== undefined ? 
                                    `(Base Qty: ${product.base_quantity})` : ''}`
                            }
                        </p>
                        <p className="flex items-center">
                            <FaRegClock className='mr-2 text-blue-500' /> Delivery in 2-3 Days across UAE.
                        </p>
                        {product.can_return && (
                            <p className="flex items-center">
                                <FaExchangeAlt className='mr-2 text-purple-500' /> Returns & Exchanges Allowed
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetailPage;