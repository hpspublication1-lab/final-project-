import React from 'react';
import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import '../styles/tailwind.css';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import { TrialProvider } from '@/contexts/TrialContext';
import AnimatePresenceProvider from '@/components/AnimatePresenceProvider';
import AnalyticsProvider from '@/components/AnalyticsProvider';
import TrialBannerAndModals from '@/components/TrialBannerAndModals';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-plus-jakarta-sans',
  display: 'swap',
});

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
  metadataBase: getMetadataBase(),
  title: 'Samyak — Nepal\'s #1 Multi-Sector eLearning Platform (CEE, SEE, English & Digital Skills)',
  description:
    'Nepal\'s premier online learning platform for CEE Medical Entrance, Class 10 SEE, English & IELTS Mastery, and Digital & AI Skills for Beginners.',
  manifest: '/manifest.json',
  icons: {
    icon: [{ url: '/favicon.ico', type: 'image/x-icon' }],
    apple: '/assets/images/app_logo.png',
  },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Samyak — Nepal\'s Premier eLearning Platform',
    description: 'Master CEE Medical, SEE Class 10, English & Digital AI Skills with Nepal\'s top faculty and AI tools.',
    url: '/',
    siteName: 'Samyak Learning Platform',
    locale: 'en_NP',
    type: 'website',
    images: [
      {
        url: '/assets/images/app_logo.png',
        width: 1200,
        height: 630,
        alt: 'Samyak eLearning Platform — CEE, SEE, English, Digital Skills',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Samyak — Multi-Sector eLearning Platform',
    description: 'Master CEE Medical, SEE Class 10, English & Digital AI Skills with Nepal\'s top faculty.',
    images: ['/assets/images/app_logo.png'],
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
    <html lang="en" className={plusJakartaSans.variable}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'Samyak CEE Mastery',
              url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:4028',
              logo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:4028'}/assets/images/app_logo.png`,
              description: 'Nepal\'s most comprehensive CEE & SEE preparation platform',
              sameAs: [
                'https://www.facebook.com/samyakcee',
                'https://www.instagram.com/samyakcee',
                'https://www.youtube.com/samyakcee',
              ],
              contactPoint: {
                '@type': 'ContactPoint',
                contactType: 'Customer Support',
                email: 'support@samyakcee.com.np',
              },
            }),
          }}
        />
      </head>
      <body className={plusJakartaSans.className}>
        <AuthProvider>
          <TrialProvider>
            <ProgramProvider>
              <AnimatePresenceProvider>
                <AnalyticsProvider>
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