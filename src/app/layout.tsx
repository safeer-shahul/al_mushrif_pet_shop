import type { Metadata } from 'next';
import { Nunito_Sans } from 'next/font/google'; // 💡 Import the font
import './globals.css';
import { Providers } from '@/app/providers'; 

// 💡 Define the font without the 'variable' property, as we won't use it directly
const nunito = Nunito_Sans({ 
    subsets: ['latin'],
    // We can still define the variable for CSS use, but the simpler option is just to load it:
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
        // 💡 FIX 1: Apply a custom, strict CSS class to the HTML tag
        <html lang="en" className="app-font-strict"> 
            {/* We apply NO font utility classes here. */}
            <body > 
                <Providers>
                    {children}
                </Providers>
            </body>
        </html>
    );
}