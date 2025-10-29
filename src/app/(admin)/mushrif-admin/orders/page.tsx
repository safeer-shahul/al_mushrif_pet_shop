// src/app/(admin)/mushrif-admin/orders/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { FaSync, FaEye, FaBox, FaTruck, FaCheckCircle, FaTimes, FaSpinner, FaUsers } from 'react-icons/fa';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { toast } from 'react-hot-toast';
import { useAdminOrderService } from '@/services/admin/orderService';
import { Order } from '@/types/order';

// Define the valid statuses array
const STATUSES = ['Pending Confirmation', 'Packed', 'Shipped', 'Delivered', 'Cancelled'];

// --- Placeholder for AdminOrderService Hook ---
// NOTE: You must ensure you have a hook that handles the API calls to:
// GET /admin/orders/all
// PUT /admin/orders/{id}/status
const useAdminOrderServicePlaceholder = () => {
    const { token } = { token: 'admin_token' }; // Placeholder token access
    const apiClient = {
        get: async (url: string) => ({ data: JSON.parse(localStorage.getItem('mockOrders') || '[]') }),
        put: async (url: string, data: any) => {
            console.log(`Mock API PUT: ${url}`, data);
            return { data: { message: 'Status updated (mock)', order: { id: 'mock', status: data.status } } };
        }
    };
    
    // In a real app, use the actual useAdminOrderService hook
    return useAdminOrderService();
}


const AdminOrderListPage: React.FC = () => {
    const { fetchAllOrders, updateOrderStatus } = useAdminOrderService(); 
    
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);

    const loadOrders = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchAllOrders();
            setOrders(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load orders.');
            console.error('Error loading orders:', err);
        } finally {
            setLoading(false);
        }
    }, [fetchAllOrders]);

    useEffect(() => {
        loadOrders();
    }, [loadOrders]);

    // --- Status Change Handler ---
    const handleStatusChange = async (orderId: string, newStatus: string) => {
        const orderName = orders.find(o => o.id === orderId)?.id || 'Order';

        if (newStatus === 'Cancelled' && !window.confirm(`Are you sure you want to CANCEL order ${orderName}?`)) {
            return;
        }

        setStatusUpdatingId(orderId);
        try {
            // This calls the backend route where inventory deduction happens on 'Shipped'
            await updateOrderStatus(orderId, newStatus);
            toast.success(`Status for ${orderName} updated to ${newStatus}.`);
            await loadOrders(); // Refresh the list
        } catch (err: any) {
            const message = err.message || `Failed to update status for ${orderName}.`;
            toast.error(message);
        } finally {
            setStatusUpdatingId(null);
        }
    };

    // --- Utility Functions ---
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Delivered': return 'text-green-600 bg-green-100';
            case 'Shipped': return 'text-blue-600 bg-blue-100';
            case 'Packed': return 'text-indigo-600 bg-indigo-100';
            case 'Cancelled': return 'text-red-600 bg-red-100';
            case 'Pending Confirmation': 
            default: return 'text-yellow-600 bg-yellow-100';
        }
    };
    
    const formatPrice = (price: number | string) => {
        return `AED ${parseFloat(String(price)).toFixed(2)}`;
    };


    if (loading && orders.length === 0) {
        return <LoadingSpinner />;
    }

    return (
        <div className="space-y-6">
            
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-800">Order Management</h1>
                <button 
                    onClick={loadOrders}
                    disabled={loading}
                    className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50"
                >
                    <FaSync className={`inline-block mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {error && (
                <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-lg text-sm text-red-700">{error}</div>
            )}
            
            {orders.length === 0 && !loading && !error ? (
                <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
                    <FaBox className="h-10 w-10 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">No Orders Found</h3>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead>
                                <tr className="bg-gray-50">
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {orders.map((order) => (
                                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900 truncate max-w-[100px]">{order.id}</div>
                                            <div className="text-xs text-gray-500">{new Date(order.created_at).toLocaleDateString()}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center text-sm font-medium text-blue-600">
                                                <FaUsers className='mr-1' /> {order.user?.username || 'Guest'}
                                            </div>
                                            <div className="text-xs text-gray-500">{order.user?.email}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm font-semibold text-slate-800">{formatPrice(order.payable_price)}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end space-x-2">
                                                {/* View Button */}
                                                <Link href={`/mushrif-admin/orders/${order.id}`}>
                                                    <button className="p-1.5 bg-gray-50 text-gray-700 rounded-md hover:bg-gray-100 transition-colors" title="View Details">
                                                        <FaEye className='w-4 h-4' />
                                                    </button>
                                                </Link>
                                                
                                                {/* Status Dropdown */}
                                                <select
                                                    value={order.status}
                                                    onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                                    disabled={order.status === 'Delivered' || order.status === 'Cancelled' || statusUpdatingId === order.id}
                                                    className={`py-1.5 pl-2 pr-8 text-xs border rounded-md focus:ring-blue-500 focus:border-blue-500 
                                                        ${getStatusColor(order.status).replace('text-', 'border-').replace('bg-', 'bg-')}
                                                    `}
                                                >
                                                    {STATUSES.map(status => (
                                                        <option key={status} value={status}>
                                                            {status}
                                                        </option>
                                                    ))}
                                                </select>

                                                {/* Loading Spinner */}
                                                {statusUpdatingId === order.id && (
                                                    <FaSpinner className="animate-spin text-blue-500" />
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminOrderListPage;