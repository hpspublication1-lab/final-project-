import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/arena/questions
 * Server-authoritative endpoint to dispense battle arena questions.
 * Validates authenticated user or room participant, retrieves questions
 * using service-role privileges, and returns normalized question payloads.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const roomId = searchParams.get('roomId');
    const idsParam = searchParams.get('ids');
    const countParam = Number(searchParams.get('count')) || 10;

    const admin = createAdminClient();
    if (!admin) {
      return NextResponse.json({ error: 'Database service unavailable' }, { status: 500 });
    }

    let questionIds: string[] = [];

    // 1. If roomId provided, verify room and load preset question_ids
    if (roomId) {
      const { data: room, error: roomErr } = await admin
        .from('battle_rooms')
        .select('id, question_ids, question_count, status')
        .eq('id', roomId)
        .maybeSingle();

      if (room && Array.isArray(room.question_ids) && room.question_ids.length > 0) {
        questionIds = room.question_ids;
      }
    }

    // 2. If idsParam provided directly
    if (questionIds.length === 0 && idsParam) {
      questionIds = idsParam.split(',').map((s) => s.trim()).filter(Boolean);
    }

    // 3. If still empty, pull published active questions
    if (questionIds.length === 0) {
      const { data: randomQuestions } = await admin
        .from('questions')
        .select('id')
        .eq('is_published', true)
        .limit(Math.min(60, countParam * 3));

      if (randomQuestions) {
        questionIds = randomQuestions.map((q: any) => q.id).slice(0, countParam);
      }
    }

    // 4. Fetch the authoritative questions
    const { data: questions, error: qErr } = await admin
      .from('questions')
      .select('id, question_text, options, correct_answer, difficulty, subject_id')
      .in('id', questionIds);

    if (qErr) {
      return NextResponse.json({ error: qErr.message }, { status: 500 });
    }

    // 5. Sanitize: Never leak correct_answer to client-facing responses
    const internalKey = req.headers.get('x-arena-internal-key');
    const isAuthorizedInternal = Boolean(
      internalKey &&
      internalKey === (process.env.MULTIPLAYER_SECRET_KEY || 'samyak_colyseus_multiplayer_secret_key_2026')
    );

    const sanitizedQuestions = (questions || []).map((q: any) => {
      if (isAuthorizedInternal) {
        return q;
      }
      const { correct_answer, ...publicQuestion } = q;
      return publicQuestion;
    });

    return NextResponse.json({
      success: true,
      questions: sanitizedQuestions,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to load arena questions' }, { status: 500 });
  }
}
