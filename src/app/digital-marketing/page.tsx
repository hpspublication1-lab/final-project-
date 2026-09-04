import React from 'react';
import type { Metadata } from 'next';
import CourseLandingPageClient from '@/components/courses/CourseLandingPageClient';
import { COURSE_LANDING_DATA } from '@/lib/courses/landingData';

const courseData = COURSE_LANDING_DATA['digital-marketing'];

export const metadata: Metadata = {
  title: courseData.seoTitle,
  description: courseData.seoDescription,
  alternates: {
    canonical: 'https://samyakcee.com/digital-marketing',
  },
  openGraph: {
    title: courseData.seoTitle,
    description: courseData.seoDescription,
    url: 'https://samyakcee.com/digital-marketing',
    siteName: 'Samyak CEE Mastery',
    images: [{ url: '/images/og/digital-marketing-og.jpg', width: 1200, height: 630, alt: courseData.seoTitle }],
    type: 'website',
  },
};

export default function DigitalMarketingPage() {
  return <CourseLandingPageClient course={courseData} />;
}
