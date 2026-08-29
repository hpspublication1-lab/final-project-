'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const SubjectMasteryRingsInner = dynamic(() => import('./SubjectMasteryRingsInner'), { ssr: false });

export default function SubjectMasteryRings() {
  return (
    <div className="card-luxury p-5 sm:p-6 shadow-luxury h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-extrabold text-foreground">Subject Mastery Diagnostic</p>
          <p className="text-xs text-muted-foreground mt-0.5 font-medium">Chapters completed × accuracy score</p>
        </div>
        <button className="text-xs text-primary font-bold hover:underline">View Details</button>
      </div>
      <SubjectMasteryRingsInner />
    </div>
  );
}