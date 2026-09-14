import React from 'react';
import type { Metadata } from 'next';
import MyCoursesClient from './components/MyCoursesClient';

export const metadata: Metadata = {
  title: 'My Courses — Samyak Tutor LMS',
  description: 'Manage your enrolled academic tracks, batch cohorts, course progress, and continue learning on Samyak Tutor.',
};

export default function MyCoursesPage() {
  return <MyCoursesClient />;
}
