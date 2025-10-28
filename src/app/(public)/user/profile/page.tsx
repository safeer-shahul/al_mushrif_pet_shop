// src/app/(user-dashboard)/profile/page.tsx
'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { FaUserCircle, FaEnvelope, FaAddressBook, FaInfoCircle } from 'react-icons/fa';

const ProfilePage: React.FC = () => {
    const { user } = useAuth(); // User is guaranteed to exist due to ProtectedRoute
    
    if (!user) return null;

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 space-y-6">
            <h2 className="text-2xl font-bold text-slate-800 flex items-center border-b pb-3">
                <FaUserCircle className="mr-2 text-blue-600" /> Account Overview
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">Full Name</p>
                    <p className="font-medium text-slate-700">{user.first_name} {user.last_name}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">Username</p>
                    <p className="font-medium text-slate-700">{user.username}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium text-slate-700 flex items-center">
                        <FaEnvelope className="mr-2 w-4 h-4 text-blue-500" /> {user.email}
                    </p>
                </div>
            </div>
            
            <div className='p-3 bg-blue-50 border-l-4 border-blue-400'>
                <p className='text-sm text-blue-800 flex items-center'>
                    <FaInfoCircle className='mr-2' /> Use the sidebar to manage addresses and view your order history.
                </p>
            </div>
        </div>
    );
};

export default ProfilePage;