import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/supabase/route-auth';
import { EnrollmentService } from '@/lib/services/enrollmentService';
import { evaluateAccessContext } from '@/lib/auth/accessControl';

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

export async function GET() {
  try {
    const user = await getSessionUser();

    // If not signed in, return visitor baseline
    if (!user) {
      const visitorContext = evaluateAccessContext(null);
      const entitlements = CANONICAL_PROGRAMS.map((prog) => ({
        programSlug: prog.slug,
        programName: prog.name,
        status: 'active' as const,
        planTier: 'free',
        features: prog.features.reduce((acc, feat) => {
          acc[feat] = { enabled: false, config: { tier: 'free' } };
          return acc;
        }, {} as Record<string, { enabled: boolean; config: Record<string, unknown> }>),
      }));

      return NextResponse.json({ entitlements, role: visitorContext.role });
    }

    // Authoritative access resolution via EnrollmentService
    const accessContext = await EnrollmentService.getStudentAccess(user.id);

    const entitlements = CANONICAL_PROGRAMS.map((prog) => {
      const courseAccess = accessContext.courses[prog.slug as keyof typeof accessContext.courses];
      const isPro = courseAccess?.canAccessFullCourse || false;
      const state = courseAccess?.state || 'free_preview';

      // Feature map
      const featureMap: Record<string, { enabled: boolean; config: Record<string, unknown> }> = {};
      prog.features.forEach((key) => {
        featureMap[key] = {
          enabled: isPro || key === 'mcq_practice' || key === 'subjective_practice',
          config: { tier: isPro ? 'pro' : 'free', state },
        };
      });

      return {
        programSlug: prog.slug,
        programName: prog.name,
        status: state === 'active' || state === 'expiring_soon' ? 'active' : state === 'expired' ? 'expired' : 'active',
        lifecycleState: state,
        planTier: isPro ? 'pro' : 'free',
        daysRemaining: courseAccess?.daysRemaining,
        features: featureMap,
      };
    });

    return NextResponse.json({
      entitlements,
      role: accessContext.role,
      isSuspended: accessContext.isSuspended,
      activeCoursesCount: accessContext.activeCoursesCount,
    });
  } catch (err) {
    console.error('API /api/entitlements error:', err);
    return NextResponse.json({ entitlements: [], error: 'Failed to resolve access context' }, { status: 500 });
  }
}
