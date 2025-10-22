// src/components/public/CartDrawer.tsx
'use client';

import React, { useMemo } from 'react';
import { FaTimes, FaShoppingCart, FaTrash, FaPlus, FaMinus, FaLock, FaBox } from 'react-icons/fa';
import { useCart } from '@/context/CartContext';
import LoadingSpinner from '../ui/LoadingSpinner';

interface CartDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose }) => {
    const { cart, cartCount, cartLoading, removeItem, updateItemQuantity } = useCart();

    // Calculate totals (simplified for now)
    const { totalItemsPrice, totalDiscount } = useMemo(() => {
        let itemsPrice = 0;
        let discount = 0;

        cart?.items.forEach(item => {
            const price = item.variant.price || 0;
            const offerPrice = item.variant.offer_price || 0;
            
            itemsPrice += price * item.quantity;
            
            // Calculate discount if an offer price exists
            if (offerPrice > 0 && offerPrice < price) {
                discount += (price - offerPrice) * item.quantity;
            }
        });
        
        return {
            totalItemsPrice: itemsPrice,
            totalDiscount: discount,
        };
    }, [cart]);

    const payablePrice = totalItemsPrice - totalDiscount;

    const handleUpdateQuantity = (prodVariantId: string, currentQuantity: number, action: 'add' | 'remove') => {
        const newQuantity = action === 'add' ? currentQuantity + 1 : currentQuantity - 1;
        if (newQuantity >= 0) {
            updateItemQuantity(prodVariantId, newQuantity);
        }
    };
    
    // Placeholder for checkout initiation
    const handleCheckout = () => {
        // Here we would open the Checkout Modal (to be implemented later)
        onClose(); // Close drawer
        // router.push('/checkout'); // Or dispatch an action to open the modal
        alert("Proceeding to checkout...");
    }


    return (
        <>
            {/* Overlay */}
            {isOpen && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300" 
                    onClick={onClose}
                />
            )}

            {/* Cart Drawer */}
            <div 
                className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
                    isOpen ? 'translate-x-0' : 'translate-x-full'
                }`}
            >
                {/* Drawer Header */}
                <div className="p-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center">
                        <FaShoppingCart className="mr-2" style={{ color: 'var(--color-primary-light)' }} />
                        Your Cart ({cartCount})
                    </h3>
                    <button onClick={onClose} className="p-2 text-gray-500 hover:text-gray-700 rounded-full">
                        <FaTimes className="w-5 h-5" />
                    </button>
                </div>
                
                {cartLoading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <LoadingSpinner />
                    </div>
                ) : cart?.items.length === 0 || !cart ? (
                    /* Empty Cart State */
                    <div className="flex-1 p-6 text-center flex flex-col items-center justify-center">
                        <FaBox className="w-12 h-12 mb-4 text-gray-300" />
                        <p className="text-lg font-medium text-slate-700">Your cart is empty.</p>
                        <p className="text-sm text-gray-500 mt-1">Start browsing our categories to find great items!</p>
                    </div>
                ) : (
                    <>
                        {/* Cart Items List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 border-b border-gray-100">
                            {cart.items.map(item => (
                                <div key={item.id} className="flex items-start border-b pb-4 last:border-b-0">
                                    <div className="w-20 h-20 flex-shrink-0 mr-4 rounded-lg overflow-hidden border border-gray-200">
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
                                    <div className="flex-1">
                                        <h4 className="text-sm font-medium text-slate-800 leading-tight">
                                            {item.variant.product.prod_name}
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
                                                <p className="text-sm font-bold" style={{ color: item.variant.offer_price ? 'var(--color-primary)' : 'inherit' }}>
                                                    AED {(item.variant.offer_price || item.variant.price || 0).toFixed(2)}
                                                </p>
                                                {item.variant.offer_price && (
                                                    <p className="text-xs text-gray-500 line-through">
                                                        AED {item.variant.price.toFixed(2)}
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
                            ))}
                        </div>

                        {/* Totals & Checkout Button (Sticky Footer) */}
                        <div className="p-4 bg-gray-50 border-t border-gray-200">
                            <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                    <span>Subtotal:</span>
                                    <span className="font-medium">AED {totalItemsPrice.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-green-600">
                                    <span>Discount:</span>
                                    <span className="font-medium">- AED {totalDiscount.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between pt-2 border-t border-gray-200 text-lg font-bold">
                                    <span>Total Payable:</span>
                                    <span style={{ color: 'var(--color-primary)' }}>AED {payablePrice.toFixed(2)}</span>
                                </div>
                            </div>
                            
                            <button
                                onClick={handleCheckout}
                                className="w-full mt-4 py-3 text-white font-semibold rounded-lg flex items-center justify-center shadow-lg transition-colors"
                                style={{ backgroundColor: 'var(--color-primary-light)' }}
                            >
                                <FaLock className="mr-2 w-4 h-4" /> Proceed to Checkout
                            </button>
                        </div>
                    </>
                )}
            </div>
        </>
    );
};

export default CartDrawer;