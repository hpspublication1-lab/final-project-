'use client';

import { useEffect } from 'react';

/**
 * ServiceWorkerRegister
 * Proactively registers /sw.js in production environments to enable
 * offline asset caching, fast PWA launches, and low-connectivity resiliency.
 */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator
    ) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            // Check for updates periodically
            registration.onupdatefound = () => {
              const installingWorker = registration.installing;
              if (installingWorker) {
                installingWorker.onstatechange = () => {
                  if (
                    installingWorker.state === 'installed' &&
                    navigator.serviceWorker.controller
                  ) {
                    console.info('[PWA] New version available in background.');
                  }
                };
              }
            };
          })
          .catch((err) => {
            console.debug('[PWA] Service worker registration ignored:', err);
          });
      });
    }
  }, []);

  return null;
}
