// src/app/(admin)/mushrif-admin/orders/detail/DeliveredBlockModal.tsx
'use client';

import React from 'react';
import { FaTimes, FaLock, FaCheckCircle } from 'react-icons/fa';

interface DeliveredBlockModalProps {
    orderId: string;
    onClose: () => void;
}

const DeliveredBlockModal: React.FC<DeliveredBlockModalProps> = ({ orderId, onClose }) => {
    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm mx-auto rounded-xl shadow-2xl p-6 space-y-4 text-center">
                <div className="flex justify-center items-center">
                    <div className="bg-green-100 p-3 rounded-full">
                        <FaCheckCircle className='text-green-600 w-8 h-8' />
                    </div>
                </div>

                <h2 className="text-xl font-bold text-slate-800 text-center flex items-center justify-center">
                    <FaLock className='mr-2 text-red-600' /> Order Finalized
                </h2>

                <p className='text-sm text-gray-600 text-center'>
                    Order ID: <b>{orderId.substring(0, 8)}...</b>
                </p>

                <div className="p-3 bg-red-50 text-red-800 text-sm rounded-lg flex items-start">
                    <FaLock className='mt-1 mr-2 flex-shrink-0' />
                    <span>
                        This order is marked as <b>Delivered</b> and <b>Paid</b>. For final orders, status updates are <b>blocked</b> to ensure data integrity.
                    </span>
                </div>
                
                <div className="flex justify-end pt-2">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeliveredBlockModal;