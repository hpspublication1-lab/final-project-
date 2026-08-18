import React from 'react';
import type { Metadata } from 'next';
import OnboardingClient from './components/OnboardingClient';

export const metadata: Metadata = {
  title: 'Complete your profile — Samyak CEE Mastery',
  robots: { index: false, follow: false },
};

export default function OnboardingPage() {
  return <OnboardingClient />;
}
