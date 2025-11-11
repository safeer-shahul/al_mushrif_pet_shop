import type { Metadata, Viewport } from 'next'; // 💡 Import Viewport type
import { Nunito_Sans } from 'next/font/google'; 
import './globals.css';
import { Providers } from '@/app/providers'; 

const nunito = Nunito_Sans({ 
    subsets: ['latin'],
});

// =================================================================
// 1. METADATA EXPORT (Non-Viewport related)
// =================================================================

export const metadata: Metadata = {
    title: 'Al Mushrif Pet Shop | Quality Supplies & Care',
    description: 'E-commerce platform for pets and supplies in UAE.',
    
    // PWA Manifest Link
    manifest: "/manifest.json", 
    
    // Apple PWA Meta Tags (iOS "Add to Home Screen" support)
    appleWebApp: {
        capable: true, // Enables PWA functionality
        title: 'Mushrif Admin',
        statusBarStyle: 'default', 
    },
    
    // Note: viewport and themeColor are intentionally removed from here
    // and moved to the dedicated viewport export below to fix the warnings.
};

// =================================================================
// 2. VIEWPORT EXPORT (Fixes warnings and ensures mobile performance)
// =================================================================

export const viewport: Viewport = {
    // 💡 Fix: Moving themeColor to the dedicated viewport export
    themeColor: '#0D9488', 
    
    // 💡 Fix: Moving viewport settings here
    width: 'device-width', 
    initialScale: 1,
    viewportFit: 'cover', 
};

// =================================================================
// 3. ROOT LAYOUT COMPONENT
// =================================================================

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        // Use nunito.className to apply the font globally
        <html lang="en" className={nunito.className}> 
            <body className="app-font-strict"> 
                <Providers>
                    {children}
                </Providers>
            </body>
        </html>
    );
}