import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, createAdminClient } from '@/lib/supabase/route-auth';

export async function GET() {
  try {
    const user = await getSessionUser();
    const admin = createAdminClient();

    // Fetch all active programs & their feature flags
    const { data: programs, error: pErr } = await admin
      .from('programs')
      .select('id, slug, name, category, is_active')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (pErr || !programs) {
      // Fallback default entitlements structure
      return NextResponse.json({
        entitlements: [
          {
            programSlug: 'cee',
            programName: 'CEE / Medical Entrance',
            status: 'active',
            planTier: 'free',
            features: {
              mcq_practice: { enabled: true, config: {} },
              subjective_practice: { enabled: true, config: {} },
              battle_arena: { enabled: true, config: {} },
            },
          },
          {
            programSlug: 'see',
            programName: 'SEE Grade 10 Board',
            status: 'active',
            planTier: 'free',
            features: {
              mcq_practice: { enabled: true, config: {} },
              subjective_practice: { enabled: true, config: {} },
              battle_arena: { enabled: true, config: {} },
            },
          },
          {
            programSlug: 'english',
            programName: 'English & IELTS Mastery',
            status: 'active',
            planTier: 'free',
            features: {
              ielts_writing_evaluator: { enabled: true, config: {} },
              speaking_simulator: { enabled: true, config: {} },
            },
          },
          {
            programSlug: 'digital',
            programName: 'Digital Skills & AI Academy',
            status: 'active',
            planTier: 'free',
            features: {
              ai_prompt_studio: { enabled: true, config: {} },
              python_runner: { enabled: true, config: {} },
            },
          },
        ],
      });
    }

    const { data: features } = await admin
      .from('program_features')
      .select('program_id, feature_key, is_enabled, config');

    let userEnrollments: any[] = [];
    if (user) {
      const { data: enrolls } = await admin
        .from('enrollments')
        .select('program_id, status, plan_tier')
        .eq('user_id', user.id);
      userEnrollments = enrolls || [];
    }

    const entitlements = programs.map((prog) => {
      const progFeatures = (features || []).filter((f) => f.program_id === prog.id);
      const featureMap: Record<string, { enabled: boolean; config: any }> = {};
      progFeatures.forEach((f) => {
        featureMap[f.feature_key] = { enabled: f.is_enabled, config: f.config };
      });

      const userEnroll = userEnrollments.find((e) => e.program_id === prog.id);

      return {
        programSlug: prog.slug,
        programName: prog.name,
        status: userEnroll?.status || 'active',
        planTier: userEnroll?.plan_tier || 'free',
        features: featureMap,
      };
    });

    return NextResponse.json({ entitlements });
  } catch (err) {
    console.error('API /api/entitlements error:', err);
    return NextResponse.json({ entitlements: [] }, { status: 500 });
  }
}
