'use client';

import React from 'react';
import { FaShoppingCart, FaCheckCircle, FaMoneyBillWave, FaArrowLeft, FaSpinner, FaMapMarkerAlt } from 'react-icons/fa';
import { CartItem } from '@/types/cart';
import LoadingSpinner from '../ui/LoadingSpinner';

interface OrderSummaryStepProps {
    cartItems: CartItem[];
    onContinue: () => void; // Function to proceed to the next step (Place Order)
    onBack: () => void; // Function to go back to the previous step (Address)
    totalItemsPrice: number;
    totalDiscount: number;
    shippingFee: number;
    payablePrice: number;
    selectedAddressLine: string;
    orderPlacing: boolean;
}

const OrderSummaryStep: React.FC<OrderSummaryStepProps> = ({
    cartItems,
    onContinue,
    onBack,
    totalItemsPrice,
    totalDiscount,
    shippingFee,
    payablePrice,
    selectedAddressLine,
    orderPlacing,
}) => {
    
    if (cartItems.length === 0) {
        return <div className="p-4 text-center text-red-600 font-semibold">Your cart is empty. Please add items to proceed.</div>;
    }

    return (
        <div className="space-y-6">
            <h4 className="text-lg md:text-xl font-bold text-slate-800 pb-3">Final Confirmation</h4>

            {/* Delivery Details Card */}
            <div className="p-4 border-2 border-gray-200 rounded-xl bg-white shadow-sm space-y-3">
                <h5 className="font-bold text-base text-gray-800 flex items-center">
                     <FaMapMarkerAlt className='mr-2 w-4 h-4 text-blue-600' /> Delivery Information
                </h5>
                <div className="text-sm text-gray-700 ml-1.5 pl-4 border-l-2 border-blue-400">
                    <p>
                        <span className='font-semibold'>Shipping Address:</span> {selectedAddressLine}
                    </p>
                    <p className='mt-1'>
                        <span className='font-semibold'>Payment Method:</span> <span className="text-green-600">Cash On Delivery</span>
                    </p>
                </div>
            </div>

            {/* Price Breakdown */}
            <h4 className="text-base font-bold text-slate-800">Price Details ({cartItems.length} Items)</h4>
            <div className="bg-gray-50 py-4 rounded-xl space-y-2 text-gray-700">
                <div className="flex justify-between text-sm">
                    <span>Subtotal (Items Price):</span>
                    <span className="font-medium">AED {totalItemsPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span>Shipping Fee:</span>
                    <span className="font-medium">{shippingFee === 0 ? 'FREE' : `AED ${shippingFee.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between text-sm text-green-600 font-semibold">
                    <span>Discount:</span>
                    <span className="font-medium">- AED {totalDiscount.toFixed(2)}</span>
                </div>

                <div className="flex justify-between pt-3 border-t border-gray-300 text-lg font-extrabold text-gray-900">
                    <span>Total Payable:</span>
                    <span style={{ color: 'var(--color-primary,#FF6B35)' }}>AED {payablePrice.toFixed(2)}</span>
                </div>
            </div>
            
            {/* Final Call to Action */}
            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                <button
                    onClick={onBack}
                    disabled={orderPlacing}
                    className="text-sm md:text-lg px-4 py-3 text-gray-600 border border-gray-300 rounded-lg flex items-center hover:bg-gray-100 transition-colors font-medium"
                >
                    <FaArrowLeft className='mr-1' /> Back to Address
                </button>
                
                <button
                    onClick={onContinue}
                    disabled={orderPlacing || payablePrice <= 0}
                    className="px-6 py-3 text-sm md:text-lg  bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors shadow-lg disabled:bg-gray-400 disabled:shadow-none flex items-center justify-center min-w-[100px]"
                >
                    {orderPlacing ? (
                        <>
                            <FaSpinner className='animate-spin mr-1' /> Placing Order...
                        </>
                    ) : (
                        <>
                            <FaMoneyBillWave className='mr-2' /> Confirm & Pay
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default OrderSummaryStep;