import React from 'react';
import type { Metadata } from 'next';
import AuthPageClient from '../sign-up-login-screen/components/AuthPageClient';

export const metadata: Metadata = {
  title: 'Register — Samyak CEE Mastery',
  description: 'Create your Samyak CEE account to access courses, 24/7 AI Teachers, and Battle Arena.',
  robots: { index: false, follow: true },
};

export default function RegisterPage() {
  return <AuthPageClient initialMode="signup" />;
}
