// src/components/public/OrderSummaryStep.tsx
'use client';

import React, { useMemo } from 'react';
import { FaShoppingCart, FaCheckCircle } from 'react-icons/fa';
import { useCart } from '@/context/CartContext';
import { CartItem } from '@/types/cart';
import LoadingSpinner from '../ui/LoadingSpinner';

interface OrderSummaryStepProps {
    onContinue: () => void; // Function to proceed to the next step (Place Order)
    totalItemsPrice: number;
    totalDiscount: number;
    payablePrice: number;
    selectedAddressLine: string;
}

const OrderSummaryStep: React.FC<OrderSummaryStepProps> = ({
    onContinue,
    totalItemsPrice,
    totalDiscount,
    payablePrice,
    selectedAddressLine,
}) => {
    const { cart, cartLoading } = useCart();
    
    if (cartLoading) {
        return <LoadingSpinner />;
    }

    if (!cart || cart.items.length === 0) {
        return <div className="p-4 text-center text-red-600">Your cart is empty. Please add items to proceed.</div>;
    }

    return (
        <div className="space-y-6">
            <h4 className="text-lg font-bold text-slate-700 border-b pb-2">Review Your Order</h4>

            {/* Selected Address Display */}
            <div className="p-3 bg-blue-50 border-l-4 border-blue-400 text-sm">
                <span className='font-semibold'>Ship To: </span> {selectedAddressLine}
            </div>

            {/* Items List */}
            <h4 className="text-md font-bold text-slate-700">Items ({cart.items.length})</h4>
            <div className="max-h-48 overflow-y-auto space-y-3 p-2 border rounded-lg bg-gray-50">
                {cart.items.map((item: CartItem) => (
                    <div key={item.id} className="flex justify-between items-center text-sm">
                        <span className='truncate'>{item.variant.product.prod_name} ({item.quantity}x)</span>
                        <span className="font-medium flex-shrink-0 ml-2">
                            AED {(item.variant.offer_price || item.variant.price).toFixed(2)}
                        </span>
                    </div>
                ))}
            </div>

            {/* Payment & Offer Review */}
            <div className="space-y-1">
                <div className="flex justify-between text-sm font-medium">
                    <span>Payment Method:</span>
                    <span className="text-green-600 flex items-center">
                        <FaCheckCircle className='mr-1' /> Cash On Delivery
                    </span>
                </div>
                <div className="flex justify-between text-sm font-medium">
                    <span>Shipping:</span>
                    <span>AED 0.00</span>
                </div>
                <div className="flex justify-between text-sm font-medium text-green-600">
                    <span>Discount Applied:</span>
                    <span>- AED {totalDiscount.toFixed(2)}</span>
                </div>
            </div>

            {/* Final Total */}
            <div className="flex justify-between pt-4 border-t border-gray-200 text-xl font-bold">
                <span>Total Payable:</span>
                <span style={{ color: 'var(--color-primary)' }}>AED {payablePrice.toFixed(2)}</span>
            </div>

            <div className="flex justify-end pt-4">
                <button
                    onClick={onContinue}
                    className="px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
                >
                    Confirm & Place Order
                </button>
            </div>
        </div>
    );
};

export default OrderSummaryStep;