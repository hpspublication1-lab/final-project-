import React from 'react';
import type { Metadata } from 'next';
import AdminTeachersClient from './components/AdminTeachersClient';

export const metadata: Metadata = {
  title: 'Teachers & Staff Directory | Samyak Tutor Admin',
  robots: { index: false, follow: false },
};

export default function AdminTeachersPage() {
  return <AdminTeachersClient />;
}
