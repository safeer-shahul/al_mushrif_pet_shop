// src/hooks/useAdminFCM.ts
import { useEffect } from 'react';
import { messaging } from '@/utils/firebaseInit';
import { getToken, onMessage } from 'firebase/messaging';

const ADMIN_TOPIC = 'admin_orders';

export const useAdminFCM = () => {
    useEffect(() => {
        // Exit if not running client-side or if messaging service isn't ready
        if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
            return;
        }

        const setupFCM = async () => {
            // Type Guard - Check if messaging is NOT null before proceeding
            if (!messaging) {
                console.warn("Firebase Messaging is not initialized (likely due to SSR/environment issue).");
                return;
            }

            // 1. Request Notification Permission
            const permission = await Notification.requestPermission();

            if (permission !== 'granted') {
                console.warn('Notification permission denied. Cannot receive push notifications.');
                return;
            }

            console.log('Notification permission granted.');

            // 2. Register Service Worker
            try {
                await navigator.serviceWorker.register('/firebase-messaging-sw.js');
            } catch (err) {
                console.error('Service Worker registration failed:', err);
                return;
            }

            // 3. Get FCM Token
            try {
                const currentToken = await getToken(messaging, {
                    vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
                });

                if (currentToken) {
                    console.log('FCM Token generated:', currentToken);
                } else {
                    console.warn('No registration token available.');
                }
            } catch (err) {
                console.error('Error retrieving FCM token:', err);
            }
        };

        setupFCM();

        // 4. Handle Foreground Messages (Requires non-null messaging instance)
        if (messaging) {
            const unsubscribe = onMessage(messaging, (payload) => {
                console.log('Foreground message received:', payload);
                // Handle in-app alert here
            });
            return () => {
                // Cleanup the foreground listener on unmount
                unsubscribe();
            };
        }


    }, []);
};