// src/app/(admin)/mushrif-admin/orders/detail/ReturnStockModal.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { FaTimes, FaWarehouse, FaPlus, FaMinus, FaSpinner, FaCheckCircle } from 'react-icons/fa';
import { Order } from '@/types/order';
import { useAdminOrderService } from '@/services/admin/orderService';
import { toast } from 'react-hot-toast';

interface ReturnStockModalProps {
    order: Order;
    onClose: () => void;
    onSuccess: () => void;
}

const ReturnStockModal: React.FC<ReturnStockModalProps> = ({ order, onClose, onSuccess }) => {
    const { returnStock } = useAdminOrderService();

    const orderItems = order.items ?? []; 

    // Map of {variantId: quantityToReturn}
    const initialQuantities = useMemo(() => {
        return orderItems.reduce((acc, item) => {
            acc[item.prod_variant_id] = 0; 
            return acc;
        }, {} as Record<string, number>);
    }, [orderItems]);

    const [quantitiesToReturn, setQuantitiesToReturn] = useState(initialQuantities);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);

    const handleQuantityChange = (variantId: string, delta: number, maxQuantity: number) => {
        setQuantitiesToReturn(prev => {
            const current = prev[variantId] || 0;
            let newQuantity = current + delta;
            
            newQuantity = Math.max(0, Math.min(newQuantity, maxQuantity));
            
            return { ...prev, [variantId]: newQuantity };
        });
    };

    const handleSubmit = async () => {
        setLocalError(null);
        
        const itemsToReturn = orderItems
            .filter(item => quantitiesToReturn[item.prod_variant_id] > 0)
            .map(item => ({
                variant_id: item.prod_variant_id,
                quantity: quantitiesToReturn[item.prod_variant_id],
            }));

        if (itemsToReturn.length === 0) {
            setLocalError("Please select at least one item and quantity greater than zero to return.");
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await returnStock(order.id, itemsToReturn);
            toast.success(response.message || "Stock returned successfully!");
            onSuccess();
        } catch (error: any) {
            console.error('Stock return error:', error);
            setLocalError(error.message || "Failed to return stock. Check server logs.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const totalItemsToReturn = Object.values(quantitiesToReturn).reduce((sum, q) => sum + q, 0);

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg mx-auto rounded-xl shadow-2xl p-6 space-y-4">
                <div className="flex justify-between items-center border-b pb-3">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center">
                        <FaWarehouse className='mr-2 text-green-600' /> Return Stock (Order: {order.id.substring(0, 8)})
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600" disabled={isSubmitting}><FaTimes /></button>
                </div>

                {localError && <div className="p-3 bg-red-100 text-red-700 text-sm rounded-lg">{localError}</div>}
                
                <p className='text-sm text-gray-600'>Select the quantity of each item to return to inventory. Max return quantity is the amount ordered.</p>

                <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                    {orderItems.map(item => {
                        const orderedQty = item.quantity;
                        const currentReturnQty = quantitiesToReturn[item.prod_variant_id] || 0;
                        const variantName = item.variant?.variant_name || item.variant?.product?.prod_name || 'Item';
                        
                        return (
                            <div key={item.id} className="flex items-center justify-between p-2 border-b border-gray-100">
                                <span className="text-sm font-medium text-slate-700 truncate max-w-[50%]">
                                    {variantName}
                                    <span className='text-xs text-gray-500 ml-2'>(Ordered: {orderedQty})</span>
                                </span>
                                
                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={() => handleQuantityChange(item.prod_variant_id, -1, orderedQty)}
                                        disabled={currentReturnQty <= 0 || isSubmitting}
                                        className="p-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50"
                                    >
                                        <FaMinus className='w-3 h-3' />
                                    </button>
                                    <span className="w-8 text-center font-bold text-slate-800">{currentReturnQty}</span>
                                    <button
                                        onClick={() => handleQuantityChange(item.prod_variant_id, 1, orderedQty)}
                                        disabled={currentReturnQty >= orderedQty || isSubmitting}
                                        className="p-1 bg-green-200 text-green-700 rounded hover:bg-green-300 disabled:opacity-50"
                                    >
                                        <FaPlus className='w-3 h-3' />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="flex justify-end pt-3 border-t">
                    <button
                        onClick={handleSubmit}
                        disabled={totalItemsToReturn === 0 || isSubmitting}
                        className="px-6 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors flex items-center"
                    >
                        {isSubmitting ? (
                            <FaSpinner className='animate-spin mr-2' />
                        ) : (
                            <FaCheckCircle className='mr-2' />
                        )}
                        Confirm Return ({totalItemsToReturn})
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReturnStockModal;