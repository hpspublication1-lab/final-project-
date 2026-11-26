'use client';

import { firebaseConfig } from './config';

declare global {
  interface Window {
    firebase?: any;
    __fcmLoaded?: boolean;
  }
}

/**
 * Dynamically loads official Firebase Web SDK scripts from Google CDN.
 */
async function loadFirebaseScripts(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (window.firebase?.messaging) return true;

  const loadScript = (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.head.appendChild(script);
    });
  };

  try {
    await loadScript('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
    await loadScript('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

    if (window.firebase && !window.firebase.apps?.length) {
      window.firebase.initializeApp(firebaseConfig);
    }
    return true;
  } catch (err) {
    console.warn('[FCM] Failed to load Firebase CDN scripts:', err);
    return false;
  }
}

/**
 * Requests device notification permission and registers with Firebase Cloud Messaging (FCM).
 * Returns the device registration token if successful.
 */
export async function registerFCMDevice(vapidKey?: string): Promise<string | null> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    console.warn('[FCM] Notifications are not supported in this environment.');
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('[FCM] Notification permission was not granted:', permission);
      return null;
    }

    // 1. Register Firebase messaging service worker
    let swReg: ServiceWorkerRegistration | undefined;
    if ('serviceWorker' in navigator) {
      try {
        swReg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        await navigator.serviceWorker.ready;
      } catch (swErr) {
        console.warn('[FCM] Service worker registration notice:', swErr);
      }
    }

    // 2. Load Firebase scripts
    const loaded = await loadFirebaseScripts();
    if (!loaded || !window.firebase?.messaging) {
      return null;
    }

    const messaging = window.firebase.messaging();

    // 3. Get FCM registration token
    const tokenOptions: any = {};
    if (vapidKey) tokenOptions.vapidKey = vapidKey;
    if (swReg) tokenOptions.serviceWorkerRegistration = swReg;

    const token = await messaging.getToken(tokenOptions);

    if (token) {
      // 4. Save device token locally and register with backend
      try {
        localStorage.setItem('samyak_fcm_token', token);
      } catch {}

      try {
        await fetch('/api/notifications/fcm-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, userAgent: navigator.userAgent }),
        });
      } catch (syncErr) {
        console.warn('[FCM] Failed to sync token with backend API:', syncErr);
      }
    }

    return token || null;
  } catch (err) {
    console.error('[FCM] Error registering FCM device:', err);
    return null;
  }
}

/**
 * Subscribes to foreground push notifications from Firebase.
 */
export function onFCMForegroundMessage(callback: (payload: any) => void): (() => void) | null {
  if (typeof window === 'undefined' || !window.firebase?.messaging) {
    return null;
  }

  try {
    const messaging = window.firebase.messaging();
    return messaging.onMessage((payload: any) => {
      callback(payload);
    });
  } catch (err) {
    console.warn('[FCM] Failed to bind foreground message listener:', err);
    return null;
  }
}
