'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const SubjectMasteryRingsInner = dynamic(() => import('./SubjectMasteryRingsInner'), { ssr: false });

export default function SubjectMasteryRings() {
  return (
    <div className="card-base h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="font-semibold text-foreground">Subject Mastery</p>
          <p className="text-xs text-muted-foreground mt-0.5">Chapters completed × accuracy score</p>
        </div>
        <button className="text-xs text-primary font-medium hover:underline">View Details</button>
      </div>
      <SubjectMasteryRingsInner />
    </div>
  );
}