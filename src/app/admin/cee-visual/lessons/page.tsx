import React from 'react';
import type { Metadata } from 'next';
import VisualLessonsManagerClient from './components/VisualLessonsManagerClient';

export const metadata: Metadata = {
  title: 'CEE Visual Lessons Studio | Samyak Guru Admin',
  description: 'Manage 3D visual intelligence lessons, revisions, and publication pipelines for Nepal CEE Entrance.',
  robots: { index: false, follow: false },
};

export default function AdminVisualLessonsPage() {
  return <VisualLessonsManagerClient />;
}
