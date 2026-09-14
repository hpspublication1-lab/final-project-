import React from 'react';
import type { Metadata } from 'next';
import AdminRolesClient from './components/AdminRolesClient';

export const metadata: Metadata = {
  title: 'Roles & Permissions | Samyak Tutor Admin',
  robots: { index: false, follow: false },
};

export default function AdminRolesPage() {
  return <AdminRolesClient />;
}
