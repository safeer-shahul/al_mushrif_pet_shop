'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FaArrowLeft, FaTruck, FaDollarSign, FaUser, FaMapMarkerAlt, FaCalendarAlt, FaCheckCircle, FaTimesCircle, FaBoxOpen, FaCube, FaSpinner, FaWarehouse, FaLock } from 'react-icons/fa';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useAdminOrderService } from '@/services/admin/orderService';
import { Order, OrderItem } from '@/types/order';
import { useCategoryService } from '@/services/admin/categoryService'; 
import { ProductImage } from '@/types/product'; 
import ReturnStockModal from './ReturnStockModal'; 
import CancelOrderModal from './CancelOrderModal';
import DeliveredBlockModal from './DeliveredBlockModal'; 
import UpdatePaymentModal from './UpdatePaymentModal'; 

const AdminOrderDetailPage: React.FC = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const orderId = searchParams.get('id'); 
    
    const { fetchOrderById, updateOrderStatus, updatePaymentStatus } = useAdminOrderService();
    const { getStorageUrl } = useCategoryService(); 

    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [statusUpdating, setStatusUpdating] = useState(false);
    const [showReturnStockModal, setShowReturnStockModal] = useState(false); 
    const [showCancelModal, setShowCancelModal] = useState(false); 
    const [showDeliveredBlockModal, setShowDeliveredBlockModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false); 

    // --- Load Data ---
    const loadOrder = useCallback(async () => {
        if (!orderId) {
            setError('Order ID is required');
            setLoading(false);
            return;
        }
        
        setLoading(true);
        setError(null);
        try {
            const data = await fetchOrderById(orderId);
            setOrder(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load order details.');
        } finally {
            setLoading(false);
        }
    }, [orderId, fetchOrderById]);

    useEffect(() => {
        loadOrder();
    }, [loadOrder]);

    // --- Utility Functions ---
    // FIX: Safely parse price as float before calling toFixed()
    const formatPrice = (price: number | string) => {
        const numericPrice = parseFloat(String(price));
        return `AED ${isNaN(numericPrice) ? '0.00' : numericPrice.toFixed(2)}`;
    };
    
    const formatDate = (dateString: string | null) => dateString ? new Date(dateString).toLocaleDateString() : 'N/A';

    const getStatusIndicator = (status: string) => {
        let icon, color;
        switch (status) {
            case 'Delivered': icon = FaCheckCircle; color = 'text-green-600 bg-green-100'; break;
            case 'Shipped': icon = FaTruck; color = 'text-blue-600 bg-blue-100'; break;
            case 'Packed': icon = FaBoxOpen; color = 'text-indigo-600 bg-indigo-100'; break;
            case 'Cancelled': icon = FaTimesCircle; color = 'text-red-600 bg-red-100'; break;
            default: icon = FaCalendarAlt; color = 'text-yellow-600 bg-yellow-100';
        }
        const IconComponent = icon;
        return (
            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${color} items-center`}>
                <IconComponent className='w-3 h-3 mr-1' /> {status}
            </span>
        );
    };

    const getProductImage = useCallback((item: OrderItem) => {
        const safeParseImages = (rawImages: any): ProductImage[] => {
            if (typeof rawImages === 'string' && rawImages.trim().startsWith('[')) {
                try {
                    return JSON.parse(rawImages) as ProductImage[];
                } catch (e) {
                    console.error("Failed to parse image string:", rawImages, e);
                    return [];
                }
            }
            return (rawImages || []) as ProductImage[];
        };

        const variantImages = safeParseImages(item.variant?.images);
        const productImages = safeParseImages(item.variant?.product?.images);
        
        const imagesToSearch = [...variantImages, ...productImages].filter(img => img && typeof img.image_url === 'string'); 
        const primaryImage = imagesToSearch.find(img => img.is_primary);
        const imageUrl = primaryImage?.image_url || imagesToSearch[0]?.image_url || null;
        
        return getStorageUrl(imageUrl);
    }, [getStorageUrl]);

    // --- Status Update Handler ---
    const handleStatusUpdate = async (newStatus: string) => {
        if (!orderId || !order) return;

        // CRITICAL FRONTEND BLOCK: Check for Delivered AND Paid
        if (order.is_delivered && order.is_paid) {
            setShowDeliveredBlockModal(true); 
            return;
        }

        if (newStatus === 'Cancelled') {
            setShowCancelModal(true); 
            return; 
        }
        
        setStatusUpdating(true);
        try {
            await updateOrderStatus(orderId, newStatus);
            await loadOrder(); 
        } catch (err: any) {
            alert(err.message || 'Failed to update order status.');
        } finally {
            setStatusUpdating(false);
        }
    };
    
    // --- New Payment Update Handler ---
    const handlePaymentUpdate = useCallback(async () => {
        if (!orderId) throw new Error("Order ID is missing.");
        await updatePaymentStatus(orderId);
        await loadOrder(); 
    }, [orderId, updatePaymentStatus, loadOrder]);

    // --- Cancellation Submission Handler (Called by CancelOrderModal) ---
    const handleCancelSubmit = async (reason: string) => {
        if (!orderId) return;

        setShowCancelModal(false); 
        setStatusUpdating(true);
        
        try {
            await updateOrderStatus(orderId, 'Cancelled', reason);
            await loadOrder(); 
        } catch (err: any) {
            throw new Error(err.message || 'Failed to cancel order.');
        } finally {
            setStatusUpdating(false);
        }
    }
    
    const address = order?.address;

    if (loading) return <LoadingSpinner />;
    if (error || !order) return <div className="p-8 text-red-600">{error || "Order details not available."}</div>;

    const isStatusDropdownDisabled = order.is_cancelled || statusUpdating || (order.is_delivered && order.is_paid);
    
    // 1. Logic for Mark as Paid Button: Only show if NOT paid AND status is Delivered
    const showPaymentButton = !order.is_paid && order.status === 'Delivered';
    
    // 2. Logic for Return Stock Button: Only show if status is Cancelled
    const showReturnStockButton = order.status === 'Cancelled';


    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            
            {/* 1. Cancel Order Modal */}
            {showCancelModal && order && (
                   <CancelOrderModal 
                        orderId={order.id}
                        onClose={() => setShowCancelModal(false)}
                        onSubmit={handleCancelSubmit}
                   />
            )}
            
            {/* 2. Return Stock Modal */}
            {showReturnStockModal && order && (
                <ReturnStockModal 
                    order={order}
                    onClose={() => setShowReturnStockModal(false)}
                    onSuccess={() => {
                        setShowReturnStockModal(false);
                        loadOrder(); 
                    }}
                />
            )}

            {/* 3. Delivered Block Modal */}
            {showDeliveredBlockModal && order && (
                <DeliveredBlockModal 
                    orderId={order.id}
                    onClose={() => setShowDeliveredBlockModal(false)}
                />
            )}

            {/* 4. NEW Payment Modal */}
            {showPaymentModal && order && (
                <UpdatePaymentModal 
                    order={order}
                    onClose={() => setShowPaymentModal(false)}
                    onSubmit={handlePaymentUpdate} 
                />
            )}


            {/* Header and Status Controls */}
            <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                <h1 className="text-3xl font-bold text-slate-800 flex items-center">
                    <button onClick={() => router.back()} className="p-2 mr-3 text-slate-600 hover:text-blue-600"><FaArrowLeft /></button>
                    Order Details: {order.id.substring(0, 8).toUpperCase()}...
                </h1>
                
                <div className="flex items-center space-x-3">
                    <span className="text-lg font-semibold">Status:</span>
                    {getStatusIndicator(order.status)}
                    
                    {/* Payment Button (Only if Delivered AND NOT Paid) */}
                    {showPaymentButton && (
                        <button
                            onClick={() => setShowPaymentModal(true)}
                            className="px-4 py-2 text-sm text-green-600 bg-green-100 rounded-lg flex items-center hover:bg-green-200 transition-colors font-semibold disabled:opacity-50"
                            disabled={statusUpdating}
                        >
                            <FaDollarSign className='mr-2' /> Mark as Paid
                        </button>
                    )}

                    {/* Return Stock Button (Only if Cancelled) */}
                    {showReturnStockButton && (
                        <button
                            onClick={() => setShowReturnStockModal(true)}
                            className="px-4 py-2 text-sm text-indigo-600 bg-indigo-100 rounded-lg flex items-center hover:bg-indigo-200 transition-colors font-semibold disabled:opacity-50"
                            disabled={statusUpdating}
                        >
                            <FaWarehouse className='mr-2' /> Return Stock
                        </button>
                    )}

                    {/* Status Dropdown */}
                    <select
                        value={order.status}
                        onChange={(e) => handleStatusUpdate(e.target.value)}
                        disabled={isStatusDropdownDisabled}
                        className="py-2 pl-3 pr-8 text-sm border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="Pending Confirmation">Pending Confirmation</option>
                        <option value="Packed" disabled={order.is_cancelled}>Packed</option>
                        <option value="Shipped" disabled={order.is_cancelled}>Shipped</option>
                        <option value="Delivered" disabled={order.is_cancelled}>Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                    </select>
                    {statusUpdating && <FaSpinner className="animate-spin text-blue-500" />}
                    {isStatusDropdownDisabled && (order.is_delivered && order.is_paid) && <FaLock className="text-red-500" title="Order is final" />}
                </div>
            </div>

            {/* --- Grid Layout for Summary & Shipping --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 {/* 1. Customer & Address Card (omitted for brevity) */}
                 <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
                     <h3 className="text-lg font-semibold text-slate-700 flex items-center"><FaUser className="mr-2" /> Customer & Delivery</h3>
                     <div className="space-y-2 text-sm text-gray-600">
                         <p><strong>Customer:</strong> {order.user?.username || 'N/A'}</p>
                         <p><strong>Email:</strong> {order.user?.email || 'N/A'}</p>
                         {address && (
                             <>
                                 <hr className='my-2 border-gray-100'/>
                                 <p className='flex items-start'><FaMapMarkerAlt className="mt-1 mr-2 flex-shrink-0" /> 
                                     {address.address_line1}, {address.address_line2}
                                     <br />{address.street}
                                     <br />{address.zip_pin}
                                 </p>
                                 <p><strong>Phone:</strong> {address.phone_numbers.join(', ')}</p>
                             </>
                         )}
                     </div>
                 </div>

                 {/* 2. Financial Summary Card (omitted for brevity) */}
                 <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
                     <h3 className="text-lg font-semibold text-slate-700 flex items-center"><FaDollarSign className="mr-2" /> Financial Summary</h3>
                     <div className="space-y-2 text-sm text-gray-600">
                         <div className="flex justify-between"><span>Subtotal:</span> <span>{formatPrice(order.actual_price)}</span></div>
                         <div className="flex justify-between text-red-500"><span>Discount:</span> <span>-{formatPrice(order.discount_price)}</span></div>
                         <div className="flex justify-between border-t pt-2"><span>Shipping:</span> <span>{formatPrice(order.shipping_price)}</span></div>
                         <div className="flex justify-between text-lg font-bold text-slate-800 border-t pt-2">
                             <span>Total Payable:</span> <span>{formatPrice(order.payable_price)}</span>
                         </div>
                     </div>
                 </div>
                 
                 {/* 3. Dates & Payment Card (omitted for brevity) */}
                 <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
                     <h3 className="text-lg font-semibold text-slate-700 flex items-center"><FaCalendarAlt className="mr-2" /> Key Dates</h3>
                     <div className="space-y-2 text-sm text-gray-600">
                         <p><strong>Placed On:</strong> {formatDate(order.created_at)}</p>
                         <p><strong>Packed Date:</strong> {formatDate(order.packed_date)}</p>
                         <p><strong>Shipped Date:</strong> {formatDate(order.shipped_date)}</p>
                         <p><strong>Delivered Date:</strong> {formatDate(order.delivered_date)}</p>
                         <hr className='my-2 border-gray-100'/>
                         <p><strong>Payment Mode:</strong> {order.payment_mode}</p>
                         <p><strong>Payment Status:</strong> <span className={`font-semibold ${order.payment_status === 'Paid' ? 'text-green-500' : 'text-orange-500'}`}>{order.payment_status}</span></p>
                     </div>
                 </div>
            </div>

            {/* --- Order Items List --- */}
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-slate-700 mb-4 flex items-center"><FaBoxOpen className="mr-2" /> Ordered Items ({order.items?.length || 0})</h3>
                <div className="space-y-4">
                    {order.items?.map(item => (
                        <div key={item.id} className="flex items-center p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                            
                            {/* Image (rest of the item rendering logic is unchanged) */}
                            <div className="w-16 h-16 mr-4 flex-shrink-0">
                                {getProductImage(item) ? (
                                    <img src={getProductImage(item) || ''} alt={item.variant?.product?.prod_name || 'Product'} className="w-full h-full object-contain rounded" />
                                ) : (
                                    <FaCube className='w-full h-full text-gray-300' />
                                )}
                            </div>

                            {/* Details */}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-800 truncate">{item.variant?.product?.prod_name}</p>
                                <p className="text-xs text-gray-500">Variant: {item.variant?.variant_name || 'Base Product'}</p>
                            </div>

                            {/* Quantity */}
                            <div className="w-16 text-center text-sm font-medium text-slate-700">
                                x{item.quantity}
                            </div>

                            {/* Pricing */}
                            <div className="w-40 text-right">
                                {/* Price calculation within item uses formatPrice which handles string conversion */}
                                {item.offer_price ? (
                                    <>
                                        <p className="text-sm font-semibold text-green-600">{formatPrice(parseFloat(String(item.offer_price)) * item.quantity)}</p>
                                        <p className="text-xs text-gray-400 line-through">{formatPrice(parseFloat(String(item.actual_price)) * item.quantity)}</p>
                                    </>
                                ) : (
                                    <p className="text-sm font-semibold text-slate-700">{formatPrice(parseFloat(String(item.actual_price)) * item.quantity)}</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AdminOrderDetailPage;