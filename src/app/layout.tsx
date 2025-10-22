// src/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/app/providers'; 

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'Al Mushrif Pet Shop | Quality Supplies & Care',
    description: 'E-commerce platform for pets and supplies in UAE.',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className={inter.className}>
                <Providers>
                    {children}
                </Providers>
            </body>
        </html>
    );
}