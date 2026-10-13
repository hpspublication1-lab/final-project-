import React from 'react';
import type { Metadata } from 'next';
import AuthPageClient from '@/app/login/components/AuthPageClient';

export const metadata: Metadata = {
  title: 'Admin & Faculty Portal Sign In — Samyak Guru',
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return <AuthPageClient initialMode="signin" isAdminPortal />;
}
