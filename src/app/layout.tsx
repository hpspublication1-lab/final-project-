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
  metadataBase: new URL('https://samyakcee.com'),
  title: 'Samyak Guru — AI Education Platform (SEE, CEE, IELTS, Digital Marketing, AI)',
  description:
    'Samyak Guru is Nepal\'s flagship AI Education Platform. Prepare for CEE Medical Entrance, SEE Class 10 Board Exams, IELTS Band 8.5+ Mastery, Digital Marketing, and AI Neural Tutoring with 24/7 AI Teachers.',
  keywords: [
    'Samyak Guru',
    'CEE Medical Entrance Preparation Nepal',
    'SEE Class 10 Online Classes',
    'IELTS Speaking Engine Nepal',
    'IELTS Preparation Class Nepal',
    'Digital Marketing Course Nepal',
    'AI Education Platform Nepal',
    'Samyak CEE',
    'MEC Entrance Exam',
  ],
  authors: [{ name: 'Samyak Guru Team', url: 'https://samyakcee.com' }],
  creator: 'Samyak Guru',
  publisher: 'Samyak Guru',
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
    siteName: 'Samyak Guru — AI Education Platform',
    title: 'Samyak Guru — AI Education Platform',
    description:
      'Prepare for CEE Medical Entrance, SEE Class 10 Board Exams, IELTS Band 8.5+ Mastery, and Digital Marketing with 24/7 AI Teachers.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Samyak Guru AI Education Platform — CEE, SEE, IELTS, Digital Marketing & AI',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Samyak Guru — AI Education Platform',
    description:
      'Prepare for CEE Medical Entrance, SEE Class 10 Board Exams, IELTS Band 8.5+ Mastery with 24/7 AI Teachers.',
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
    <html lang="en" className={plusJakartaSans.variable}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'Samyak Guru',
              url: 'https://samyakcee.com',
              logo: 'https://samyakcee.com/assets/images/app_logo.png',
              description: 'Nepal\'s flagship AI Education Platform (SEE, CEE, IELTS, Digital Marketing, AI)',
              sameAs: [
                'https://samyakcee.com',
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