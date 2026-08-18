import React from 'react';
import type { Metadata } from 'next';
import ResetPasswordClient from './components/ResetPasswordClient';

export const metadata: Metadata = {
  title: 'Reset Password — Samyak CEE Mastery',
  robots: { index: false, follow: true },
};

export default function ResetPasswordPage() {
  return <ResetPasswordClient />;
}
