import type { Metadata } from 'next';
import { Nunito_Sans } from 'next/font/google'; 
import './globals.css';
import { Providers } from '@/app/providers'; 

const nunito = Nunito_Sans({ 
    subsets: ['latin'],
});

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
        <html lang="en" className="app-font-strict"> 
            <body > 
                <Providers>
                    {children}
                </Providers>
            </body>
        </html>
    );
}