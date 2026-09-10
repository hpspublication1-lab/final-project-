import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import LiveClassesClient from './components/LiveClassesClient';

export const metadata: Metadata = {
  title: 'Live Classes & Interactive Masterclasses — Samyak Learning',
  description: 'Join live interactive lectures for SEE Board (Class 10) and CEE Medical Entrance with leading faculty, real-time Q&A, and full recordings.',
  alternates: {
    canonical: '/live-classes',
  },
};

export default function LiveClassesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
      <LiveClassesClient />
    </Suspense>
  );
}

