'use client';

/**
 * Samyak Guru — Native Device Notification & Audio Alert Utility
 * Triggers instant native OS notifications on Windows, macOS, Android, and iOS,
 * accompanied by a gentle synthesized chime sound via Web Audio API.
 */

export function playNotificationChime(): void {
  try {
    if (typeof window === 'undefined') return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // First tone (E5: 659.25 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0.2, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.3);

    // Second harmonic tone (B5: 987.77 Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(987.77, now + 0.12);
    gain2.gain.setValueAtTime(0.25, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.6);
  } catch (err) {
    // AudioContext blocked if no user interaction yet
  }
}

export interface TriggerDeviceNotificationOptions {
  title: string;
  body: string;
  actionUrl?: string;
  tag?: string;
}

/**
 * Checks the current browser notification permission status.
 */
export function getNotificationPermissionStatus(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

/**
 * Requests native browser notification permission.
 */
export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  try {
    return await Notification.requestPermission();
  } catch (err) {
    console.error('[Notification] Permission request error:', err);
    return Notification.permission;
  }
}

/**
 * Fires a native OS notification banner on Windows, Mac, or Android.
 * Never hangs on service worker promises.
 */
export async function triggerDeviceNotification(
  options: TriggerDeviceNotificationOptions
): Promise<{ success: boolean; reason?: string }> {
  // 1. Play audio chime alert
  playNotificationChime();

  if (typeof window === 'undefined' || !('Notification' in window)) {
    return { success: false, reason: 'unsupported' };
  }

  // 2. Check and request permission if default
  let perm = Notification.permission;
  if (perm === 'default') {
    try {
      perm = await Notification.requestPermission();
    } catch {
      perm = Notification.permission;
    }
  }

  if (perm === 'denied') {
    return { success: false, reason: 'denied' };
  }

  if (perm !== 'granted') {
    return { success: false, reason: 'not_granted' };
  }

  const { title, body, actionUrl, tag } = options;

  // 3. Try standard window Notification first (instant on Windows, macOS, Linux, Firefox, Edge)
  try {
    const notif = new Notification(title, {
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: tag || 'samyak-alert',
    });

    notif.onclick = () => {
      window.focus();
      if (actionUrl) {
        window.location.href = actionUrl;
      }
      notif.close();
    };

    return { success: true };
  } catch (desktopErr) {
    // 4. Android Chrome throws 'Illegal constructor' and requires ServiceWorker showNotification
    if ('serviceWorker' in navigator) {
      try {
        const reg = (await navigator.serviceWorker.getRegistration()) || (await navigator.serviceWorker.ready);
        if (reg && reg.showNotification) {
          await reg.showNotification(title, {
            body,
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            tag: tag || 'samyak-alert',
            data: { url: actionUrl || '/' },
          });
          return { success: true };
        }
      } catch (swErr) {
        console.warn('[Notification] ServiceWorker fallback failed:', swErr);
      }
    }
    return { success: false, reason: String(desktopErr) };
  }
}
