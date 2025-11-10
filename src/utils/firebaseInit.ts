// src/utils/firebaseInit.ts
import { initializeApp } from 'firebase/app';
import { getMessaging } from 'firebase/messaging';

// WARNING: These keys must be defined in your .env.local file with the NEXT_PUBLIC_ prefix
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

// Initialize messaging service only in the browser (client-side)
let messagingInstance = null;
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    try {
        // This is the new V9 way to get the messaging object
        messagingInstance = getMessaging(app);
    } catch (err) {
        console.error("Firebase messaging initialization failed:", err);
    }
}

export const messaging = messagingInstance;