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
  title: 'Soumya Guru — Multi-Course Learning Platform (SEE, CEE, IELTS, Digital Marketing, AI)',
  description:
    'Nepal\'s premier 5-in-1 online learning platform with dedicated portals for SEE Class 10, CEE Medical Entrance, IELTS Mastery, Digital Marketing, and Artificial Intelligence.',
  manifest: '/manifest.json',
  icons: {
    icon: [{ url: '/favicon.ico', type: 'image/x-icon' }],
    apple: '/assets/images/app_logo.png',
  },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Soumya Guru — Multi-Course Learning Platform',
    description: 'Master SEE Class 10, CEE Medical, IELTS, Digital Marketing & AI with Nepal\'s top faculty and AI tools.',
    url: '/',
    siteName: 'Soumya Guru Platform',
    locale: 'en_NP',
    type: 'website',
    images: [
      {
        url: '/assets/images/app_logo.png',
        width: 1200,
        height: 630,
        alt: 'Soumya Guru Multi-Course Learning Platform — SEE, CEE, IELTS, Digital Marketing, AI',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Soumya Guru — Multi-Course Learning Platform',
    description: 'Master SEE Class 10, CEE Medical, IELTS, Digital Marketing & AI with dedicated portals.',
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
              name: 'Soumya Guru',
              url: process.env.NEXT_PUBLIC_SITE_URL || 'https://soumyace.com',
              logo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://soumyace.com'}/assets/images/app_logo.png`,
              description: 'Nepal\'s premier 5-in-1 multi-course education platform',
              sameAs: [
                'https://soumyace.com',
              ],
              contactPoint: {
                '@type': 'ContactPoint',
                contactType: 'Customer Support',
                email: 'support@soumyace.com',
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