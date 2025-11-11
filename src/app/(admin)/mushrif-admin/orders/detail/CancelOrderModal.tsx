// src/app/(admin)/mushrif-admin/orders/detail/CancelOrderModal.tsx
'use client';

import React, { useState } from 'react';
import { FaTimes, FaBan, FaSpinner, FaInfoCircle } from 'react-icons/fa';

interface CancelOrderModalProps {
    orderId: string;
    onClose: () => void;
    onSubmit: (reason: string) => Promise<void>;
}

const CancelOrderModal: React.FC<CancelOrderModalProps> = ({ orderId, onClose, onSubmit }) => {
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError(null);
        if (!reason.trim()) {
            setLocalError("A reason for cancellation is required.");
            return;
        }

        setIsSubmitting(true);
        try {
            await onSubmit(reason.trim());
        } catch (error) {
            console.error("Cancellation submission failed locally:", error);
            setLocalError("Failed to submit cancellation request to the server.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm mx-auto rounded-xl shadow-2xl p-6 space-y-4">
                <div className="flex justify-between items-center border-b pb-3">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center">
                        <FaBan className='mr-2 text-red-600' /> Confirm Cancellation
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600" disabled={isSubmitting}><FaTimes /></button>
                </div>

                <p className='text-sm text-gray-600'>Order ID: **{orderId.substring(0, 8)}**</p>
                <div className="p-3 bg-yellow-50 text-yellow-800 text-sm rounded-lg flex items-start">
                    <FaInfoCircle className='mt-1 mr-2 flex-shrink-0' />
                    <span>Stock will **not** be automatically returned to inventory. Use the "Return Stock" button after confirming cancellation.</span>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="cancel-reason" className="block text-sm font-medium text-slate-700">Reason for Cancellation</label>
                        <textarea
                            id="cancel-reason"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            rows={3}
                            placeholder="e.g., Customer requested cancellation, Item out of stock"
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                            disabled={isSubmitting}
                            required
                        />
                        {localError && <p className="text-xs text-red-500 mt-1">{localError}</p>}
                    </div>

                    <div className="flex justify-end space-x-3 pt-2">
                        <button type="button" onClick={onClose} disabled={isSubmitting} className="px-4 py-2 text-sm bg-gray-200 rounded hover:bg-gray-300">
                            Keep Order
                        </button>
                        <button 
                            type="submit" 
                            disabled={isSubmitting || !reason.trim()} 
                            className="px-4 py-2 text-sm bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 disabled:bg-gray-400 flex items-center"
                        >
                            {isSubmitting ? (
                                <FaSpinner className='animate-spin mr-2' />
                            ) : (
                                <FaBan className='mr-2' />
                            )}
                            Confirm Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CancelOrderModal;