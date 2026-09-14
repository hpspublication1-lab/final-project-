import React from 'react';
import type { Metadata } from 'next';
import AdminCoursesClient from './components/AdminCoursesClient';

export const metadata: Metadata = {
  title: 'Courses Catalog Management | Samyak Tutor Admin',
  robots: { index: false, follow: false },
};

export default function AdminCoursesPage() {
  return <AdminCoursesClient />;
}
