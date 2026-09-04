import React from 'react';
import type { Metadata } from 'next';
import CourseLandingPageClient from '@/components/courses/CourseLandingPageClient';
import { COURSE_LANDING_DATA } from '@/lib/courses/landingData';

const courseData = COURSE_LANDING_DATA['see-class-10'];

export const metadata: Metadata = {
  title: courseData.seoTitle,
  description: courseData.seoDescription,
  alternates: {
    canonical: 'https://samyakcee.com/see-class-10',
  },
  openGraph: {
    title: courseData.seoTitle,
    description: courseData.seoDescription,
    url: 'https://samyakcee.com/see-class-10',
    siteName: 'Samyak CEE Mastery',
    images: [{ url: '/images/og/see-class-10-og.jpg', width: 1200, height: 630, alt: courseData.seoTitle }],
    type: 'website',
  },
};

export default function SeeClass10Page() {
  return <CourseLandingPageClient course={courseData} />;
}
