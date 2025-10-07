// app/providers.tsx
'use client';

import React from 'react';
import { AuthProvider } from '@/context/AuthContext';

// Add other providers here later (e.g., CartProvider, ThemeProvider)

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {/* <CartProvider> */}
        {children}
      {/* </CartProvider> */}
    </AuthProvider>
  );
}