'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import CanonicalSubjectWorkspace from '@/components/see/CanonicalSubjectWorkspace';

export default function DedicatedSeeSubjectPage() {
  const params = useParams();
  const subjectId = (params?.subjectId as string) || 'science';

  return <CanonicalSubjectWorkspace subjectId={subjectId} />;
}
