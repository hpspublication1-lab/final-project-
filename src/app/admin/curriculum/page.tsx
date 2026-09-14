import React from 'react';
import type { Metadata } from 'next';
import AdminCurriculumClient from './components/AdminCurriculumClient';

export const metadata: Metadata = {
  title: 'Curriculum & Content Management — Samyak Admin',
  description: 'Manage courses, batches, syllabus hierarchy, video publishing, drafts, free previews, and study resources.',
};

export default function AdminCurriculumPage() {
  return <AdminCurriculumClient />;
}
