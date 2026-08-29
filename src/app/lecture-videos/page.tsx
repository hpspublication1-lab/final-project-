import React, { Suspense } from 'react';
import LectureVideosClient from './components/LectureVideosClient';

export default function LectureVideosPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>}>
      <LectureVideosClient />
    </Suspense>
  );
}
