'use client';

import React from 'react';
import { FaUserCircle, FaMapMarkerAlt, FaClipboardList, FaHeart } from 'react-icons/fa';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';

// Define the primary color variable for easy styling consistency
const PRIMARY_COLOR = 'var(--color-primary, #FF6B35)';

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
                
                {/* Branded Welcome Header */}
                <h1 className="text-2xl font-extrabold text-slate-800 mb-2 pb-2" style={{ color: PRIMARY_COLOR }}>
                    Hello, {user?.first_name || user?.username || 'Customer'} 
                </h1>
                
                {/* Mobile Navigation (Scrollable Tab Bar) */}
                <nav className="lg:hidden mb-6 overflow-x-auto whitespace-nowrap border-b border-gray-200 shadow-sm bg-white rounded-lg">
                    <div className="flex space-x-2 p-2">
                        {NAV_ITEMS.map((item) => {
                            const isActive = pathname.startsWith(item.href);

                            return (
                                <Link key={item.name} href={item.href} passHref>
                                    <div
                                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors cursor-pointer text-sm font-semibold flex-shrink-0 ${
                                            isActive
                                                ? 'text-white shadow-md'
                                                : 'text-slate-700 hover:bg-gray-100'
                                        }`}
                                        style={{ 
                                            backgroundColor: isActive ? PRIMARY_COLOR : 'transparent',
                                            color: isActive ? 'white' : 'var(--color-text-default, #334155)',
                                        }}
                                    >
                                        <item.icon className="w-4 h-4" />
                                        <span>{item.name}</span>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </nav>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* Sidebar (Desktop) */}
                    <aside className="lg:col-span-3 hidden lg:block">
                        <nav className="bg-white p-5 rounded-xl shadow-2xl border border-gray-100 space-y-3 sticky top-24">
                            {NAV_ITEMS.map((item) => {
                                const isActive = pathname.startsWith(item.href);

                                return (
                                    <Link key={item.name} href={item.href} passHref>
                                        <div
                                            className={`flex items-center space-x-3 p-4 rounded-xl transition-all cursor-pointer ${
                                                isActive
                                                    ? 'text-white font-bold shadow-lg'
                                                    : 'text-slate-700 hover:bg-gray-100 hover:text-slate-900 font-medium'
                                            }`}
                                            style={{ 
                                                backgroundColor: isActive ? PRIMARY_COLOR : 'transparent',
                                                color: isActive ? 'white' : 'inherit',
                                            }}
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