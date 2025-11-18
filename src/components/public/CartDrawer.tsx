'use client';

import React, { useMemo, useState } from 'react'; 
import { FaTimes, FaShoppingCart, FaPlus, FaMinus, FaLock, FaBox, FaSpinner, FaTag, FaTrash, FaDollarSign } from 'react-icons/fa';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import LoginModal from './LoginModal';
import CheckoutModal from './CheckoutModal';
import Link from 'next/link';

interface CartDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose }) => {
    const { cart, cartCount, cartLoading, removeItem, updateItemQuantity, setIsCartDrawerOpen, fetchCart } = useCart(); // Ensure fetchCart is destructured
    const { isAuthenticated } = useAuth();
    
    const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false); 
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

    // Helper to safely convert price to number
    const getSafeNumber = (value: number | string | undefined | null): number => {
        return parseFloat(String(value || 0));
    };

    // Calculate totals (Fall back to manual calculation if cart.totals is null)
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

        return {
            totalItemsPrice: manualItemsPrice, 
            totalDiscount: manualDiscount, 
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
        // Close the drawer before opening the modal
        onClose(); 

        if (!isAuthenticated) {
            setIsLoginModalOpen(true);
        } else if (payablePrice > 0) {
            setIsCheckoutModalOpen(true);
        }
    }

    // FIX: Function to handle modal close AND force cart refresh
    const handleCheckoutModalClose = () => {
        setIsCheckoutModalOpen(false); 
        // CRITICAL: Force the cart to re-fetch its state (which should now be empty from the backend)
        fetchCart(); 
    };


    return (
        <>
            {isOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300" 
                    onClick={onClose}
                />
            )}

            <div 
                className={`fixed top-0 right-0 h-full w-full sm:w-[26rem] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
                    isOpen ? 'translate-x-0' : 'translate-x-full'
                }`}
            >
                
                {/* Drawer Header */}
                <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white shadow-sm">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center">
                        <FaShoppingCart className="mr-3 w-5 h-5 text-[var(--color-primary,#FF6B35)]" />
                        My Cart ({cartCount})
                    </h3>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-700 rounded-full transition-colors">
                        <FaTimes className="w-5 h-5" />
                    </button>
                </div>

                {/* Loading / Empty State */}
                {cartLoading || !cart || cart.items.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center p-6">
                        {cartLoading ? <LoadingSpinner /> : (
                             <div className="p-6 text-center flex flex-col items-center justify-center bg-gray-50 border border-dashed border-gray-300 rounded-xl w-full">
                                 <FaBox className="w-10 h-10 mb-4 text-gray-400" />
                                 <p className="text-lg font-semibold text-slate-700">Your cart is empty.</p>
                                 <p className="text-sm text-gray-500 mt-1">Ready to find something great?</p>
                                 <Link href="/" onClick={onClose} className="mt-4 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
                                     Continue Shopping
                                 </Link>
                             </div>
                        )}
                    </div>
                ) : (
                    <>
                        {/* Cart Items List */}
                        <div className="flex-1 overflow-y-auto p-5 space-y-5">
                            {cart.items.map(item => {
                                // Calculate item details
                                const basePrice = getSafeNumber(item.variant.price) || 0;
                                const offerPrice = getSafeNumber(item.variant.offer_price) || 0;
                                const priceToUse = offerPrice > 0 && offerPrice < basePrice ? offerPrice : basePrice;
                                
                                const itemTotal = getSafeNumber(item.item_total_price) || (priceToUse * item.quantity);
                                const itemDiscount = getSafeNumber(item.item_discount) || ((basePrice - priceToUse) * item.quantity);
                                const itemBasePriceTotal = basePrice * item.quantity;

                                return (
                                <div key={item.id} className="flex items-start bg-white p-3 rounded-lg border border-gray-100 shadow-sm transition-shadow hover:shadow-md">
                                    {/* Image */}
                                    <div className="w-16 h-16 flex-shrink-0 mr-4 rounded-md overflow-hidden border border-gray-200">
                                        {item.primary_image_url ? ( 
                                             <img 
                                                 src={item.primary_image_url} 
                                                 alt={item.variant.product.prod_name} 
                                                 className="w-full h-full object-cover"
                                             />
                                         ) : (
                                             <div className="w-full h-full bg-gray-100 flex items-center justify-center text-xs text-gray-500">No Image</div>
                                         )}
                                    </div>
                                    
                                    {/* Details & Controls */}
                                    <div className="flex-1 space-y-2">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="text-sm font-semibold text-slate-800 leading-snug line-clamp-2">
                                                    {item.variant.product.prod_name}
                                                </h4>
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    {item.variant.variant_name || 'Base Product'}
                                                </p>
                                            </div>
                                            {/* Delete Button */}
                                            <button 
                                                onClick={() => removeItem(item.prod_variant_id)}
                                                className="p-1 ml-2 text-red-500 hover:text-red-700 rounded-full flex-shrink-0 transition-colors"
                                                title="Remove Item"
                                            >
                                                <FaTrash className="w-4 h-4" />
                                            </button>
                                        </div>
                                        
                                        <div className="flex items-center justify-between">
                                            {/* Quantity Controls */}
                                            <div className="flex items-center space-x-1 border border-gray-300 rounded-lg">
                                                <button 
                                                    onClick={() => handleUpdateQuantity(item.prod_variant_id, item.quantity, 'remove')}
                                                    className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-l-lg disabled:opacity-50"
                                                    disabled={item.quantity <= 1 || cartLoading}
                                                >
                                                    <FaMinus className="w-3 h-3" />
                                                </button>
                                                <span className="text-sm font-semibold w-6 text-center">{item.quantity}</span>
                                                <button 
                                                    onClick={() => handleUpdateQuantity(item.prod_variant_id, item.quantity, 'add')}
                                                    className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-r-lg disabled:opacity-50"
                                                    disabled={cartLoading}
                                                >
                                                    <FaPlus className="w-3 h-3" />
                                                </button>
                                            </div>
                                            
                                            {/* Price Display */}
                                            <div className="text-right">
                                                <p className="text-base font-bold text-gray-900" style={{ color: itemDiscount > 0 ? 'var(--color-primary,#FF6B35)' : 'inherit' }}>
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
                                </div>
                                )
                            })}
                        </div>

                        {/* Totals & Checkout Button (Sticky Footer) */}
                        <div className="p-5 bg-gray-50 border-t border-gray-200 sticky bottom-0">
                            <h4 className="font-bold text-base text-gray-800 mb-3 flex items-center"> Order Summary</h4>
                            <div className="space-y-1 text-sm text-gray-700">
                                <div className="flex justify-between">
                                    <span>Subtotal (Base Price):</span>
                                    <span className="font-medium">AED {totalItemsPrice.toFixed(2)}</span>
                                </div>
                                
                                <div className="flex justify-between text-green-600 font-semibold">
                                    <span className='flex items-center'>Discount Savings: <FaTag className='ml-2 w-3 h-3' /></span>
                                    <span className="font-medium">- AED {totalDiscount.toFixed(2)}</span>
                                </div>
                                
                                <div className="flex justify-between">
                                    <span>Shipping:</span>
                                    <span className="font-medium">{shippingPrice === 0 ? 'Free' : `AED ${shippingPrice.toFixed(2)}`}</span>
                                </div>
                                
                                <div className="flex justify-between pt-3 border-t border-gray-300 text-xl font-extrabold text-gray-900">
                                    <span>Total Payable:</span>
                                    <span style={{ color: 'var(--color-primary,#FF6B35)' }}>AED {payablePrice.toFixed(2)}</span>
                                </div>
                            </div>
                            
                            <button
                                onClick={handleCheckout}
                                disabled={payablePrice <= 0 || cartLoading}
                                className="w-full mt-6 py-3 text-white font-bold text-lg rounded-xl flex items-center justify-center shadow-xl transition-all hover:opacity-90 disabled:bg-gray-400 disabled:shadow-none"
                                style={{ backgroundColor: 'var(--color-primary,#FF6B35)' }}
                            >
                                {isAuthenticated ? (
                                    <>
                                        <FaLock className="mr-3 w-5 h-5" /> Proceed to Checkout
                                    </>
                                ) : (
                                    <>
                                        <FaLock className="mr-3 w-5 h-5" /> Login to Checkout
                                    </>
                                )}
                            </button>
                        </div>
                    </>
                )}
            </div>
            
            {/* Modals */}
            <LoginModal 
                isOpen={isLoginModalOpen} 
                onClose={() => setIsLoginModalOpen(false)}
                // If login succeeds, immediately open the checkout modal
                onLoginSuccess={() => { setIsLoginModalOpen(false); setIsCheckoutModalOpen(true); }}
            />

            <CheckoutModal 
                isOpen={isCheckoutModalOpen} 
                onClose={handleCheckoutModalClose} 
            />
        </>
    );
};

export default CartDrawer;