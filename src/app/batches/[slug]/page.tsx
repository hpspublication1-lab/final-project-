import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import BatchDetailClient from './components/BatchDetailClient';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Batch Details — Samyak CEE Mastery',
};

/**
 * Validates whether a batch slug corresponds to a known static batch
 * or an active database record.
 */
export async function isValidBatchSlug(slug: string): Promise<boolean> {
  if (!slug || typeof slug !== 'string') return false;

  const normalized = slug.trim().toLowerCase();

  // 1. Static supported curriculum batches
  const isStaticBatch =
    normalized.includes('see') ||
    normalized.includes('nepali') ||
    normalized.includes('english') ||
    normalized.includes('cee');

  if (isStaticBatch) return true;

  // 2. Database validation for dynamically created batches (if Supabase is configured)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
    return false;
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('batches')
      .select('id')
      .eq('slug', normalized)
      .eq('is_active', true)
      .maybeSingle();

    if (data && !error) return true;
  } catch {
    // In offline or testing environments, fallback safely
  }

  return false;
}

export default async function BatchDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const valid = await isValidBatchSlug(slug);
  if (!valid) {
    notFound();
  }

  return <BatchDetailClient slug={slug} />;
}
