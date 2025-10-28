// src/components/public/CartDrawer.tsx
'use client';

import React, { useMemo, useState } from 'react'; 
import { FaTimes, FaShoppingCart, FaPlus, FaMinus, FaLock, FaBox, FaSpinner, FaTag, FaTrash } from 'react-icons/fa';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import LoginModal from './LoginModal';
import CheckoutModal from './CheckoutModal';


interface CartDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose }) => {
    const { cart, cartCount, cartLoading, removeItem, updateItemQuantity, setIsCartDrawerOpen } = useCart();
    const { isAuthenticated } = useAuth();
    
    const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false); 
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

    // Helper to safely convert price to number
    const getSafeNumber = (value: number | string | undefined | null): number => {
        // Coalesce undefined/null/string to 0 and convert to float
        return parseFloat(String(value || 0));
    };

    // Calculate totals (Fall back to manual calculation if cart.totals is null, e.g., in guest mode)
    const { totalItemsPrice, totalDiscount, payablePrice, shippingPrice } = useMemo(() => {
        if (cart?.totals) {
            return {
                totalItemsPrice: getSafeNumber(cart.totals.total_actual_price),
                totalDiscount: getSafeNumber(cart.totals.total_discount),
                payablePrice: getSafeNumber(cart.totals.payable_price),
                shippingPrice: getSafeNumber(cart.totals.shipping_price || 0),
            };
        }
        
        // --- GUEST CART FALLBACK CALCULATION ---
        let manualItemsPrice = 0;
        let manualDiscount = 0;
        
        cart?.items.forEach(item => {
            const basePrice = getSafeNumber(item.variant.price) || 0;
            const offerPrice = getSafeNumber(item.variant.offer_price) || 0;
            const priceToUse = offerPrice > 0 && offerPrice < basePrice ? offerPrice : basePrice;
            
            manualItemsPrice += basePrice * item.quantity;
            manualDiscount += (basePrice - priceToUse) * item.quantity;
        });

        // NOTE: Guest carts don't support cart-level coupons/shipping yet, 
        // so we assume shipping is free and final discount is item-level only.
        return {
            totalItemsPrice: manualItemsPrice, // Base Price total
            totalDiscount: manualDiscount, // Item-level discount total
            shippingPrice: 0.00,
            payablePrice: Math.max(0, manualItemsPrice - manualDiscount),
        };
        
    }, [cart]);


    const handleUpdateQuantity = (prodVariantId: string, currentQuantity: number, action: 'add' | 'remove') => {
        const newQuantity = action === 'add' ? currentQuantity + 1 : currentQuantity - 1;
        if (newQuantity >= 0) { 
            updateItemQuantity(prodVariantId, newQuantity);
        }
    };
    
    const handleCheckout = () => {
        onClose(); 

        if (!isAuthenticated) {
            setIsLoginModalOpen(true);
        } else {
            setIsCheckoutModalOpen(true);
        }
    }


    return (
        <>
            {isOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300" 
                    onClick={onClose}
                />
            )}

            <div 
                className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
                    isOpen ? 'translate-x-0' : 'translate-x-full'
                }`}
            >
                
                <div className="p-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center">
                        <FaShoppingCart className="mr-2" style={{ color: 'var(--color-primary-light)' }} />
                        Your Cart ({cartCount})
                    </h3>
                    <button onClick={onClose} className="p-2 text-gray-500 hover:text-gray-700 rounded-full">
                        <FaTimes className="w-5 h-5" />
                    </button>
                </div>

                {cartLoading || !cart || cart.items.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center">
                        {cartLoading ? <LoadingSpinner /> : (
                             <div className="p-6 text-center flex flex-col items-center justify-center">
                                 <FaBox className="w-12 h-12 mb-4 text-gray-300" />
                                 <p className="text-lg font-medium text-slate-700">Your cart is empty.</p>
                                 <p className="text-sm text-gray-500 mt-1">Start browsing our categories to find great items!</p>
                             </div>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 border-b border-gray-100">
                            {cart.items.map(item => {
                                // 💡 Price Fallback: Use calculated price from backend, or manually calculate for guest mode
                                const basePrice = getSafeNumber(item.variant.price) || 0;
                                const offerPrice = getSafeNumber(item.variant.offer_price) || 0;
                                const priceToUse = offerPrice > 0 && offerPrice < basePrice ? offerPrice : basePrice;
                                
                                // Calculate values, prioritizing calculated fields from the API if they exist
                                const itemTotal = getSafeNumber(item.item_total_price) || (priceToUse * item.quantity);
                                const itemDiscount = getSafeNumber(item.item_discount) || ((basePrice - priceToUse) * item.quantity);
                                const itemBasePriceTotal = basePrice * item.quantity;

                                return (
                                <div key={item.id} className="flex items-start border-b pb-4 last:border-b-0">
                                    <div className="w-20 h-20 flex-shrink-0 mr-4 rounded-lg overflow-hidden border border-gray-200">
                                        {/* 💡 Use the injected primary_image_url from context */}
                                        {item.primary_image_url ? ( 
                                            <img 
                                                src={item.primary_image_url} // Use the resolved URL
                                                alt={item.variant.product.prod_name} 
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gray-100 flex items-center justify-center text-xs text-gray-500">No Image</div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-sm font-medium text-slate-800 leading-tight">
                                            {item.variant.product.prod_name}
                                            {itemDiscount > 0 && <FaTag className='ml-2 text-red-500 inline' title='Discount Applied' />}
                                        </h4>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {item.variant.variant_name || 'Base Product'}
                                        </p>
                                        
                                        <div className="mt-2 flex items-center justify-between">
                                            <div className="flex items-center space-x-1 border border-gray-300 rounded-lg">
                                                <button 
                                                    onClick={() => handleUpdateQuantity(item.prod_variant_id, item.quantity, 'remove')}
                                                    className="p-1 text-gray-600 hover:bg-gray-100 rounded-l-lg disabled:opacity-50"
                                                    disabled={item.quantity <= 1}
                                                >
                                                    <FaMinus className="w-3 h-3" />
                                                </button>
                                                <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                                                <button 
                                                    onClick={() => handleUpdateQuantity(item.prod_variant_id, item.quantity, 'add')}
                                                    className="p-1 text-gray-600 hover:bg-gray-100 rounded-r-lg"
                                                >
                                                    <FaPlus className="w-3 h-3" />
                                                </button>
                                            </div>
                                            
                                            <div className="text-right">
                                                <p className="text-sm font-bold" style={{ color: itemDiscount > 0 ? 'var(--color-primary)' : 'inherit' }}>
                                                    AED {itemTotal.toFixed(2)}
                                                </p>
                                                {itemDiscount > 0 && (
                                                    <p className="text-xs text-gray-500 line-through">
                                                        AED {itemBasePriceTotal.toFixed(2)}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <button 
                                        onClick={() => removeItem(item.prod_variant_id)}
                                        className="p-1 ml-2 text-red-500 hover:text-red-700 rounded-full flex-shrink-0"
                                    >
                                        <FaTrash className="w-4 h-4" />
                                    </button>
                                </div>
                                )
                            })}
                        </div>

                        {/* Totals & Checkout Button (Sticky Footer) */}
                        <div className="p-4 bg-gray-50 border-t border-gray-200">
                            <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                    <span>Subtotal (Base Price):</span>
                                    <span className="font-medium">AED {totalItemsPrice.toFixed(2)}</span>
                                </div>
                                
                                <div className="flex justify-between text-red-600">
                                    <span>Discount:</span>
                                    <span className="font-medium">- AED {totalDiscount.toFixed(2)}</span>
                                </div>
                                
                                <div className="flex justify-between">
                                    <span>Shipping:</span>
                                    <span className="font-medium">AED {shippingPrice.toFixed(2)}</span>
                                </div>
                                
                                <div className="flex justify-between pt-2 border-t border-gray-200 text-lg font-bold">
                                    <span>Total Payable:</span>
                                    <span style={{ color: 'var(--color-primary)' }}>AED {payablePrice.toFixed(2)}</span>
                                </div>
                            </div>
                            
                            <button
                                onClick={handleCheckout}
                                disabled={payablePrice <= 0}
                                className="w-full mt-4 z-10 py-3 text-white font-semibold rounded-lg flex items-center justify-center shadow-lg transition-colors disabled:bg-gray-400"
                                style={{ backgroundColor: 'var(--color-primary-light)' }}
                            >
                                <FaLock className="mr-2 w-4 h-4" /> Proceed to Checkout
                            </button>
                        </div>
                    </>
                )}
            </div>
            
            <LoginModal 
                isOpen={isLoginModalOpen} 
                onClose={() => setIsLoginModalOpen(false)}
                onLoginSuccess={() => { setIsLoginModalOpen(false); setIsCheckoutModalOpen(true); }}
            />

            <CheckoutModal 
                isOpen={isCheckoutModalOpen} 
                onClose={() => setIsCheckoutModalOpen(false)} 
            />
        </>
    );
};

export default CartDrawer;