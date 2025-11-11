'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { FaSync, FaEye, FaBox, FaSpinner, FaUsers, FaSearch } from 'react-icons/fa'; // Added FaSearch
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useAdminOrderService } from '@/services/admin/orderService';
import { Order } from '@/types/order';

// Define the valid statuses array - kept for dropdown population
const STATUSES = ['All', 'Pending Confirmation', 'Packed', 'Shipped', 'Delivered', 'Cancelled'];

const AdminOrderListPage: React.FC = () => {
    const { fetchAllOrders } = useAdminOrderService();
    
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // --- NEW STATE FOR FILTERING ---
    const [selectedStatus, setSelectedStatus] = useState<string>('All');
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [currentSearch, setCurrentSearch] = useState<string>(''); // Used to trigger search on button/enter
    // -------------------------------

    const loadOrders = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Determine query parameters to send
            const params: Record<string, string> = {};
            if (selectedStatus !== 'All') {
                params.status = selectedStatus;
            }
            if (currentSearch) {
                params.search = currentSearch;
            }

            // The service hook needs to be updated to accept parameters
            const data = await fetchAllOrders(params); 
            setOrders(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load orders.');
            console.error('Error loading orders:', err);
        } finally {
            setLoading(false);
        }
    }, [fetchAllOrders, selectedStatus, currentSearch]); // Dependencies added

    useEffect(() => {
        loadOrders();
    }, [loadOrders]);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setCurrentSearch(searchTerm); // Trigger loadOrders via dependency array
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
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <h1 className="text-2xl font-bold text-slate-800 mb-4 sm:mb-0">Order Management</h1>
                <button 
                    onClick={() => { setCurrentSearch(''); setSelectedStatus('All'); loadOrders(); }} // Reset filters on refresh
                    disabled={loading}
                    className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50"
                >
                    <FaSync className={`inline-block mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>
            
            {/* --- NEW FILTER/SEARCH BAR --- */}
            <div className="flex flex-col lg:flex-row gap-4 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
                
                {/* Status Filter */}
                <div className="flex items-center space-x-2 w-full lg:w-1/3">
                    <label htmlFor="status-filter" className="text-sm font-medium text-gray-700 flex-shrink-0">Filter by Status:</label>
                    <select
                        id="status-filter"
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        disabled={loading}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    >
                        {STATUSES.map((status) => (
                            <option key={status} value={status}>{status}</option>
                        ))}
                    </select>
                </div>

                {/* Search Bar */}
                <form onSubmit={handleSearchSubmit} className="flex items-center space-x-2 w-full lg:w-2/3">
                    <div className="relative w-full">
                        <input
                            type="text"
                            placeholder="Search by ID, Customer Name, or Email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            disabled={loading}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        />
                        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex-shrink-0"
                    >
                        Search
                    </button>
                    {currentSearch && (
                        <button
                            type="button"
                            onClick={() => { setSearchTerm(''); setCurrentSearch(''); }}
                            className="text-sm text-gray-500 hover:text-red-500 transition-colors flex-shrink-0"
                            title="Clear Search"
                        >
                            Clear
                        </button>
                    )}
                </form>
            </div>
            {/* ------------------------------- */}

            {error && (
                <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-lg text-sm text-red-700">{error}</div>
            )}
            
            {orders.length === 0 && !loading && !error ? (
                <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
                    <FaBox className="h-10 w-10 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">No Orders Found</h3>
                    {(selectedStatus !== 'All' || currentSearch) && (
                        <p className="text-gray-500 mt-2">Try clearing the filters or search term.</p>
                    )}
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