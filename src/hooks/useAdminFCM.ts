// src/hooks/useAdminFCM.ts
'use client';

import { useEffect } from 'react';
import { messaging } from '@/utils/firebaseInit';
import { getToken, onMessage, Messaging } from 'firebase/messaging';
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

        const setupFCM = async (msgInstance: Messaging) => {

            // 1. Request Notification Permission
            const permission = await Notification.requestPermission();

            if (permission !== 'granted') {
                console.warn('Notification permission denied. Cannot receive push notifications.');
                return;
            }

            console.log('Notification permission granted.');

            // 2. Register Service Worker (must be done before getToken)
            try {
                await navigator.serviceWorker.register('/firebase-messaging-sw.js');
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

        // 💡 CRITICAL FIX: Only run setupFCM if 'messaging' is not null
        if (messaging) {
            setupFCM(messaging as Messaging);

            // 5. Handle Foreground Messages
            const unsubscribe = onMessage(messaging, (payload) => {
                console.log('Foreground message received:', payload);
                // Handle in-app alert or toast notification here
            });

            return () => {
                // Cleanup listener on component unmount
                unsubscribe();
            };
        }

        // Return a cleanup function for when messaging is null
        return () => { };

    }, [token]);
};