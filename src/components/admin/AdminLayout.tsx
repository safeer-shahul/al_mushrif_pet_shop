// src/components/admin/AdminLayout.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import { useAdminFCM } from '@/hooks/useAdminFCM';

const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // 💡 CALL THE HOOK HERE - This sets up FCM immediately when the layout loads
    useAdminFCM();

    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [isMobile, setIsMobile] = useState(false);
    const pathname = usePathname();

    // Check if we're on mobile
    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth < 1024;
            setIsMobile(mobile);
            // Auto collapse on mobile
            if (mobile) setSidebarOpen(false);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Close sidebar on mobile when route changes
    useEffect(() => {
        if (isMobile) setSidebarOpen(false);
    }, [pathname, isMobile]);

    return (
        // FIX 1: Remove h-screen and overflow-hidden here. Let the body/browser scroll.
        // We use min-h-screen to ensure the background covers the content.
        <div className="flex min-h-screen bg-gray-100"> 
            {/* Mobile Overlay - appears when sidebar is open on mobile */}
            {isMobile && sidebarOpen && (
                <div
                    className="fixed inset-0 z-20 bg-black/50 transition-opacity"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar - absolute position on mobile, fixed on desktop */}
            <AdminSidebar
                isOpen={sidebarOpen}
                toggle={() => setSidebarOpen(!sidebarOpen)}
                isMobile={isMobile}
            />

            {/* Main Content Area - always takes full screen width on mobile */}
            <div
                className={`
                     flex flex-col flex-1 transition-all duration-300 ease-in-out 
                     ${isMobile ? 'w-full' : (sidebarOpen ? 'lg:ml-64' : 'lg:ml-20')}
                `}
            >
                {/* Header */}
                <AdminHeader
                    sidebarOpen={sidebarOpen}
                    toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                    isMobile={isMobile}
                />

                {/* FIX 2: Remove flex-1 and overflow-auto from main. 
                    The content will push the height, and the outer div (or browser window) 
                    will handle scrolling. This eliminates the double scroll issue. */}
                <main className="p-6 pb-24">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;