'use client';

import { useEffect, useState } from 'react';

interface FeatureState {
  enabled: boolean;
  config: Record<string, unknown>;
}

interface ProgramEntitlement {
  programSlug: string;
  programName: string;
  status: 'trial' | 'active' | 'expired';
  planTier: string;
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

  const hasFeature = (programSlug: string, featureKey: string) => {
    const program = entitlements.find((e) => e.programSlug === programSlug);
    if (!program || program.status === 'expired') return false;
    return Boolean(program.features[featureKey]?.enabled);
  };

  const isEnrolled = (programSlug: string) =>
    entitlements.some((e) => e.programSlug === programSlug);

  return { entitlements, loading, hasFeature, isEnrolled };
}
