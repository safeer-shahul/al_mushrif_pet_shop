// app/providers.tsx
'use client';

import React from 'react';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { ModalProvider } from '@/context/ModalContext';


export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ModalProvider>
            <AuthProvider>
                <CartProvider>
                    {children}
                </CartProvider>
            </AuthProvider>
        </ModalProvider>
    );
}