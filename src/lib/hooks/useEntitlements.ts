'use client';

import { useEffect, useState } from 'react';
import { normalizeCourseId, CanonicalCourseId } from '@/contexts/ProgramContext';

interface FeatureState {
  enabled: boolean;
  config: Record<string, unknown>;
}

export interface ProgramEntitlement {
  programSlug: string;
  programName: string;
  status: 'trial' | 'active' | 'expired';
  planTier: 'free' | 'prebook' | 'paid' | 'premium' | string;
  features: Record<string, FeatureState>;
}

export function useEntitlements() {
  const [entitlements, setEntitlements] = useState<ProgramEntitlement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/entitlements')
      .then((res) => (res.ok ? res.json() : { entitlements: [] }))
      .then((data) => setEntitlements(data.entitlements ?? []))
      .catch(() => setEntitlements([]))
      .finally(() => setLoading(false));
  }, []);

  const findProgram = (rawSlug: string) => {
    const canonical = normalizeCourseId(rawSlug);
    return entitlements.find(
      (e) =>
        e.programSlug === rawSlug ||
        normalizeCourseId(e.programSlug) === canonical
    );
  };

  const hasFeature = (programSlug: string, featureKey: string): boolean => {
    const program = findProgram(programSlug);
    if (!program || program.status === 'expired') return false;
    return Boolean(program.features[featureKey]?.enabled);
  };

  const isEnrolled = (programSlug: string): boolean => {
    const prog = findProgram(programSlug);
    return Boolean(prog && (prog.status === 'active' || prog.status === 'trial'));
  };

  const isEnrolledIn = (programSlug: string): boolean => isEnrolled(programSlug);

  const getCourseTier = (programSlug: string): string => {
    const prog = findProgram(programSlug);
    return prog?.planTier || 'free';
  };

  const isPaidCourse = (programSlug: string): boolean => {
    const tier = getCourseTier(programSlug);
    return ['paid', 'premium', 'prebook', 'pro', 'institution'].includes(tier);
  };

  const enrolledCourseIds: CanonicalCourseId[] = entitlements
    .filter((e) => e.status === 'active' || e.status === 'trial')
    .map((e) => normalizeCourseId(e.programSlug));

  return {
    entitlements,
    loading,
    hasFeature,
    isEnrolled,
    isEnrolledIn,
    getCourseTier,
    isPaidCourse,
    enrolledCourseIds,
  };
}

