'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FaTimes, FaShoppingCart, FaMapMarkerAlt, FaCheckCircle, FaLock, FaSpinner } from 'react-icons/fa';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useCheckoutService } from '@/services/public/checkoutService';
import LoadingSpinner from '../ui/LoadingSpinner';

// Import Modular Steps
import AddressSelectionStep from './AddressSelectionStep';
import OrderSummaryStep from './OrderSummaryStep';

import { Address } from '@/types/user';
import { toast } from 'react-hot-toast';

interface CheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type CheckoutStep = 'ADDRESS' | 'CONFIRMATION_REVIEW' | 'ORDER_SUCCESS';

const STEPS: { [key in CheckoutStep]: { title: string, icon: React.ElementType } } = {
    ADDRESS: { title: '1. Shipping & Payment', icon: FaMapMarkerAlt },
    CONFIRMATION_REVIEW: { title: '2. Final Confirmation', icon: FaLock },
    ORDER_SUCCESS: { title: 'Order Placed!', icon: FaCheckCircle },
};

const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose }) => {
    const { cart, cartLoading, fetchCart, validateCart } = useCart();
    const { user, isAuthenticated } = useAuth();
    const { placeOrder } = useCheckoutService();

    const [currentStep, setCurrentStep] = useState<CheckoutStep>('ADDRESS');
    const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
    const [orderPlacing, setOrderPlacing] = useState(false);
    const [orderConfirmation, setOrderConfirmation] = useState<any>(null);
    const [localError, setLocalError] = useState<string | null>(null);

    // Calculate totals
    const { totalItemsPrice, totalDiscount } = useMemo(() => {
        let itemsPrice = 0;
        let discount = 0;
        cart?.items.forEach(item => {
            // Ensure safe number conversion for calculation
            const price = parseFloat(String(item.variant.price || 0));
            const offerPrice = parseFloat(String(item.variant.offer_price || 0));

            itemsPrice += price * item.quantity;
            if (offerPrice > 0 && offerPrice < price) {
                discount += (price - offerPrice) * item.quantity;
            }
        });
        return { totalItemsPrice: itemsPrice, totalDiscount: discount };
    }, [cart]);

    const payablePrice = totalItemsPrice - totalDiscount + (0.00);

    // Reset state and validate prerequisites when modal opens/closes
    useEffect(() => {
        if (isOpen) {

            // 1. Initial Checks (These are valid errors if true)
            if (!isAuthenticated) {
                setLocalError("You must be logged in to proceed to checkout.");
                return;
            }
            if (!cart || cart.items.length === 0 || payablePrice <= 0) {
                 setLocalError("Your cart is empty or the total is zero.");
                 return;
            }

            // 2. Reset to initial state for new checkout flow
            setCurrentStep('ADDRESS');
            setOrderConfirmation(null);
            setLocalError(null);

            // Automatically select the first address for better UX
            if (user?.addresses && user.addresses.length > 0) {
                // Prioritize setting a default address if none is selected
                if (!selectedAddress) {
                    setSelectedAddress(user.addresses[0]);
                }
            } else if (isAuthenticated && (!user?.addresses || user.addresses.length === 0)) {
                setLocalError("Please add a shipping address to your account.");
                return;
            }

        } else {
            // Reset essential flow state fully when closing
            setCurrentStep('ADDRESS');
            setLocalError(null);
            setOrderConfirmation(null);
        }
    }, [isOpen, isAuthenticated, cart, payablePrice, user?.addresses, selectedAddress]);


    // Handler to initiate the order POST request
    const handlePlaceOrder = useCallback(async () => {
        if (!selectedAddress?.id || !isAuthenticated) {
            toast.error("Please log in and select a valid address.");
            return;
        }

        // Validate cart before proceeding
        const isCartValid = await validateCart();
        if (!isCartValid) {
            return;
        }

        setOrderPlacing(true);
        setLocalError(null);

        try {
            // Assuming placeOrder automatically uses the default payment method (COD) if not specified
            const response = await placeOrder(selectedAddress.id);

            setOrderConfirmation(response.order);
            setCurrentStep('ORDER_SUCCESS');
            toast.success("Order placed successfully!");

            // Fetch cart immediately to show it as cleared in the drawer
            fetchCart();

        } catch (error: any) {
            setLocalError(error.message || 'Failed to place order. Please try again.');
            setOrderPlacing(false);
        }
    }, [selectedAddress, isAuthenticated, placeOrder, fetchCart, validateCart]);


    // --- Renderers ---

    const renderCurrentStep = () => {
        switch (currentStep) {
            case 'ADDRESS':
                return (
                    <AddressSelectionStep
                        selectedAddress={selectedAddress}
                        setSelectedAddress={setSelectedAddress}
                        onContinue={() => {
                            if (selectedAddress) {
                                setCurrentStep('CONFIRMATION_REVIEW');
                            } else {
                                toast.error("Please select an address to continue.");
                            }
                        }}
                    />
                );
            case 'CONFIRMATION_REVIEW':
                return (
                    <OrderSummaryStep
                        totalItemsPrice={totalItemsPrice}
                        totalDiscount={totalDiscount}
                        payablePrice={payablePrice}
                        selectedAddressLine={selectedAddress?.address_line1 || 'Address not selected'}
                        onContinue={handlePlaceOrder}
                    />
                );
            case 'ORDER_SUCCESS':

                // FIX 1: Ensure price is parsed from the backend string response
                const orderPrice = parseFloat(orderConfirmation?.payable_price || '0');

                return (
                    <div className="text-center p-8 space-y-4">
                        <FaCheckCircle className="w-16 h-16 mx-auto text-green-500" />
                        <h2 className="text-2xl font-bold text-green-700">Order Placed Successfully!</h2>
                        {orderConfirmation?.id && (
                           <p className="text-slate-700">Your order **#{String(orderConfirmation.id).substring(0, 8)}** has been placed.</p>
                        )}
                        <p className="text-sm text-gray-500 mt-1">
                            You selected Cash On Delivery. Please prepare **AED {orderPrice.toFixed(2)}** for the delivery agent.
                        </p>

                        <button
                            onClick={onClose}
                            className="mt-6 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
                        >
                            Continue Shopping
                        </button>
                    </div>
                );
            default: return <LoadingSpinner />;
        }
    }

    if (!isOpen) return null;

    const CurrentIcon = STEPS[currentStep].icon;


    return (
        <div className="fixed inset-0 z-[60] overflow-y-auto bg-black/60 flex items-center justify-center">
            <div className="relative bg-white w-full max-w-lg mx-4 my-8 p-6 rounded-xl shadow-2xl transform transition-all">

                {/* Header and Step Indicator */}
                <div className="border-b border-gray-200 pb-3 mb-4 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center">
                        <CurrentIcon className="mr-2 w-5 h-5" style={{ color: 'var(--color-primary)' }} />
                        {STEPS[currentStep].title}
                    </h3>
                    <button
                        className="text-gray-400 hover:text-gray-600"
                        onClick={onClose}
                        disabled={orderPlacing}
                    >
                        <FaTimes className="w-5 h-5" />
                    </button>
                </div>

                {/* FIX 2: Only show localError if we are NOT on the success step */}
                {localError && currentStep !== 'ORDER_SUCCESS' && (
                    <div className="p-3 bg-red-100 text-red-700 text-sm rounded-lg mb-4">{localError}</div>
                )}

                {renderCurrentStep()}
            </div>
        </div>
    );
};

export default CheckoutModal;