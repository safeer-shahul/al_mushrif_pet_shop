// src/app/layout.tsx

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/app/providers'; // Corrected path/alias

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'al_mushrif_pet_shop',
  description: 'E-commerce platform for pets and supplies.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* Wrap children with Providers to give global access to AuthContext */}
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}