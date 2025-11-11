// src/hooks/useAdminFCM.ts
'use client';

import { useEffect } from 'react';
import { messaging } from '@/utils/firebaseInit';
// NOTE: We import the specific types needed from firebase/messaging
import { getToken, Messaging } from 'firebase/messaging'; 
import { createAuthenticatedClient } from '@/utils/ApiClient';
import { useAuth } from '@/context/AuthContext';


const ADMIN_TOPIC = 'admin_orders';
const FCM_SAVE_ENDPOINT = '/admin/fcm/save-token';

export const useAdminFCM = () => {
    const { token } = useAuth(); // Authentication token for the API call

    // Function to send the generated token to the Laravel API for subscription
    const sendTokenToServer = async (currentToken: string) => {
        if (!token) {
            console.error("Cannot send FCM token: User not authenticated.");
            return;
        }

        // Use the authenticated client for the /admin route
        const api = createAuthenticatedClient(token);

        try {
            // This API call triggers the Laravel AdminFCMController to subscribe the token to the topic
            await api.post(FCM_SAVE_ENDPOINT, {
                fcm_token: currentToken,
                topic: ADMIN_TOPIC
            });
            console.log('✅ FCM token saved and subscribed on server.');
        } catch (error) {
            console.error('Failed to save/subscribe FCM token to server:', error);
        }
    };

    useEffect(() => {
        // Exit early if client-side environment checks fail or user token is missing
        if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !token) {
            return;
        }

        // We wrap the main logic in a named function to use the non-null Messaging type
        const setupFCM = async (msgInstance: Messaging) => {

            // 1. Check existing permission status
            const permission = Notification.permission;
            
            // If already granted, we need to register the SW and get the token again
            // (The NotificationToggle button handles the requestPermission prompt)
            if (permission !== 'granted') {
                console.warn('FCM setup skipped: Permission not granted yet.');
                return;
            }

            // 2. Register Service Worker (must be done before getToken)
            try {
                // Ensure the worker is registered
                await navigator.serviceWorker.register('/firebase-messaging-sw.js');
                console.log('Service Worker registered.');
            } catch (err) {
                console.error('Service Worker registration failed:', err);
                return;
            }

            // 3. Get FCM Token
            try {
                const vapidKeyString = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
                if (!vapidKeyString) {
                    console.error("VAPID Key missing from environment. Check .env.local.");
                    return;
                }

                // Call getToken using the validated Messaging instance
                const currentToken = await getToken(msgInstance, {
                    vapidKey: vapidKeyString
                });

                if (currentToken) {
                    console.log('FCM Token generated:', currentToken);

                    // 4. Send token to Laravel API for persistence and subscription
                    await sendTokenToServer(currentToken);

                } else {
                    console.warn('No registration token available.');
                }
            } catch (err) {
                console.error('Error retrieving FCM token:', err);
            }
        };

        // 💡 CRITICAL FIX: Only execute setupFCM if 'messaging' is not null
        if (messaging) {
            // Pass the messaging instance with type assertion to satisfy TypeScript
            setupFCM(messaging as Messaging);
        }

        // 5. Cleanup: We must not have an onMessage listener here, as the Service Worker handles 
        // the notification display, resolving the double notification issue.
        return () => { };

    }, [token]); 
};