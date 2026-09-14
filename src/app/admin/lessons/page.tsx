import React from 'react';
import type { Metadata } from 'next';
import AdminLessonsClient from './components/AdminLessonsClient';

export const metadata: Metadata = {
  title: 'Lessons & Video Management | Samyak Tutor Admin',
  robots: { index: false, follow: false },
};

export default function AdminLessonsPage() {
  return <AdminLessonsClient />;
}
