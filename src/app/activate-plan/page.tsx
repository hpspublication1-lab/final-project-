import React from 'react';
import type { Metadata } from 'next';
import ActivatePlanClient from './components/ActivatePlanClient';

export const metadata: Metadata = {
  title: 'Activate Plan — Samyak CEE Mastery',
  robots: { index: false, follow: false },
};

export default function ActivatePlanPage() {
  return <ActivatePlanClient />;
}
