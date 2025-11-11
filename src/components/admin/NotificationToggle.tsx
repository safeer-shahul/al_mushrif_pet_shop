'use client';

import React, { useState, useEffect } from 'react';
import { FaBell, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
// Ensure these imports are correctly set up based on your project structure
import { messaging } from '@/utils/firebaseInit'; 
import { getToken } from 'firebase/messaging';
import { useAuth } from '@/context/AuthContext';
import { createAuthenticatedClient } from '@/utils/ApiClient';

const ADMIN_TOPIC = 'admin_orders';
const FCM_SAVE_ENDPOINT = '/admin/fcm/save-token'; 

// Utility function to handle the token subscription on the backend
const sendTokenToServer = async (token: string, authToken: string) => {
    try {
        const api = createAuthenticatedClient(authToken); 
        await api.post(FCM_SAVE_ENDPOINT, {
            fcm_token: token,
            topic: ADMIN_TOPIC
        });
        return { success: true };
    } catch (error) {
        console.error('Failed to save/subscribe FCM token to server:', error);
        return { success: false, error: 'Server error during subscription.' };
    }
};


const NotificationToggle: React.FC = () => {
    const { token } = useAuth();
    
    // State to track the status of the browser permission
    const [status, setStatus] = useState<'default' | 'granted' | 'denied' | 'unsupported'>('default');
    const [isProcessing, setIsProcessing] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (typeof window === 'undefined') return;

        if (!('Notification' in window)) {
            setStatus('unsupported');
            setMessage('Notifications are not supported by this browser.');
            return;
        }

        // Check current permission state on mount
        const currentStatus = Notification.permission;
        setStatus(currentStatus as 'granted' | 'denied');
        if (currentStatus === 'granted') {
            setMessage('Real-time order notifications are ENABLED.');
        } else if (currentStatus === 'denied') {
            setMessage('Notifications are BLOCKED by the browser. Please reset manually.');
        } else {
            setMessage('Click to activate order notifications.');
        }
    }, []);

    const handleActivate = async () => {
        // Prevent action if already processing, granted, unsupported, or missing dependencies
        if (status === 'granted' || isProcessing || status === 'unsupported' || !messaging || !token) return;

        setIsProcessing(true);
        setMessage('Requesting permission...');

        try {
            // 1. Request Permission (requires user interaction)
            const permission = await Notification.requestPermission();
            setStatus(permission as 'granted' | 'denied');

            if (permission === 'granted') {
                setMessage('Permission granted. Subscribing device...');
                
                // 2. Get Token (only runs if messaging is non-null, checked above)
                const vapidKeyString = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
                if (!vapidKeyString) throw new Error("VAPID Key missing.");

                const currentToken = await getToken(messaging, { 
                    vapidKey: vapidKeyString 
                });

                if (currentToken) {
                    // 3. Send to Server for Subscription
                    const result = await sendTokenToServer(currentToken, token);
                    if (result.success) {
                        setMessage('✅ Notifications activated successfully!');
                    } else {
                         setMessage('Subscription failed on server, check logs.');
                    }
                } else {
                    setMessage('Failed to get FCM token. Retrying...');
                }

            } else {
                setMessage('Permission DENIED. Please refresh and try again.');
            }
        } catch (error) {
            setMessage('Activation failed: Check console for errors.');
            console.error("Notification activation handler failed:", error);
        } finally {
            setIsProcessing(false);
        }
    };

    const isButtonDisabled = status === 'denied' || status === 'granted' || isProcessing || status === 'unsupported';

    const getButtonStyles = () => {
        switch (status) {
            case 'granted': return 'bg-green-500 hover:bg-green-600';
            case 'denied': return 'bg-gray-400 cursor-not-allowed';
            case 'unsupported': return 'bg-red-500 cursor-not-allowed';
            default: return 'bg-primary hover:bg-blue-600';
        }
    };

    const getIcon = () => {
        if (status === 'granted') return <FaCheckCircle className="mr-2" />;
        if (status === 'denied' || status === 'unsupported') return <FaExclamationTriangle className="mr-2" />;
        return <FaBell className="mr-2" />;
    };

    return (
        <div className="flex flex-col items-start space-y-3 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                {getIcon()}
                Order Notification Status
            </h3>
            
            {status !== 'unsupported' && (
                <button
                    onClick={handleActivate}
                    disabled={isButtonDisabled}
                    className={`
                        w-full sm:w-auto px-4 py-2 text-white font-medium rounded-lg transition-colors
                        ${getButtonStyles()}
                        ${isProcessing ? 'opacity-70' : ''}
                    `}
                >
                    {isProcessing ? 'Processing...' : status === 'granted' ? 'Notifications Enabled' : 'Activate Notifications'}
                </button>
            )}

            <p className={`text-sm ${status === 'denied' ? 'text-red-600' : status === 'granted' ? 'text-green-700' : 'text-gray-600'}`}>
                {message}
            </p>

            {status !== 'granted' && (
                <p className="text-xs text-gray-500 italic">
                    Note: On iPhone/iPad, you must first use the Share icon (↗) and select "Add to Home Screen" for the prompt to appear.
                </p>
            )}
        </div>
    );
};

export default NotificationToggle;