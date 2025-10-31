'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
// ✨ NEW: FaListAlt icon added for the description section
import { FaShoppingCart, FaTags, FaBox, FaSpinner, FaCheckCircle, FaExchangeAlt, FaRegClock, FaPaw, FaHeart, FaListAlt } from 'react-icons/fa'; 
import { usePublicProductService } from '@/services/public/productService';
import { useCart } from '@/context/CartContext';
import { Product, ProdVariant, ProductImage } from '@/types/product'; 
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useCategoryService } from '@/services/admin/categoryService';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { useWishlistService } from '@/services/public/wishlistService'; 
import { useAuth } from '@/context/AuthContext'; 

// Define the primary color variable for easy styling consistency
const PRIMARY_COLOR = 'var(--color-primary, #FF6B35)';

const ProductDetailPage: React.FC = () => {
    const params = useParams();
    const productId = params.id as string;
    
    // Services & Context
    const { fetchProductDetail } = usePublicProductService();
    const { addItem, cartLoading, setIsCartDrawerOpen } = useCart();
    const { getStorageUrl } = useCategoryService();
    const { isAuthenticated } = useAuth();
    const { addToWishlist, removeFromWishlist, checkWishlistStatus } = useWishlistService();

    // State Management
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [apiError, setApiError] = useState<string | null>(null);
    const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>(undefined);
    const [currentImage, setCurrentImage] = useState<ProductImage | undefined>(undefined); 
    const [quantity, setQuantity] = useState(1);
    const [isAddingToCart, setIsAddingToCart] = useState(false);
    const [wishlistItem, setWishlistItem] = useState<any | null>(null); 
    const [isWishlistUpdating, setIsWishlistUpdating] = useState(false); 

    const findBestImage = (images: ProductImage[] | undefined): ProductImage | undefined => {
        if (!images || images.length === 0) return undefined;
        const primary = images.find(img => img.is_primary);
        return primary || images[0];
    };
    
    // 1. Fetch Product Data
    const loadProduct = useCallback(async () => {
        if (!productId) return;
        setLoading(true);
        setApiError(null);
        try {
            const data = await fetchProductDetail(productId);
            setProduct(data);
            
            if (data.variants && data.variants.length > 0) {
                const defaultVariant = data.variants[0];
                setSelectedVariantId(defaultVariant.id);
                const initialImage = findBestImage(defaultVariant.images) || findBestImage(data.images);
                setCurrentImage(initialImage);
            } else {
                // If no variants, implicitly select the product itself for cart ops
                setSelectedVariantId(data.id); 
                setCurrentImage(findBestImage(data.images));
            }
        } catch (err: any) {
            setApiError(err.message || 'Failed to load product details.');
        } finally {
            setLoading(false);
        }
    }, [productId, fetchProductDetail]);

    // 2. Fetch Wishlist Status
    const checkWishlist = useCallback(async (variantId: string | undefined) => {
          if (!isAuthenticated || !variantId) {
              setWishlistItem(null);
              return;
          }
          try {
              const item = await checkWishlistStatus(variantId);
              setWishlistItem(item);
          } catch (e) {
              setWishlistItem(null);
          }
    }, [isAuthenticated, checkWishlistStatus]);

    useEffect(() => {
        loadProduct();
    }, [loadProduct]);
    
    // Check wishlist status whenever selectedVariantId changes
    useEffect(() => {
          checkWishlist(selectedVariantId);
    }, [selectedVariantId, checkWishlist]);


    // 3. Identify Selected Variant/Pricing & Update Image
    const selectedVariant: ProdVariant | undefined = useMemo(() => {
        if (!product?.variants) return undefined;
        return product.variants.find(v => v.id === selectedVariantId);
    }, [product?.variants, selectedVariantId]);
    
    // Effect to update image when the selected variant changes
    useEffect(() => {
        if (selectedVariant) {
            const bestImage = findBestImage(selectedVariant.images) || findBestImage(product?.images);
            setCurrentImage(bestImage);
        } else if (product) {
              setCurrentImage(findBestImage(product.images));
        }
    }, [selectedVariant, product?.images, product]);
    
    
    // --- TYPE-SAFE PRICE CALCULATION ---
    const finalPrice = useMemo(() => {
        let priceValue: number | null | undefined;
        
        if (selectedVariant) {
            priceValue = selectedVariant.offer_price;
            if (priceValue === null || priceValue === undefined) {
                priceValue = selectedVariant.price;
            }
        } 
        if (priceValue === null || priceValue === undefined) {
            priceValue = product?.base_offer_price;
        }
        if (priceValue === null || priceValue === undefined) {
            priceValue = product?.base_price;
        }
        return parseFloat(String(priceValue || 0));
    }, [selectedVariant, product]);
    
    const basePrice = useMemo(() => {
        let priceValue: number | null | undefined;
        if (selectedVariant) {
              priceValue = selectedVariant.price;
        }
        if (priceValue === null || priceValue === undefined) {
              priceValue = product?.base_price;
        }
        return parseFloat(String(priceValue || 0));
    }, [selectedVariant, product]);
    // --- END TYPE-SAFE PRICE CALCULATION ---
    
    // 4. Handle Add to Cart
    const handleAddToCart = async () => {
        const variantId = selectedVariantId || product?.id;
        if (!variantId || finalPrice <= 0) {
            toast.error("Please select a valid option.");
            return;
        }

        setIsAddingToCart(true);
        try {
            await addItem(variantId, quantity);
            toast.success(`Added ${quantity}x ${product?.prod_name} to cart!`);
            setIsCartDrawerOpen(true); 
        } catch (error: any) {
            toast.error(error.message || "Failed to add to cart. Check stock.");
        } finally {
            setIsAddingToCart(false);
        }
    };

    // 5. Handle Wishlist Toggle
    const handleToggleWishlist = async () => {
        if (!isAuthenticated) {
            toast.error("Please log in to manage your wishlist.");
            return;
        }
        const variantId = selectedVariantId;
        if (!variantId) {
              toast.error("Please select a product option first.");
              return;
        }

        setIsWishlistUpdating(true);
        try {
            if (wishlistItem) {
                await removeFromWishlist(wishlistItem.id);
                setWishlistItem(null);
                toast.success("Removed from wishlist.");
            } else {
                const newItem = await addToWishlist(variantId);
                setWishlistItem(newItem);
                toast.success("Added to wishlist!");
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to update wishlist.");
        } finally {
            setIsWishlistUpdating(false);
        }
    };
    
    const discountPercentage = useMemo(() => {
        if (basePrice > 0 && finalPrice < basePrice) {
            return Math.round(((basePrice - finalPrice) / basePrice) * 100);
        }
        return null;
    }, [basePrice, finalPrice]);

    const galleryImages: ProductImage[] = useMemo(() => {
        const imagesMap = new Map<string, ProductImage>();
        const addImages = (imgs: ProductImage[] | undefined) => {
            if (imgs) {
                imgs.forEach(img => {
                    if (img.image_url) imagesMap.set(img.image_url, img);
                });
            }
        };
        addImages(selectedVariant?.images);
        addImages(product?.images);
        return Array.from(imagesMap.values());
    }, [selectedVariant?.images, product?.images, product]);
    
    if (loading) return <LoadingSpinner />;
    if (apiError || !product) return <div className="p-8 text-center text-red-600">{apiError || "Product not found."}</div>;

    const hasVariants = product.has_variants === true || (product.variants?.length ?? 0) > 1;

    return (
        <div className="container mx-auto px-4 py-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-white p-6 rounded-xl shadow-2xl border border-gray-100">
                
                {/* ⬅️ COLUMN 1: Image Gallery & Thumbnails */}
                <div className="flex flex-col md:flex-row gap-4"> 
                    {/* Main Image */}
                    <div className="w-full md:w-[calc(100%-80px)] h-96 relative flex-shrink-0 bg-gray-50 flex items-center justify-center rounded-lg border border-gray-200 shadow-lg overflow-hidden">
                        {currentImage?.image_url ? (
                            <img 
                                src={getStorageUrl(currentImage.image_url) || ''} 
                                alt={product.prod_name} 
                                className="absolute inset-0 w-full h-full object-contain p-4 transition-transform duration-300" 
                            />
                        ) : (
                            <FaBox className="w-12 h-12 text-gray-300 absolute" />
                        )}
                        {discountPercentage && (
                            <span className="absolute top-3 left-3 bg-red-600 text-white text-md font-bold px-3 py-1 rounded-full shadow-lg z-10">
                                {discountPercentage}% OFF
                            </span>
                        )}
                           <button 
                            onClick={handleToggleWishlist}
                            disabled={isWishlistUpdating || !selectedVariantId}
                            className="absolute top-3 right-3 p-2 rounded-full bg-white shadow-xl hover:scale-110 transition-transform z-10 disabled:opacity-50"
                        >
                            {isWishlistUpdating ? (
                                <FaSpinner className='w-4 h-4 animate-spin text-gray-400' />
                            ) : (
                                <FaHeart 
                                    className={`w-4 h-4 transition-colors ${
                                        wishlistItem ? 'text-red-500 fill-current' : 'text-gray-400 hover:text-red-500'
                                    }`} 
                                />
                            )}
                        </button>
                    </div>
                    
                    {/* Vertical Thumbnail gallery */}
                    {galleryImages.length > 1 && (
                        <div className="flex flex-row md:flex-col overflow-x-auto md:overflow-y-auto space-x-2 md:space-x-0 md:space-y-2 p-1 border-t md:border-t-0 md:border-l border-gray-100 flex-shrink-0">
                            {galleryImages.map((img, idx) => (
                                <div 
                                    key={img.id || idx} 
                                    onClick={() => setCurrentImage(img)} 
                                    className={`w-16 h-16 flex-shrink-0 border-2 rounded-md cursor-pointer overflow-hidden transition-colors shadow-sm ${
                                        currentImage?.image_url === img.image_url 
                                            ? `border-[${PRIMARY_COLOR}] shadow-md` 
                                            : 'border-gray-200 hover:border-gray-400'
                                    }`}
                                    style={{ 
                                        borderColor: currentImage?.image_url === img.image_url ? PRIMARY_COLOR : '#d1d5db',
                                    }}
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

                {/* ➡️ COLUMN 2: Details & Purchase */}
                <div className="space-y-5">
                    <div className='space-y-1'>
                        <h1 className="text-3xl font-extrabold text-slate-900">{product.prod_name}</h1>
                        <Link href={`/brands?id=${product.brand_id}`} className="text-base font-semibold text-gray-700 hover:text-gray-900 transition-colors flex items-center">
                            <FaPaw className='mr-2 w-4 h-4 text-gray-500' /> {product.brand?.brand_name || 'Generic Brand'}
                        </Link>
                           <Link href={`/products?category_id=${product.category?.id}`} className="text-sm text-blue-600 hover:text-blue-800 transition-colors block">
                            Category: {product.category?.sub_cat_name || 'Uncategorized'}
                        </Link>
                    </div>

                    {/* Price Section - Branded and Standard Size */}
                    <div className="flex items-baseline space-x-3 pb-3 border-b border-gray-200">
                        <p className="text-3xl font-extrabold" style={{ color: PRIMARY_COLOR }}>
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
                        <div className="space-y-3">
                            <h3 className="font-bold text-base text-slate-800 flex items-center">
                                <FaTags className='mr-2 w-4 h-4 text-gray-500' /> Choose Option:
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {product.variants.map(variant => (
                                    <button 
                                        key={variant.id}
                                        onClick={() => setSelectedVariantId(variant.id)}
                                        className={`px-4 py-2 border-2 rounded-lg text-sm font-semibold transition-all shadow-sm`}
                                        style={{ 
                                            backgroundColor: selectedVariantId === variant.id ? PRIMARY_COLOR : 'white',
                                            borderColor: selectedVariantId === variant.id ? PRIMARY_COLOR : '#d1d5db',
                                            color: selectedVariantId === variant.id ? 'white' : 'inherit'
                                        }}
                                    >
                                        {variant.variant_name || `Option`}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {/* Add to Cart CTA Group */}
                    <div className="flex space-x-3 pt-3 border-t border-gray-100">
                        
                        {/* Quantity Control */}
                        <div className="flex border border-gray-300 rounded-lg overflow-hidden shadow-sm flex-shrink-0">
                            <button 
                                className="px-3 py-2 text-gray-700 hover:bg-gray-100 transition-colors font-medium"
                                onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                            >
                                -
                            </button>
                            <input
                                type="number"
                                value={quantity}
                                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                min="1"
                                className="w-12 px-2 py-2 border-x border-gray-300 text-center font-medium focus:outline-none"
                            />
                            <button 
                                className="px-3 py-2 text-gray-700 hover:bg-gray-100 transition-colors font-medium"
                                onClick={() => setQuantity(prev => prev + 1)}
                            >
                                +
                            </button>
                        </div>
                        
                        {/* Add to Cart Button (Primary Color) */}
                        <button
                            onClick={handleAddToCart}
                            disabled={isAddingToCart || cartLoading || !selectedVariantId}
                            className="flex-1 py-3 text-white text-lg font-bold rounded-lg flex items-center justify-center transition-colors disabled:bg-gray-400 shadow-md hover:shadow-lg"
                            style={{ backgroundColor: PRIMARY_COLOR }}
                        >
                            {isAddingToCart ? (
                                <FaSpinner className='animate-spin mr-3' />
                            ) : (
                                <FaShoppingCart className='mr-3' />
                            )}
                            {isAddingToCart ? 'Adding...' : 'Add to Cart'}
                        </button>
                        
                    </div>
                    
                    {/* Policies & Availability */}
                    <div className="pt-3 space-y-2 text-sm text-gray-700 border-t border-gray-100">
                        <p className="flex items-center font-semibold">
                            <FaCheckCircle className='mr-2 text-blue-500 w-4 h-4' /> 
                            {selectedVariant?.quantity !== undefined && selectedVariant?.quantity !== null ? 
                                `In Stock (${selectedVariant.quantity} available)` : 
                                `In Stock ${product.base_quantity !== null ? `(Base Qty: ${product.base_quantity})` : ''}`
                            }
                        </p>
                        <p className="flex items-center">
                            <FaRegClock className='mr-2 text-blue-500 w-4 h-4' /> Fast Delivery: 2-3 Days across UAE.
                        </p>
                    </div>
                </div>
            </div>
            
            {/* ⬇️ FULL WIDTH ROW: Product Description (NEW SECTION) */}
            {product.description && (
                <div className="mt-8 bg-white p-6 rounded-xl shadow-xl border border-gray-100">
                    <h2 className="text-2xl font-bold text-slate-800 mb-4 pb-2 border-b border-gray-200 flex items-center">
                        <FaListAlt className='mr-2 text-gray-600' /> Product Details
                    </h2>
                    {/* Renders the rich HTML content provided by the backend */}
                    <div 
                        className="prose max-w-none text-gray-700 leading-relaxed" 
                        dangerouslySetInnerHTML={{ __html: product.description }} 
                    />
                </div>
            )}
            
        </div>
    );
};

export default ProductDetailPage;