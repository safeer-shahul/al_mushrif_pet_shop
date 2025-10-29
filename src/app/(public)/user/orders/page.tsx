'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { FaClipboardList, FaSpinner, FaTimesCircle, FaCheckCircle, FaTruck, FaChevronDown, FaChevronUp, FaBoxOpen, FaCube, FaTag, FaMoneyBillWave } from 'react-icons/fa';
import { usePublicOrderService } from '@/services/public/orderService';
// NOTE: Assuming OrderItem type has actual_price and offer_price
import { Order, OrderItem } from '@/types/order'; 
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { toast } from 'react-hot-toast';
import { useCategoryService } from '@/services/admin/categoryService';

const PRIMARY_COLOR = 'var(--color-primary, #FF6B35)';

// --- Utilities ---
const formatPrice = (price: number | string) => `AED ${parseFloat(String(price)).toFixed(2)}`;
const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

const getStatusDetails = (status: string) => {
    switch (status) {
        case 'Delivered': return { text: 'Delivered', color: 'text-green-700 bg-green-100', icon: FaCheckCircle };
        case 'Shipped': return { text: 'Shipped', color: 'text-blue-700 bg-blue-100', icon: FaTruck };
        case 'Packed': return { text: 'Packed', color: 'text-indigo-700 bg-indigo-100', icon: FaBoxOpen };
        case 'Cancelled': return { text: 'Cancelled', color: 'text-red-700 bg-red-100', icon: FaTimesCircle };
        case 'Pending Confirmation': 
        default: return { text: 'Pending', color: 'text-gray-700 bg-gray-100', icon: FaSpinner };
    }
};

// --- Collapsible Order Card Component ---
interface CollapsibleOrderCardProps {
    order: Order;
    handleCancel: (orderId: string) => Promise<void>;
    cancelingId: string | null;
}

const CollapsibleOrderCard: React.FC<CollapsibleOrderCardProps> = ({ order, handleCancel, cancelingId }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const { getStorageUrl } = useCategoryService();
    const { text, color, icon: StatusIcon } = getStatusDetails(order.status);
    
    const canCancel = (order.status === 'Pending Confirmation' || order.status === 'Packed') && !order.is_cancelled;
    const isActionDisabled = cancelingId === order.id;

    const getProductImage = useCallback((item: OrderItem) => {
        const safeParseImages = (rawImages: any): any[] => {
            if (typeof rawImages === 'string' && rawImages.trim().startsWith('[')) {
                try {
                    return JSON.parse(rawImages);
                } catch (e) {
                    return [];
                }
            }
            return (rawImages || []) as any[];
        };

        const variantImages = safeParseImages(item.variant?.images);
        const productImages = safeParseImages(item.variant?.product?.images);
        
        const imagesToSearch = [...variantImages, ...productImages]
            .filter(img => img && typeof img.image_url === 'string'); 
        
        const primaryImage = imagesToSearch.find((img: any) => img.is_primary);
        const imageUrl = primaryImage?.image_url || imagesToSearch[0]?.image_url || null;
        
        return getStorageUrl(imageUrl);
    }, [getStorageUrl]);

    return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            {/* Header - Always visible */}
            <div 
                className="p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between cursor-pointer transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full md:w-auto text-sm flex-1">
                    <div className='min-w-[100px]'>
                        <p className="text-xs text-gray-500 uppercase font-semibold">Order ID</p>
                        <p className="font-bold text-slate-800 text-sm md:text-base">#{order.id.substring(0, 8).toUpperCase()}</p>
                    </div>
                    <div className='min-w-[120px]'>
                        <p className="text-xs text-gray-500 uppercase font-semibold">Placed On</p>
                        <p className="font-medium text-slate-800">{formatDate(order.created_at)}</p>
                    </div>
                    <div className='min-w-[100px]'>
                        <p className="text-xs text-gray-500 uppercase font-semibold">Total</p>
                        <p className="font-extrabold text-lg" style={{ color: PRIMARY_COLOR }}>{formatPrice(order.payable_price)}</p>
                    </div>
                    <div className='col-span-2 sm:col-span-1 min-w-[120px]'>
                        <p className="text-xs text-gray-500 uppercase font-semibold">Status</p>
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${color} items-center mt-1`}>
                            <StatusIcon className='w-3 h-3 mr-1.5' /> {text}
                        </span>
                    </div>
                </div>

                <div className="mt-4 md:mt-0 flex items-center space-x-3 flex-shrink-0">
                    {canCancel && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); handleCancel(order.id); }}
                            disabled={isActionDisabled}
                            className="px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:bg-red-400 flex items-center shadow-md"
                        >
                            {isActionDisabled ? <FaSpinner className='animate-spin mr-2' /> : <FaTimesCircle className='mr-2' />}
                            {isActionDisabled ? 'Canceling...' : 'Cancel Order'}
                        </button>
                    )}
                    
                    <button 
                        className="p-2 text-slate-600 border border-gray-300 rounded-full bg-white hover:bg-gray-100 transition-colors shadow-sm" 
                        title="Toggle Details"
                    >
                        {isExpanded ? <FaChevronUp className='w-4 h-4' /> : <FaChevronDown className='w-4 h-4' />}
                    </button>
                </div>
            </div>

            {/* Details - Collapsible Content */}
            {isExpanded && (
                <div className="p-4 sm:p-6 border-t border-gray-200 bg-gray-50 space-y-6">
                    {/* Item List */}
                    <div className='space-y-4'>
                        <h4 className="text-base font-bold text-slate-800 flex items-center">
                            <FaClipboardList className='w-4 h-4 mr-2 text-blue-500' /> Items Ordered ({order.items?.length || 0})
                        </h4>
                        <div className="space-y-3">
                            {order.items?.map(item => {
                                // Calculate unit prices
                                const finalPrice = item.offer_price || item.actual_price;
                                const totalItemPrice = finalPrice * item.quantity;
                                const originalTotal = item.actual_price * item.quantity;
                                const itemDiscountExists = finalPrice < item.actual_price;

                                return (
                                <div key={item.id} className="flex items-start space-x-4 p-3 bg-white rounded-lg border border-gray-100 shadow-sm">
                                    {/* Image */}
                                    <div className="w-16 h-16 flex-shrink-0 rounded-md overflow-hidden border border-gray-200">
                                        {getProductImage(item) ? (
                                            <img src={getProductImage(item) || ''} alt={item.variant?.product?.prod_name || 'Product'} className="w-full h-full object-contain" />
                                        ) : (
                                            <FaCube className='w-full h-full text-gray-300 p-2' />
                                        )}
                                    </div>
                                    {/* Details */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-slate-800 truncate">{item.variant?.product?.prod_name}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">Variant: {item.variant?.variant_name || 'Base'}</p>
                                        <div className='mt-1 flex items-center'>
                                            {itemDiscountExists && <span className='text-xs text-green-600 font-medium flex items-center'><FaTag className='mr-1' /> Discount Applied</span>}
                                        </div>
                                    </div>
                                    {/* Quantity & Price */}
                                    <div className="text-right flex-shrink-0 ml-4">
                                        <p className="text-sm font-semibold text-slate-700">x{item.quantity} @ {formatPrice(finalPrice)}</p>
                                        <p className="text-base font-bold text-gray-900">{formatPrice(totalItemPrice)}</p>
                                        {itemDiscountExists && (
                                             <p className="text-xs text-gray-400 line-through">{formatPrice(originalTotal)}</p>
                                        )}
                                    </div>
                                </div>
                            )})}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-3 border-t border-gray-200">
                        {/* Shipping Info */}
                        <div className="space-y-2 bg-white p-4 rounded-lg shadow-inner border border-gray-100">
                            <p className="text-base font-bold text-slate-800 flex items-center">
                                <FaTruck className='mr-2 text-indigo-500' /> Delivery & Payment
                            </p>
                            <div className='text-sm text-gray-600 pl-4 ml-1.5 border-l-2 border-indigo-300'>
                                <p><strong>Address:</strong> {order.address?.address_line1}, {order.address?.zip_pin}</p>
                                <p><strong>Phone:</strong> {order.address?.phone_numbers[0]}</p>
                                <p className='mt-2'><strong>Payment:</strong> Cash on Delivery (COD)</p>
                            </div>
                            {order.cancel_reason && order.status === 'Cancelled' && (
                                <p className="text-sm font-semibold text-red-600 mt-3">
                                    <FaTimesCircle className='inline mr-1' /> Cancellation Reason: {order.cancel_reason}
                                </p>
                            )}
                        </div>

                        {/* Financials Summary */}
                        <div className="space-y-2 text-right bg-white p-4 rounded-lg shadow-inner border border-gray-100">
                             <p className="text-base font-bold text-slate-800 flex items-center justify-end">
                                Financial Summary
                            </p>
                            <div className="text-sm text-gray-600">Items Subtotal: <span className='font-medium'>{formatPrice(order.actual_price)}</span></div>
                            {/* THIS LINE IS CORRECTLY REFERENCING THE PARENT ORDER OBJECT */}
                            <div className="text-sm text-red-600 font-semibold">Discount Savings: <span className='font-medium'>- {formatPrice(order.discount_price)}</span></div> 
                            <div className="text-sm text-gray-600">Shipping: <span className='font-medium'>{formatPrice(order.shipping_price)}</span></div>
                            <div className="text-xl font-extrabold text-gray-900 border-t border-gray-300 pt-2" style={{ color: PRIMARY_COLOR }}>
                                Grand Total: {formatPrice(order.payable_price)}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Main Page Component ---
// (No change needed below this point)

const OrdersHistoryPage: React.FC = () => {
    const { fetchUserOrders, cancelOrder } = usePublicOrderService();
    
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [cancelingId, setCancelingId] = useState<string | null>(null);
    
    const loadOrders = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchUserOrders();
            const sortedData = data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            setOrders(sortedData);
        } catch (err: any) {
            setError(err.message || 'Failed to load order history.');
            setOrders([]);
        } finally {
            setLoading(false);
        }
    }, [fetchUserOrders]);
    
    useEffect(() => {
        loadOrders();
    }, [loadOrders]);
    
    const handleCancel = async (orderId: string) => {
        const orderToCancel = orders.find(o => o.id === orderId);
        if (!orderToCancel) return;

        if (orderToCancel.status === 'Shipped' || orderToCancel.status === 'Delivered' || orderToCancel.status === 'Cancelled') {
            toast.error(`Order ${orderToCancel.id.substring(0, 8)}... cannot be cancelled as it is already ${orderToCancel.status}.`);
            return;
        }

        const reason = prompt("Please enter a brief reason for cancellation:");
        
        if (reason === null || reason.trim() === "") {
            toast.error("Cancellation requires a reason.");
            return;
        }

        if (!window.confirm(`Are you sure you want to cancel Order #${orderId.substring(0, 8)}...?`)) return;

        setCancelingId(orderId);
        try {
            await cancelOrder(orderId, reason.trim());
            toast.success(`Order #${orderId.substring(0, 8)} successfully cancelled.`);
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'Cancelled', is_cancelled: true, cancel_reason: reason.trim() } : o));
        } catch (err: any) {
             toast.error(err.message || "Failed to process cancellation.");
        } finally {
            setCancelingId(null);
        }
    };

    return (
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-2xl border border-gray-100 space-y-6">
            <h2 className="text-xl font-extrabold text-slate-800 flex items-center border-b border-gray-200 pb-4" style={{ color: PRIMARY_COLOR }}>
                My Order History
            </h2>
            
            {loading && <LoadingSpinner />}
            
            {error && (
                <div className="p-3 bg-red-100 border-l-4 border-red-500 text-red-700 rounded-md text-sm font-medium">{error}</div>
            )}
            
            {!loading && orders.length === 0 && !error ? (
                <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <p className='text-lg font-semibold'>You haven't placed any orders yet.</p>
                    <Link href="/products" className="mt-4 inline-block font-medium text-white px-6 py-2 rounded-lg transition-colors shadow-md" style={{ backgroundColor: PRIMARY_COLOR}}>
                        Start Shopping Now
                    </Link>
                </div>
            ) : (
                <div className="space-y-5">
                    {orders.map((order) => (
                        <CollapsibleOrderCard 
                            key={order.id} 
                            order={order} 
                            handleCancel={handleCancel}
                            cancelingId={cancelingId}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default OrdersHistoryPage;