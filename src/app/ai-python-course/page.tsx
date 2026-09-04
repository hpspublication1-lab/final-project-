import React from 'react';
import type { Metadata } from 'next';
import CourseLandingPageClient from '@/components/courses/CourseLandingPageClient';
import { COURSE_LANDING_DATA } from '@/lib/courses/landingData';

const courseData = COURSE_LANDING_DATA['ai-python-course'];

export const metadata: Metadata = {
  title: courseData.seoTitle,
  description: courseData.seoDescription,
  alternates: {
    canonical: 'https://samyakcee.com/ai-python-course',
  },
  openGraph: {
    title: courseData.seoTitle,
    description: courseData.seoDescription,
    url: 'https://samyakcee.com/ai-python-course',
    siteName: 'Samyak CEE Mastery',
    images: [{ url: '/images/og/ai-python-course-og.jpg', width: 1200, height: 630, alt: courseData.seoTitle }],
    type: 'website',
  },
};

export default function AiPythonCoursePage() {
  return <CourseLandingPageClient course={courseData} />;
}
