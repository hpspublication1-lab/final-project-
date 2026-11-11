import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  calculateRankPrediction,
  type CeeCategory,
  type CeeProgramType,
} from '@/lib/calculator/rankPredictorEngine';
import { enforceRateLimit } from '@/lib/security/rateLimiter';
import { sanitizeDisplayName, sanitizePhone, sanitizeEmail } from '@/lib/security/authSecurity';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const rl = enforceRateLimit(req, 'submission');
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment.' },
        { status: 429, headers: { 'Retry-After': String(rl.resetSeconds) } }
      );
    }

    const body = await req.json().catch(() => ({}));
    const rawScore = Number(body.score ?? 140);
    const category: CeeCategory = body.category || 'open';
    const program: CeeProgramType = body.program || 'mbbs';

    const candidateName = sanitizeDisplayName(String(body.candidateName || 'CEE Aspirant'));
    const phone = sanitizePhone(String(body.phone || ''));
    const email = sanitizeEmail(String(body.email || ''));

    const prediction = calculateRankPrediction(rawScore, category, program);

    // Save lead into Supabase CRM leads table if phone or email provided
    if (phone || email) {
      try {
        const admin = createAdminClient();
        if (admin) {
          const leadEmail = email || `aspirant_${phone.replace(/\D/g, '') || Date.now()}@samyak.edu.np`;
          await admin.from('leads').upsert(
            {
              email: leadEmail,
              first_name: candidateName,
              phone: phone || null,
              academic_level: 'CEE_ENTRANCE',
              prep_status: prediction.isQualified ? 'QUALIFIED_MOCK' : 'PREPARING',
              score: Math.round(prediction.score),
              segment: program === 'mbbs' ? 'MBBS_ASPIRANT' : 'HEALTH_SCIENCES',
              lead_magnet: 'cee_air_rank_predictor',
              landing_page: '/rank-predictor',
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'email' }
          );
        }
      } catch (err) {
        console.debug('Failed to record CRM lead for rank predictor:', err);
      }
    }

    return NextResponse.json({
      success: true,
      prediction,
      capturedLead: Boolean(phone || email),
    });
  } catch (err: any) {
    console.error('Rank predictor error:', err);
    return NextResponse.json({ success: false, error: 'Internal calculation error' }, { status: 500 });
  }
}
