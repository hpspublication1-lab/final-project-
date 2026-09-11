import React from 'react';
import type { Metadata } from 'next';
import AuthPageClient from './components/AuthPageClient';

export const metadata: Metadata = {
  title: 'Log In — Samyak CEE Mastery',
  robots: { index: false, follow: true },
};

export default function LoginPage() {
  return <AuthPageClient initialMode="signin" />;
}
