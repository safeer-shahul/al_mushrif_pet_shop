// src/app/(admin)/mushrif-admin/offers/page.tsx
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { FaPlus, FaEdit, FaTrash, FaSync, FaGift } from 'react-icons/fa';
import { Offer } from '@/types/offer'; 
import { useOfferService } from '@/services/admin/offerService';
import { useRouter } from 'next/navigation';

const OfferListPage: React.FC = () => {
    const router = useRouter();
    const { fetchAllOffers, deleteOffer } = useOfferService();
    
    const [offers, setOffers] = useState<Offer[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const hasFetchedRef = useRef(false);

    // Load function (unchanged)
    const loadOffers = useCallback(async () => {
        if (loading && hasFetchedRef.current) return;
        
        setLoading(true);
        setError(null);
        
        try {
            const fetchedOffers = await fetchAllOffers(); 
            setOffers(fetchedOffers);
            setError(null);
            hasFetchedRef.current = true;
        } catch (err: any) {
            setError(err.message || 'Failed to load offers');
            console.error('Error loading offers:', err);
            setOffers([]);
        } finally {
            setLoading(false);
        }
    }, [fetchAllOffers, loading]); 

    // Load on mount only
    useEffect(() => {
        if (!hasFetchedRef.current) {
            loadOffers();
        }
    }, [loadOffers]);

    const handleDelete = async (id: string, name: string) => {
        if (!window.confirm(`Are you sure you want to delete the Offer: ${name}? This action cannot be undone.`)) return;
        
        try {
            setError(null);
            await deleteOffer(id);
            
            const toast = document.createElement('div');
            toast.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
            toast.textContent = 'Offer deleted successfully.';
            document.body.appendChild(toast);
            setTimeout(() => document.body.removeChild(toast), 3000);
            
            hasFetchedRef.current = false;
            await loadOffers();
        } catch (err: any) {
            setError(err.message || 'Failed to delete offer.');
            console.error('Delete error:', err);
        }
    };

    // 💡 FIX APPLIED HERE: Use parseFloat() before .toFixed()
    const getDiscountDisplay = (offer: Offer) => {
        const discountValue = offer.discount_percent !== null ? parseFloat(String(offer.discount_percent)) : 0;
        const minCartAmount = offer.min_cart_amount !== null ? parseFloat(String(offer.min_cart_amount)) : 0;
        
        switch (offer.type) {
            case 'percentage':
                return `${discountValue.toFixed(0)}% OFF`;
            case 'fixed_amount':
                return `AED ${discountValue.toFixed(2)} OFF`;
            case 'bogo':
                return `Buy ${offer.min_qty} Get ${offer.free_qty} Free`;
            case 'cart_total_percentage':
                return `${discountValue.toFixed(0)}% OFF (Min AED ${minCartAmount.toFixed(2)})`;
            case 'cart_total_fixed':
                return `AED ${discountValue.toFixed(2)} OFF (Min AED ${minCartAmount.toFixed(2)})`;
            default:
                return 'Custom/Unknown';
        }
    };

    const handleManualRefresh = () => {
        hasFetchedRef.current = false;
        loadOffers();
    };

    if (loading && offers.length === 0 && !error) {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header section with actions (unchanged) */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Offer Management</h1>
                    <p className="text-gray-500 mt-1">Create and manage promotions and product bundles.</p>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={handleManualRefresh}
                        disabled={loading}
                        className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50"
                    >
                        <FaSync className={`inline-block mr-2 ${loading ? 'animate-spin' : ''}`} />
                        {loading ? 'Loading...' : 'Refresh'}
                    </button>
                    <Link href="/mushrif-admin/offers/create" passHref>
                        <button className="flex items-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg hover:from-blue-700 hover:to-blue-600 transition-colors shadow-sm">
                            <FaPlus className="mr-2" /> Add New Offer
                        </button>
                    </Link>
                </div>
            </div>

            {/* Error alert (unchanged) */}
            {error && (
                <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
                    <p className="text-sm text-red-700">{error}</p>
                </div>
            )}

            {/* Data table */}
            {!error && offers.length > 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead>
                                <tr className="bg-gray-50">
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discount</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Products</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {offers.map((offer) => (
                                    <tr key={offer.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{offer.offer_name}</div>
                                            <div className="text-xs text-gray-500">ID: {offer.id.substring(0, 8)}...</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                            <span className="capitalize">{offer.type.replace('_', ' ')}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="font-semibold text-red-600">{getDiscountDisplay(offer)}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                            {offer.products.length} Product(s)
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                            <Link href={`/mushrif-admin/offers/${offer.id}`}>
                                                <button className="p-1.5 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors">
                                                    <FaEdit />
                                                </button>
                                            </Link>
                                            <button 
                                                onClick={() => handleDelete(offer.id, offer.offer_name)}
                                                className="p-1.5 bg-red-50 text-red-700 rounded-md hover:bg-red-100 transition-colors"
                                                disabled={loading}
                                            >
                                                <FaTrash />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                /* Empty state (unchanged) */
                !loading && (
                    <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 mb-4">
                            <FaGift className="h-8 w-8 text-blue-500" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">No Offers Found</h3>
                        <p className="mt-2 text-gray-500 max-w-sm mx-auto">Create promotional offers for your store.</p>
                        <div className="mt-6">
                            <Link href="/mushrif-admin/offers/create" passHref>
                                <button className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg hover:from-blue-700 hover:to-blue-600 shadow-sm">
                                    <FaPlus className="mr-2" /> Create First Offer
                                </button>
                            </Link>
                        </div>
                    </div>
                )
            )}
        </div>
    );
};

export default OfferListPage;