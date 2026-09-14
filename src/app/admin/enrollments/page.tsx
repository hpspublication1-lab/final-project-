import React from 'react';
import type { Metadata } from 'next';
import AdminEnrollmentsClient from './components/AdminEnrollmentsClient';

export const metadata: Metadata = {
  title: 'Course Enrollments Management | Samyak Tutor Admin',
  robots: { index: false, follow: false },
};

export default function AdminEnrollmentsPage() {
  return <AdminEnrollmentsClient />;
}
