/**
 * Samyak Guru — Firebase Cloud Messaging Background Service Worker
 * Handles incoming push notifications when the app/browser is in the background or closed.
 */

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Initialize Firebase with Samyak Guru Web App credentials
firebase.initializeApp({
  apiKey: "AIzaSyB5rO3Yu6CGZCLTUKRu0VOkpNEZ9adZIdo",
  authDomain: "samyak-guru.firebaseapp.com",
  projectId: "samyak-guru",
  storageBucket: "samyak-guru.firebasestorage.app",
  messagingSenderId: "198127931057",
  appId: "1:198127931057:web:203ca6c04eabc9e8e51c90",
  measurementId: "G-5FD4VZRLTM"
});

const messaging = firebase.messaging();

// Handle background messages delivered from Firebase Cloud Messaging
messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification?.title || payload.data?.title || 'Samyak Guru';
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || 'New academic notification received.',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: payload.data?.tag || 'fcm-notification',
    data: {
      url: payload.data?.url || payload.data?.action_url || '/dashboard',
    },
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click to navigate to the target deep link
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/dashboard';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          if ('navigate' in client) {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
