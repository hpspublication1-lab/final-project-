import type { Metadata } from 'next';
import CurriculumClient from './CurriculumClient';

export const metadata: Metadata = {
  title: 'CEE syllabus | Samyak Guru Admin',
  robots: { index: false, follow: false },
};

export default function AdminCeeCurriculumPage() {
  return <CurriculumClient />;
}
