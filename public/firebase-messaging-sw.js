// public/firebase-messaging-sw.js

// 1. Import Firebase Scripts (using the compat library for the SW)
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// 2. HARDCODE THE PUBLIC CONFIG (REQUIRED FOR SERVICE WORKER)
const firebaseConfig = {
  apiKey: "AIzaSyDlPJFogoAVX6qX7WE4WlMQRd0OaZfDf8A",
  authDomain: "al-mushrif-8eb5b.firebaseapp.com",
  projectId: "al-mushrif-8eb5b",
  storageBucket: "al-mushrif-8eb5b.firebasestorage.app",
  messagingSenderId: "650230842141",
  appId: "1:650230842141:web:3d97d70c92850b6b5b57f4"
};

// 3. Initialize App and Messaging
firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// 4. Background Message Handler (Displays Notification)
messaging.onBackgroundMessage((payload) => {
    console.log('[SW] Received background message:', payload);
    const { title, body } = payload.notification;
    const { order_id } = payload.data;

    const notificationOptions = {
        body: body,
        icon: '/favicon.ico',
        data: {
            url: `/mushrif-admin/orders/${order_id}`
        }
    };

    self.registration.showNotification(title, notificationOptions);
});

// 5. Handle Notification Click
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const url = event.notification.data.url || '/mushrif-admin';

    // Open the window to the order page
    event.waitUntil(
        clients.openWindow(url)
    );
});