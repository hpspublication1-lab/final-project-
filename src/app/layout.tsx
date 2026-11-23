import React from 'react';
import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import '../styles/tailwind.css';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import { TrialProvider } from '@/contexts/TrialContext';
import AnimatePresenceProvider from '@/components/AnimatePresenceProvider';
import AnalyticsProvider from '@/components/AnalyticsProvider';
import TrialBannerAndModals from '@/components/TrialBannerAndModals';
import ServiceWorkerRegister from '@/components/pwa/ServiceWorkerRegister';
import GhostViewBanner from '@/components/admin/GhostViewBanner';
import { getOrganizationSchema, getWebSiteSchema } from '@/lib/seo/structuredData';

/**
 * Fonts are self-hosted from `src/app/fonts/` via next/font/local.
 *
 * They were briefly loaded with `@import url(fonts.googleapis.com)` in
 * tailwind.css so the build would not need the network. That fixed CI at the
 * cost of production: an @import is discovered only after the stylesheet is
 * parsed, so the browser made three serial round trips (CSS -> Google CSS ->
 * gstatic font) before text rendered in the right face, and the automatic
 * fallback metrics that prevent reflow were lost. It also sat after the
 * @tailwind directives, where CSS requires imports to come first.
 *
 * Local files give both: no network at build time, and a font served from our
 * own origin with preloading and size-adjusted fallbacks.
 *
 * The Jakarta file is variable, so one 27KB download covers every weight.
 */
const plusJakartaSans = localFont({
  src: './fonts/plus-jakarta-sans-latin-wght-normal.woff2',
  weight: '200 800',
  display: 'swap',
  variable: '--font-jakarta',
  fallback: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
});

const ibmPlexMono = localFont({
  src: [
    { path: './fonts/ibm-plex-mono-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: './fonts/ibm-plex-mono-latin-500-normal.woff2', weight: '500', style: 'normal' },
    { path: './fonts/ibm-plex-mono-latin-600-normal.woff2', weight: '600', style: 'normal' },
  ],
  display: 'swap',
  variable: '--font-plex-mono',
  fallback: ['Menlo', 'Monaco', 'Consolas', 'monospace'],
});

// Inline script to apply dark mode from localStorage BEFORE first paint (prevents FOUC)
const DARK_MODE_SCRIPT = `(function(){try{var d=document.documentElement;var t=localStorage.getItem('samyak-theme');if(t==='dark'||(t==null&&window.matchMedia('(prefers-color-scheme:dark)').matches)){d.classList.add('dark')}}catch(e){}})();`;

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#5A45E8',
};

function getMetadataBase(): URL {
  const url = process.env.NEXT_PUBLIC_SITE_URL;
  if (url && url !== '[SENSITIVE]') {
    try {
      return new URL(url);
    } catch {
      // Ignore invalid URL
    }
  }
  return new URL('http://localhost:4028');
}

export const metadata: Metadata = {
  metadataBase: new URL('https://samyakcee.com'),
  title: 'Samyak CEE — Nepal\'s Premier Medical & Entrance Examination Platform',
  description:
    'Master Nepal\'s CEE (MBBS/BDS), SEE Class 10, and Board Exams. Authentic 200-question timed CBT simulation with -0.25 negative marking, 15,000+ verified MCQs, and 24/7 AI-guided mastery.',
  keywords: [
    'Samyak CEE',
    'CEE Medical Entrance Preparation Nepal',
    'MECEE MBBS BDS Nursing',
    'SEE Class 10 Online Classes',
    'IOE Engineering Entrance Nepal',
    '200Q CBT Mock Exam Nepal',
    'MEC Entrance Exam Nepal',
  ],
  authors: [{ name: 'Samyak CEE Team', url: 'https://samyakcee.com' }],
  creator: 'Samyak CEE',
  publisher: 'Samyak CEE',
  manifest: '/manifest.json',
  icons: {
    icon: [{ url: '/favicon.ico', type: 'image/x-icon' }],
    apple: '/assets/images/app_logo.png',
  },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://samyakcee.com',
    siteName: 'Samyak CEE — Medical & Entrance Examination Platform',
    title: 'Samyak CEE — Nepal\'s Premier Medical & Entrance Examination Platform',
    description:
      'Authentic 200-question timed CBT simulation with -0.25 negative marking, 15,000+ verified MCQs, and 24/7 AI-guided mastery.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Samyak CEE — Medical & Entrance Examination Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Samyak CEE — Nepal\'s Premier Medical & Entrance Examination Platform',
    description:
      'Authentic 200-question timed CBT simulation with -0.25 negative marking, 15,000+ verified MCQs, and 24/7 AI-guided mastery.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

import { ProgramProvider } from '@/contexts/ProgramContext';

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${plusJakartaSans.variable} ${ibmPlexMono.variable}`} suppressHydrationWarning>
      <head>
        {/* Apply dark mode before paint to prevent flash */}
        <script dangerouslySetInnerHTML={{ __html: DARK_MODE_SCRIPT }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([getOrganizationSchema(), getWebSiteSchema()]),
          }}
        />
      </head>
      <body className={plusJakartaSans.className}>
        {/* Skip to main content link for keyboard/screen-reader users */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-xl focus:text-sm focus:font-bold focus:shadow-lg"
        >
          Skip to main content
        </a>
        <AuthProvider>
          <TrialProvider>
            <ProgramProvider>
              <AnimatePresenceProvider>
                <AnalyticsProvider>
                  <ServiceWorkerRegister />
                  <GhostViewBanner />
                  <TrialBannerAndModals />
                  {children}
                </AnalyticsProvider>
              </AnimatePresenceProvider>
            </ProgramProvider>
          </TrialProvider>
        </AuthProvider>

        <Toaster
          position="bottom-right"
          richColors
          toastOptions={{
            style: {
              fontFamily: 'var(--font-plus-jakarta-sans)',
              borderRadius: '10px',
              fontSize: '14px',
            },
          }}
        />
      </body>
    </html>
  );
}