// app/manifest.ts
import type { MetadataRoute } from 'next'
 
// 💡 CRITICAL FIX: Forces Next.js to treat this file as a static output
export const dynamic = 'force-static'; 

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Al Mushrif Admin Portal', // Full name
    short_name: 'Mushrif Admin', // Name shown under the icon
    description: 'Real-time order management dashboard.',
    start_url: '/mushrif-admin', 
    display: 'standalone', 
    background_color: '#ffffff',
    theme_color: '#0D9488', 
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}