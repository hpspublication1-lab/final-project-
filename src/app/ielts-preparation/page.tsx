import React from 'react';
import type { Metadata } from 'next';
import CourseLandingPageClient from '@/components/courses/CourseLandingPageClient';
import { COURSE_LANDING_DATA } from '@/lib/courses/landingData';

const courseData = COURSE_LANDING_DATA['ielts-preparation'];

export const metadata: Metadata = {
  title: courseData.seoTitle,
  description: courseData.seoDescription,
  alternates: {
    canonical: 'https://samyakcee.com/ielts-preparation',
  },
  openGraph: {
    title: courseData.seoTitle,
    description: courseData.seoDescription,
    url: 'https://samyakcee.com/ielts-preparation',
    siteName: 'Samyak CEE Mastery',
    images: [{ url: '/images/og/ielts-preparation-og.jpg', width: 1200, height: 630, alt: courseData.seoTitle }],
    type: 'website',
  },
};

export default function IeltsPreparationPage() {
  return <CourseLandingPageClient course={courseData} />;
}
