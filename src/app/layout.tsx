import React from 'react';
import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans, IBM_Plex_Mono } from 'next/font/google';
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

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-plus-jakarta-sans',
  display: 'swap',
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-ibm-plex-mono',
  display: 'swap',
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
  title: 'Samyak Tutor — Learn Smarter. Score Higher.',
  description:
    'Samyak Tutor is a unified education platform. Courses, practice questions, mock tests, chapter notes, and 24/7 AI-powered learning — all in one place.',
  keywords: [
    'Samyak Tutor',
    'Samyak Education',
    'CEE Medical Entrance Preparation Nepal',
    'SEE Class 10 Online Classes',
    'IELTS Preparation Nepal',
    'Digital Marketing Course Nepal',
    'AI Education Platform Nepal',
    'MEC Entrance Exam',
  ],
  authors: [{ name: 'Samyak Tutor Team', url: 'https://samyakcee.com' }],
  creator: 'Samyak Tutor',
  publisher: 'Samyak Tutor',
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
    siteName: 'Samyak Tutor — Education Platform',
    title: 'Samyak Tutor — Learn Smarter. Score Higher.',
    description:
      'Courses, practice, tests, notes, and AI-powered learning — all in one place.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Samyak Tutor — One Unified Education Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Samyak Tutor — Learn Smarter. Score Higher.',
    description:
      'Courses, practice, tests, notes, and AI-powered learning — all in one place.',
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