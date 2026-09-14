import React from 'react';
import type { Metadata } from 'next';
import TeacherDashboardClient from './components/TeacherDashboardClient';

export const metadata: Metadata = {
  title: 'Teacher & Faculty Portal | Samyak Tutor',
  description: 'Manage assigned cohorts, schedule live classes, author MCQs, resolve doubts, and grade subjective papers.',
  robots: { index: false, follow: false },
};

export default function TeacherPage() {
  return <TeacherDashboardClient />;
}
