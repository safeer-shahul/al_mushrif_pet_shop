// src/app/(public)/layout.tsx
import React from 'react';
import Header from '@/components/public/Header'; 
import Footer from '@/components/public/Footer'; // 💡 NEW IMPORT

/**
 * Public Layout: Applied to all customer-facing routes (homepage, login, etc.).
 */
export default function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen flex flex-col">
            {/* The Header component manages Marquee, Nav, and Modals */}
            <Header /> 
            
            {/* Main Content Area */}
            <main className="flex-1">
                {children}
            </main>

            {/* Footer Component */}
            <Footer />
        </div>
    );
}