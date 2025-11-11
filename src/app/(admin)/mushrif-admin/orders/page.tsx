'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { FaSync, FaEye, FaBox, FaSpinner, FaUsers } from 'react-icons/fa';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { toast } from 'react-hot-toast';
import { useAdminOrderService } from '@/services/admin/orderService';
import { Order } from '@/types/order';

// Define the valid statuses array
const STATUSES = ['Pending Confirmation', 'Packed', 'Shipped', 'Delivered', 'Cancelled'];

const AdminOrderListPage: React.FC = () => {
    const { fetchAllOrders } = useAdminOrderService(); // Removed updateOrderStatus as it's not used in this view anymore
    
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    // Removed statusUpdatingId state as status updates are moved to the detail page

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
                                        {/* REMOVED STATUS DROPDOWN, REPLACED WITH BADGE */}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end space-x-2">
                                                {/* View Button */}
                                                <Link href={`/mushrif-admin/orders/detail?id=${order.id}`}>
                                                    <button className="p-1.5 bg-gray-50 text-gray-700 rounded-md hover:bg-gray-100 transition-colors" title="View Details">
                                                        <FaEye className='w-4 h-4' />
                                                    </button>
                                                </Link>
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