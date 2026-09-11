import { NextResponse } from 'next/server';
import { getSessionUser, createAdminClient } from '@/lib/supabase/route-auth';

interface ProgramMeta {
  slug: string;
  name: string;
  features: string[];
}

const CANONICAL_PROGRAMS: ProgramMeta[] = [
  {
    slug: 'cee_medical',
    name: 'CEE — Medical Entrance Preparation',
    features: ['mcq_practice', 'mock_tests', 'battle_arena', 'video_library', 'ai_tutor', 'mistake_analyser'],
  },
  {
    slug: 'see_class_10',
    name: 'SEE — Class 10 Board Exam',
    features: ['subjective_practice', 'vision_marker', 'model_papers', 'question_bank', 'video_library', 'live_classes'],
  },
  {
    slug: 'ielts',
    name: 'IELTS — English Language Mastery',
    features: ['ielts_writing_evaluator', 'speaking_simulator', 'listening_drills', 'reading_drills'],
  },
  {
    slug: 'digital_marketing',
    name: 'Digital Marketing — Build Digital Skills',
    features: ['meta_ads_modules', 'funnel_blueprints', 'portfolio_projects'],
  },
  {
    slug: 'artificial_intelligence',
    name: 'Artificial Intelligence — AI Academy',
    features: ['ai_prompt_studio', 'python_runner', 'ai_automation_tools'],
  },
];

const PAID_TIERS = ['student', 'pro', 'premium', 'institution', 'prebook'];

export async function GET() {
  try {
    const user = await getSessionUser();
    const admin = createAdminClient();

    let userEnrollments: Array<{ program_id: string; status?: string; plan_tier?: string; expires_at?: string }> = [];
    let profilePlan = 'free';
    let profileExpiresAt: string | null = null;
    let isAdmin = false;

    if (user) {
      const [enrollRes, profRes] = await Promise.all([
        admin
          .from('enrollments')
          .select('program_id, status, plan_tier')
          .eq('user_id', user.id),
        admin
          .from('user_profiles')
          .select('subscription_plan, subscription_expires_at, is_admin')
          .eq('id', user.id)
          .maybeSingle(),
      ]);

      userEnrollments = enrollRes.data || [];
      if (profRes.data) {
        profilePlan = profRes.data.subscription_plan || 'free';
        profileExpiresAt = profRes.data.subscription_expires_at || null;
        isAdmin = Boolean(profRes.data.is_admin);
      }
    }

    const isGlobalPlanActive =
      !profileExpiresAt || new Date(profileExpiresAt).getTime() > Date.now();
    const hasGlobalLegacyPro =
      PAID_TIERS.includes(profilePlan.toLowerCase()) && isGlobalPlanActive;

    const entitlements = CANONICAL_PROGRAMS.map((prog) => {
      // Find course-specific enrollment
      const userEnroll = userEnrollments.find((e) => {
        const pId = (e.program_id || '').toLowerCase();
        if (prog.slug === 'see_class_10') return pId === 'see_class_10' || pId === 'see';
        if (prog.slug === 'cee_medical') return pId === 'cee_medical' || pId === 'cee';
        if (prog.slug === 'ielts') return pId === 'ielts' || pId === 'english';
        if (prog.slug === 'digital_marketing') return pId === 'digital_marketing' || pId === 'digital';
        if (prog.slug === 'artificial_intelligence') return pId === 'artificial_intelligence' || pId === 'ai';
        return pId === prog.slug;
      });

      let planTier = 'free';
      let status: 'active' | 'trial' | 'expired' = 'active';

      if (isAdmin) {
        planTier = 'pro';
        status = 'active';
      } else if (userEnroll) {
        const enrollTier = (userEnroll.plan_tier || 'free').toLowerCase();
        const enrollStatus = (userEnroll.status || 'active').toLowerCase();
        if (enrollStatus === 'expired') {
          status = 'expired';
          planTier = 'free';
        } else {
          status = enrollStatus === 'trial' ? 'trial' : 'active';
          planTier = PAID_TIERS.includes(enrollTier) ? 'pro' : enrollTier;
        }
      } else if (hasGlobalLegacyPro && prog.slug === 'cee_medical') {
        // Grandfather legacy CEE subscribers
        planTier = 'pro';
        status = 'active';
      }

      const isPro = planTier === 'pro' || planTier === 'premium' || planTier === 'institution';

      const featureMap: Record<string, { enabled: boolean; config: Record<string, unknown> }> = {};
      prog.features.forEach((key) => {
        featureMap[key] = {
          enabled: isPro || key === 'mcq_practice' || key === 'subjective_practice',
          config: { tier: planTier },
        };
      });

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
