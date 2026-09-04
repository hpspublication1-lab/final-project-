'use client';

function getOrCreateAnonId(): string {
  if (typeof window === 'undefined') return '';
  let anonId = localStorage.getItem('sc_anon_id');
  if (!anonId) {
    anonId = 'anon_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    try {
      localStorage.setItem('sc_anon_id', anonId);
    } catch (_) {}
  }
  return anonId;
}

export function captureUtmParams(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const params = new URLSearchParams(window.location.search);
  const utms: Record<string, string> = {};

  const keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
  keys.forEach((key) => {
    const val = params.get(key);
    if (val) {
      utms[key] = val;
      try {
        sessionStorage.setItem(`sc_${key}`, val);
      } catch (_) {}
    } else {
      try {
        const stored = sessionStorage.getItem(`sc_${key}`);
        if (stored) utms[key] = stored;
      } catch (_) {}
    }
  });

  return utms;
}

export async function trackEvent(eventType: string, metadata: Record<string, any> = {}): Promise<void> {
  if (typeof window === 'undefined') return;

  const anonId = getOrCreateAnonId();
  const utms = captureUtmParams();
  const leadEmail = localStorage.getItem('sc_lead_email') || null;

  const payload = {
    anonymous_id: anonId,
    lead_email: leadEmail,
    event_type: eventType,
    url: window.location.href,
    referrer: document.referrer || null,
    metadata: {
      ...metadata,
      ...utms,
      screen_width: window.innerWidth,
      timestamp: new Date().toISOString(),
    },
  };

  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      navigator.sendBeacon('/api/events/track', blob);
    } else {
      fetch('/api/events/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {});
    }
  } catch (_) {}
}

export function trackCourseView(courseSlug: string, courseName?: string) {
  trackEvent('course_page_view', { courseSlug, courseName });
}

export function trackPricingView(planId?: string) {
  trackEvent('pricing_view', { planId });
}

export function trackCheckoutStarted(planId: string, amount: number) {
  trackEvent('checkout_started', { planId, amount });
}

export function trackPaymentInitiated(gateway: string, amount: number) {
  trackEvent('payment_initiated', { gateway, amount });
}

export function trackPdfDownload(leadMagnet: string = '500_cee_biology_mcqs') {
  trackEvent('pdf_download', { leadMagnet });
}
