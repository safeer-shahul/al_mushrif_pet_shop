'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FaTimes, FaShoppingCart, FaCheckCircle, FaLock, FaSpinner, FaTruck } from 'react-icons/fa';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useCheckoutService } from '@/services/public/checkoutService';
import LoadingSpinner from '../ui/LoadingSpinner';

// Import Modular Steps
import AddressSelectionStep from './AddressSelectionStep';
import OrderSummaryStep from './OrderSummaryStep';

import { Address } from '@/types/user';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

interface CheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
}

// Define the steps and their order
type CheckoutStep = 'ADDRESS' | 'CONFIRMATION_REVIEW' | 'ORDER_SUCCESS';

const CHECKOUT_STEPS: { [key in CheckoutStep]: { title: string, icon: React.ElementType, stepIndex: number } } = {
    ADDRESS: { title: '1. Shipping & Payment', icon: FaTruck, stepIndex: 1 },
    CONFIRMATION_REVIEW: { title: '2. Order Summary', icon: FaLock, stepIndex: 2 },
    ORDER_SUCCESS: { title: 'Order Placed!', icon: FaCheckCircle, stepIndex: 3 },
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

    const currentStepIndex = CHECKOUT_STEPS[currentStep].stepIndex;

    // Calculate totals
    const { totalItemsPrice, totalDiscount } = useMemo(() => {
        let itemsPrice = 0;
        let discount = 0;
        cart?.items.forEach(item => {
            const price = parseFloat(String(item.variant.price || 0));
            // Use offer_price if available and less than regular price
            const offerPrice = parseFloat(String(item.variant.offer_price || 0));

            itemsPrice += price * item.quantity;
            if (offerPrice > 0 && offerPrice < price) {
                discount += (price - offerPrice) * item.quantity;
            }
        });
        return { totalItemsPrice: itemsPrice, totalDiscount: discount };
    }, [cart]);

    // Shipping is currently hardcoded as 0.00
    const shippingFee = 0.00; 
    const payablePrice = totalItemsPrice - totalDiscount + shippingFee;

    // Reset state and validate prerequisites when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            // Initial checks for immediate flow termination
            if (!isAuthenticated) {
                setLocalError("You must be logged in to proceed to checkout.");
                return;
            }
            if (!cart || cart.items.length === 0 || payablePrice <= 0) {
                 setLocalError("Your cart is empty or the total is invalid.");
                 return;
            }

            // Reset flow state
            setCurrentStep('ADDRESS');
            setOrderConfirmation(null);
            setLocalError(null);
            setOrderPlacing(false); // Ensure placing is false on open
            
            // Auto-select first address if user has addresses and none is selected
            if (user?.addresses && user.addresses.length > 0 && !selectedAddress) {
                const defaultAddress = user.addresses.find(a => a.is_default) || user.addresses[0];
                setSelectedAddress(defaultAddress);
            } else if (isAuthenticated && (!user?.addresses || user.addresses.length === 0)) {
                 // Allow user to see the modal to add an address in AddressSelectionStep
            }
        } else {
            // Full reset when closing
            setCurrentStep('ADDRESS');
            setLocalError(null);
            setOrderConfirmation(null);
            setSelectedAddress(null);
        }
    }, [isOpen, isAuthenticated, cart, payablePrice, user?.addresses]);


    // Handler to initiate the order POST request (UI FREEZE FIX IMPLEMENTED HERE)
    const handlePlaceOrder = useCallback(async () => {
        if (!selectedAddress?.id) {
            toast.error("A valid shipping address must be selected.");
            return;
        }

        setOrderPlacing(true); // <-- Set placing true
        setLocalError(null);

        try {
            const isCartValid = await validateCart();
            if (!isCartValid) {
                toast.error("Cart validation failed. Please review your cart items.");
                setCurrentStep('CONFIRMATION_REVIEW');
                return; // Exits the try block, hits the finally block
            }

            // Assuming placeOrder sends the required data including address ID and uses COD by default
            const response = await placeOrder(selectedAddress.id);

            setOrderConfirmation(response.order);
            setCurrentStep('ORDER_SUCCESS');
            toast.success("Order placed successfully! Check your email for confirmation.");

            // Clear the cart view
            fetchCart();

        } catch (error: any) {
            setLocalError(error.message || 'Failed to place order. Please try again.');
            setCurrentStep('CONFIRMATION_REVIEW');
        } finally {
            // CRITICAL FIX: Ensure orderPlacing is always reset, regardless of success or failure.
            setOrderPlacing(false); 
        }
    }, [selectedAddress, placeOrder, fetchCart, validateCart]);


    // --- Step Renderer ---

    const renderCurrentStep = () => {
        if (localError && currentStep !== 'ORDER_SUCCESS') {
             return (
                 <div className="text-center p-8 space-y-4">
                     <FaTimes className="w-16 h-16 mx-auto text-red-500" />
                     <h2 className="text-2xl font-bold text-red-700">Cannot Proceed</h2>
                     <p className="text-slate-700">{localError}</p>
                     <button
                         onClick={onClose}
                         className="mt-6 px-6 py-3 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700"
                     >
                         Close & Review Cart
                     </button>
                 </div>
             );
        }
        
        if (cartLoading) {
            return <LoadingSpinner />;
        }

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
                        cartItems={cart?.items || []}
                        totalItemsPrice={totalItemsPrice}
                        totalDiscount={totalDiscount}
                        payablePrice={payablePrice}
                        shippingFee={shippingFee}
                        selectedAddressLine={selectedAddress?.address_line1 || 'Address not selected'}
                        onContinue={handlePlaceOrder}
                        onBack={() => setCurrentStep('ADDRESS')}
                        orderPlacing={orderPlacing}
                    />
                );
            case 'ORDER_SUCCESS':
                // Ensure price is parsed safely
                const orderPrice = parseFloat(orderConfirmation?.payable_price || payablePrice || '0');

                return (
                    <div className="text-center p-8 space-y-5">
                        <FaCheckCircle className="w-16 h-16 mx-auto text-green-500 animate-pulse" />
                        <h2 className="text-2xl font-bold text-green-700">Order Placed Successfully! 🎉</h2>
                        {orderConfirmation?.id && (
                             <p className="text-slate-700 font-medium text-lg">Your Order ID: **#{String(orderConfirmation.id).substring(0, 8)}**</p>
                        )}
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-700 font-semibold">
                                Payment Method: <span className="text-green-600">Cash On Delivery</span>
                            </p>
                            <p className="text-lg font-extrabold text-gray-900 mt-2">
                                Please prepare **AED {orderPrice.toFixed(2)}** for the delivery agent.
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-full mt-6 px-6 py-3 bg-[var(--color-primary,#FF6B35)] text-white font-medium rounded-lg hover:bg-[var(--color-primary,#FF6B35)]/90 transition-colors"
                        >
                            Continue Shopping
                        </button>
                        <Link href="/user/orders" onClick={onClose} className="block text-sm text-blue-600 hover:underline">
                            View My Orders
                        </Link>
                    </div>
                );
            default: return <LoadingSpinner />;
        }
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] overflow-y-auto bg-black/60 flex items-center justify-center p-4">
            <div className="relative bg-white w-full max-w-xl mx-auto my-8 p-6 rounded-xl shadow-2xl transform transition-all duration-300">

                {/* Header and Step Indicator */}
                <div className="border-b border-gray-200 mb-2 pb-2">
                    <div className="flex justify-between items-center mb-4">
                           <h3 className="text-2xl font-bold text-slate-800 flex items-center">
                                <FaShoppingCart className="mr-2 w-6 h-6 text-[var(--color-primary,#FF6B35)]" />
                                Checkout
                            </h3>
                           <button
                                className="text-gray-400 hover:text-gray-600 p-1"
                                onClick={onClose}
                                disabled={orderPlacing} // Disabled while placing the order
                            >
                                <FaTimes className="w-5 h-5" />
                            </button>
                    </div>

                    {/* Step Progress Bar (Hidden on success) */}
                    {currentStep !== 'ORDER_SUCCESS' && (
                        <div className="flex justify-between items-center relative pt-2">
                            {Object.values(CHECKOUT_STEPS).slice(0, 2).map((step, index, arr) => (
                                <React.Fragment key={step.title}>
                                    {/* Step Circle */}
                                    <div className={`flex flex-col items-center z-10 ${currentStepIndex >= step.stepIndex ? 'text-[var(--color-primary,#FF6B35)]' : 'text-gray-400'}`}>
                                        <div className={`w-8 h-8 flex items-center justify-center rounded-full border-2 font-bold transition-all duration-500 ${
                                            currentStepIndex > step.stepIndex
                                                ? 'bg-[var(--color-primary,#FF6B35)] border-[var(--color-primary,#FF6B35)] text-white'
                                                : currentStepIndex === step.stepIndex
                                                    ? 'bg-white border-[var(--color-primary,#FF6B35)] text-[var(--color-primary,#FF6B35)]'
                                                    : 'bg-white border-gray-300 text-gray-400'
                                        }`}>
                                            {currentStepIndex > step.stepIndex ? <FaCheckCircle className="w-3 h-3" /> : step.stepIndex}
                                        </div>
                                        <span className="text-xs mt-1.5 font-semibold hidden sm:block">
                                            {step.title.split('. ')[1]}
                                        </span>
                                    </div>
                                </React.Fragment>
                            ))}
                        </div>
                    )}
                </div>

                {/* Content Area */}
                <div className="min-h-[250px] relative">
                    {renderCurrentStep()}
                </div>

            </div>
        </div>
    );
};

export default CheckoutModal;