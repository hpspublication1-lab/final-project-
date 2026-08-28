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
            programSlug: 'cee_medical',
            programName: 'CEE — Medical Entrance Preparation',
            status: 'active',
            planTier: 'free',
            features: {
              mcq_practice: { enabled: true, config: {} },
              mock_tests: { enabled: true, config: {} },
              battle_arena: { enabled: true, config: {} },
              video_library: { enabled: true, config: {} },
            },
          },
          {
            programSlug: 'see_class_10',
            programName: 'SEE — Class 10 Board Exam',
            status: 'active',
            planTier: 'free',
            features: {
              subjective_practice: { enabled: true, config: {} },
              model_papers: { enabled: true, config: {} },
              question_bank: { enabled: true, config: {} },
            },
          },
          {
            programSlug: 'ielts',
            programName: 'IELTS — English Language Mastery',
            status: 'active',
            planTier: 'free',
            features: {
              ielts_writing_evaluator: { enabled: true, config: {} },
              speaking_simulator: { enabled: true, config: {} },
              listening_drills: { enabled: true, config: {} },
              reading_drills: { enabled: true, config: {} },
            },
          },
          {
            programSlug: 'digital_marketing',
            programName: 'Digital Marketing — Build Digital Skills',
            status: 'active',
            planTier: 'free',
            features: {
              meta_ads_modules: { enabled: true, config: {} },
              funnel_blueprints: { enabled: true, config: {} },
              portfolio_projects: { enabled: true, config: {} },
            },
          },
          {
            programSlug: 'artificial_intelligence',
            programName: 'Artificial Intelligence — AI Academy',
            status: 'active',
            planTier: 'free',
            features: {
              ai_prompt_studio: { enabled: true, config: {} },
              python_runner: { enabled: true, config: {} },
              ai_automation_tools: { enabled: true, config: {} },
            },
          },
        ],
      });
    }

    const { data: features } = await admin
      .from('program_features')
      .select('program_id, feature_key, is_enabled, config');

    let userEnrollments: any[] = [];
    let profilePlan: string = 'free';

    if (user) {
      const [{ data: enrolls }, { data: userProf }, { data: batchEnrolls }] = await Promise.all([
        admin.from('enrollments').select('program_id, status, plan_tier').eq('user_id', user.id),
        admin.from('profiles').select('subscription_plan').eq('id', user.id).maybeSingle(),
        admin.from('batch_enrollments').select('batch_id, batches(program_type)').eq('student_id', user.id),
      ]);
      userEnrollments = enrolls || [];
      profilePlan = userProf?.subscription_plan || 'free';
    }

    const entitlements = programs.map((prog) => {
      const progFeatures = (features || []).filter((f) => f.program_id === prog.id);
      const featureMap: Record<string, { enabled: boolean; config: any }> = {};
      progFeatures.forEach((f) => {
        featureMap[f.feature_key] = { enabled: f.is_enabled, config: f.config };
      });

      const userEnroll = userEnrollments.find((e) => e.program_id === prog.id);

      // Determine plan tier: direct enrollment > profile legacy pro > free
      let planTier = userEnroll?.plan_tier || 'free';
      let status = userEnroll?.status || 'active';

      if (planTier === 'free' && (profilePlan === 'pro' || profilePlan === 'institution') && prog.slug === 'cee_medical') {
        planTier = 'pro';
      }

      return {
        programSlug: prog.slug,
        programName: prog.name,
        status,
        planTier,
        features: featureMap,
      };
    });

    return NextResponse.json({ entitlements });
  } catch (err) {
    console.error('API /api/entitlements error:', err);
    return NextResponse.json({ entitlements: [] }, { status: 500 });
  }
}
