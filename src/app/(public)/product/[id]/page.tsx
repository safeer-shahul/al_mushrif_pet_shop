// src/app/(public)/product/[id]/page.tsx
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
    
    const finalPrice = selectedVariant?.offer_price || selectedVariant?.price || 0;
    const basePrice = selectedVariant?.price || 0;
    
    // 3. Identify Display Image
    const displayImage: ProductImage | undefined = useMemo(() => {
        if (!product || !selectedVariant) return undefined;
        
        // Use primary image from selected variant first, then any image, then base product image
        return selectedVariant.images?.find(img => img.is_primary) || 
               selectedVariant.images?.[0] || 
               product.images?.find(img => img.is_primary) ||
               product.images?.[0];
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
    
    if (loading) return <LoadingSpinner />;
    if (apiError || !product) return <div className="p-8 text-center text-red-600">{apiError || "Product not found."}</div>;

    const hasVariants = product.has_variants || (product.variants?.length ?? 0) > 1;

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
                         {selectedVariant?.offer_price && (
                            <span className="absolute top-4 left-4 bg-red-600 text-white text-lg font-bold px-3 py-1 rounded-lg">SALE</span>
                        )}
                    </div>
                    {/* Thumbnail gallery goes here */}
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
                        {selectedVariant?.offer_price && (
                            <p className="text-xl text-gray-500 line-through">
                                AED {basePrice.toFixed(2)}
                            </p>
                        )}
                    </div>

                    {/* Variant Selector (if true variants exist) */}
                    {hasVariants && (
                        <div className="space-y-2">
                            <h3 className="font-semibold text-slate-700 flex items-center"><FaTags className='mr-2' /> Options</h3>
                            <div className="flex flex-wrap gap-2">
                                {product.variants?.map(variant => (
                                    <button 
                                        key={variant.id}
                                        onClick={() => setSelectedVariantId(variant.id)}
                                        className={`px-4 py-2 border rounded-full text-sm transition-colors ${
                                            selectedVariantId === variant.id 
                                                ? 'bg-blue-600 text-white border-blue-600'
                                                : 'bg-white text-slate-700 hover:border-blue-300'
                                        }`}
                                    >
                                        {variant.variant_name || 'Default Option'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {/* Add to Cart & Quantity */}
                    <div className="flex space-x-4 pt-4 border-t border-gray-100">
                        <input
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                            min="1"
                            className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-lg text-center"
                        />
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
                            <FaCheckCircle className='mr-2 text-green-500' /> In Stock (Base Qty: {product.base_quantity || 'N/A'})
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