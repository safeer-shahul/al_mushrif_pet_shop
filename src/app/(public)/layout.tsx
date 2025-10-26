// src/app/(public)/layout.tsx
import React from 'react';
import Header from '@/components/public/Header'; 
import MarqueeBar from '@/components/public/MarqueeBar'; // Assuming this is also used within the header

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

            {/* Footer Placeholder */}
            <footer className="w-full bg-slate-800 text-white p-8 mt-12 text-center text-sm">
                &copy; {new Date().getFullYear()} Al Mushrif Pet Shop. All rights reserved.
            </footer>
        </div>
    );
}