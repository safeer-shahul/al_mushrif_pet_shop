// src/app/user/layout.tsx ⬅️ This file replaces the previous (user-dashboard)/layout.tsx
'use client';

import React from 'react';
import { FaUserCircle, FaMapMarkerAlt, FaClipboardList, FaHeart } from 'react-icons/fa';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';

const NAV_ITEMS = [
    { name: 'My Profile', href: '/user/profile', icon: FaUserCircle },
    { name: 'My Addresses', href: '/user/addresses', icon: FaMapMarkerAlt },
    { name: 'My Orders', href: '/user/orders', icon: FaClipboardList },
    { name: 'My Wishlist', href: '/user/wishlist', icon: FaHeart },
];

export default function UserDashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const { user } = useAuth();

    // The ProtectedRoute enforces authentication for all content within /user/*
    return (
        <ProtectedRoute requireAuth={true} redirectTo="/login">
            <div className="container mx-auto px-4 py-8 min-h-screen">
                <h1 className="text-3xl font-bold text-slate-800 mb-6 border-b pb-2">
                    Welcome, {user?.first_name || user?.username || 'Customer'}
                </h1>
                
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* Sidebar (Desktop: Col 3, Mobile: Hidden) */}
                    <aside className="lg:col-span-3 hidden lg:block">
                        <nav className="bg-white p-4 rounded-xl shadow-lg border border-gray-100 space-y-2 sticky top-24">
                            {NAV_ITEMS.map((item) => {
                                // Check if the current pathname starts with the item's href
                                const isActive = pathname.startsWith(item.href);

                                return (
                                    <Link key={item.name} href={item.href} passHref>
                                        <div
                                            className={`flex items-center space-x-3 p-3 rounded-lg transition-colors cursor-pointer ${
                                                isActive
                                                    ? 'bg-blue-600 text-white font-semibold shadow-md'
                                                    : 'text-slate-700 hover:bg-gray-100'
                                            }`}
                                        >
                                            <item.icon className="w-5 h-5" />
                                            <span>{item.name}</span>
                                        </div>
                                    </Link>
                                );
                            })}
                        </nav>
                    </aside>

                    {/* Main Content Area */}
                    <main className="lg:col-span-9">
                        {children}
                    </main>
                </div>
            </div>
        </ProtectedRoute>
    );
}