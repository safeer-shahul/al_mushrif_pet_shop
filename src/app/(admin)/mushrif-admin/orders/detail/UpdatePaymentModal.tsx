// src/app/(admin)/mushrif-admin/orders/detail/UpdatePaymentModal.tsx
'use client';

import React, { useState } from 'react';
import { FaTimes, FaDollarSign, FaSpinner, FaCheckCircle } from 'react-icons/fa';
import { Order } from '@/types/order';
import { toast } from 'react-hot-toast'; // Assuming you use react-hot-toast

interface UpdatePaymentModalProps {
    order: Order;
    onClose: () => void;
    onSubmit: () => Promise<void>; // Handler to call the service function and reload data
}

// 💡 NEW Utility function local to the modal for safe string-to-number conversion
const safeFormatPrice = (price: string | number) => {
    const numericPrice = parseFloat(String(price));
    return isNaN(numericPrice) ? '0.00' : numericPrice.toFixed(2);
};


const UpdatePaymentModal: React.FC<UpdatePaymentModalProps> = ({ order, onClose, onSubmit }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError(null);

        setIsSubmitting(true);
        try {
            await onSubmit();
            toast.success(`Payment confirmed for Order ID ${order.id.substring(0, 8)}.`);
            onClose();
        } catch (error: any) {
            console.error("Payment update failed:", error);
            setLocalError(error.message || "Failed to mark order as Paid. Check server response.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const isCod = order.payment_mode === 'COD';
    const showCodWarning = isCod && order.status !== 'Delivered';

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm mx-auto rounded-xl shadow-2xl p-6 space-y-4">
                <div className="flex justify-between items-center border-b pb-3">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center">
                        <FaDollarSign className='mr-2 text-green-600' /> Mark as Paid
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600" disabled={isSubmitting}><FaTimes /></button>
                </div>

                <p className='text-md font-semibold text-slate-700'>
                    Order ID: <b>{order.id.substring(0, 8)}...</b>
                </p>
                <p className='text-sm text-gray-600'>
                    Confirm receipt of <b>{safeFormatPrice(order.payable_price)} AED</b> for this order (Mode: <b>{order.payment_mode}</b>).
                </p>
                
                {showCodWarning && (
                     <div className="p-3 bg-yellow-100 text-yellow-800 text-sm rounded-lg flex items-start">
                        <FaTimes className='mt-1 mr-2 flex-shrink-0' />
                        <span><b>Caution:</b> For COD, payment is typically confirmed after delivery. The backend will enforce this rule.</span>
                    </div>
                )}

                {localError && <div className="p-3 bg-red-100 text-red-700 text-sm rounded-lg">{localError}</div>}
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex justify-end space-x-3 pt-2">
                        <button type="button" onClick={onClose} disabled={isSubmitting} className="px-4 py-2 text-sm bg-gray-200 rounded hover:bg-gray-300">
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            disabled={isSubmitting} 
                            className="px-4 py-2 text-sm bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 disabled:bg-gray-400 flex items-center"
                        >
                            {isSubmitting ? (
                                <FaSpinner className='animate-spin mr-2' />
                            ) : (
                                <FaCheckCircle className='mr-2' />
                            )}
                            Confirm Payment Received
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UpdatePaymentModal;