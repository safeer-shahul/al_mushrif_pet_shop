// app/providers.tsx
'use client';

import React from 'react';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext'; // NEW IMPORT

// Add other providers here later (e.g., ThemeProvider)

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        // AuthProvider is usually the outermost as Cart logic relies on user authentication status
        <AuthProvider>
            <CartProvider> {/* WRAP CHILDREN WITH CARTPROVIDER */}
                {children}
            </CartProvider>
        </AuthProvider>
    );
}