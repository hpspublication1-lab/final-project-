import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateQuestions } from '@/lib/ai/generateQuestions';

/**
 * POST /api/practice/live  { subject, difficulty?, count? }
 *
 * On-the-fly practice: generates a FRESH set of MCQs via OpenAI for this
 * student, right now — nothing from the bank, so every session is unique.
 * Premium feature (Pro / prebook / admin), since each call costs OpenAI usage.
 * Returns questions WITH the answer + explanation (practice reveals per-answer).
 */
export const maxDuration = 120;

const SUBJECT_KEYS: Record<string, string> = {
  biology: 'biology', chemistry: 'chemistry', physics: 'physics',
  'mental agility': 'mental_agility', mental_agility: 'mental_agility', mat: 'mental_agility',
};
const PAID_PLANS = ['student', 'pro', 'institution'];
const OPTION_IDS = ['a', 'b', 'c', 'd'];

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Sign in to use live AI practice.' }, { status: 401 });

    // Premium gate (live generation costs OpenAI calls).
    const admin = createAdminClient();
    if (admin) {
      const { data: prof } = await admin
        .from('user_profiles')
        .select('subscription_plan, subscription_expires_at, is_admin')
        .eq('id', user.id)
        .single();
      const exp = prof?.subscription_expires_at;
      const planActive = !exp || new Date(exp) > new Date();
      const premium = !!prof?.is_admin || (PAID_PLANS.includes(prof?.subscription_plan) && planActive);
      if (!premium) {
        return NextResponse.json({ error: 'Live AI practice is a Pro feature. Upgrade to unlock it.' }, { status: 403 });
      }
    }

    const body = await request.json().catch(() => ({}));
    const subjectRaw = String(body.subject ?? '').toLowerCase().trim();
    const subjectKey = SUBJECT_KEYS[subjectRaw] ?? 'biology';
    const difficulty = ['easy', 'medium', 'hard'].includes(body.difficulty) ? body.difficulty : undefined;
    const count = Math.max(1, Math.min(15, parseInt(String(body.count), 10) || 10)); // cap per session

    const label =
      subjectKey === 'mental_agility'
        ? 'Mental Agility Test (MAT): logical reasoning, series, analogies, coding-decoding, quantitative aptitude for Nepal MEC CEE'
        : `${subjectKey} for the Nepal MEC CEE medical entrance exam${difficulty ? ` — ${difficulty} difficulty` : ''}`;

    const generated = await generateQuestions(subjectKey === 'mental_agility' ? 'mental_agility' : label, count);
    if (generated.length === 0) {
      return NextResponse.json({ error: 'Could not generate questions right now. Please try again.' }, { status: 502 });
    }

    // Shape for the practice UI (answer included; practice reveals per question).
    const questions = generated.map((q, i) => ({
      id: `live-${Date.now()}-${i}`,
      question: q.question_text,
      options: q.options.slice(0, 4).map((text, idx) => ({ id: OPTION_IDS[idx], text })),
      correctId: (q.correct_answer || 'A').toLowerCase(),
      explanation: q.explanation,
      difficulty: q.difficulty,
    }));

    return NextResponse.json({ questions });
  } catch (err) {
    console.error('practice/live error:', err);
    return NextResponse.json({ error: 'Live practice generation failed. Please try again.' }, { status: 500 });
  }
}
