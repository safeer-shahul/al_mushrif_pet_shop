// src/app/(user-dashboard)/orders/page.tsx
import React from 'react';
import { FaClipboardList } from 'react-icons/fa';

const OrdersHistoryPage: React.FC = () => {
    // NOTE: This page needs a service call to GET /api/user/orders
    return (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 space-y-4">
            <h2 className="text-2xl font-bold text-slate-800 flex items-center border-b pb-3">
                <FaClipboardList className="mr-2 text-blue-600" /> Order History
            </h2>
            
            <p className="text-gray-600">
                List of past orders and their status will be displayed here. (Coming Soon)
            </p>
        </div>
    );
};

export default OrdersHistoryPage;