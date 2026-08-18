import React from 'react';
import type { Metadata } from 'next';
import AuthPageClient from './components/AuthPageClient';

export const metadata: Metadata = {
  title: 'Sign In — Samyak CEE Mastery',
  robots: { index: false, follow: true },
};

export default function AuthPage() {
  return <AuthPageClient />;
}