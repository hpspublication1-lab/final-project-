import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { enforceRateLimit } from '@/lib/security/rateLimiter';

export const dynamic = 'force-dynamic';

function resolveOptionKey(correctAnswer: string, options: string[]): string {
  if (!correctAnswer) return 'a';
  const clean = correctAnswer.trim().toLowerCase();
  if (['a', 'b', 'c', 'd'].includes(clean)) return clean;
  // If stored as option text, match against options array index
  if (Array.isArray(options)) {
    const idx = options.findIndex((opt) => opt && opt.trim().toLowerCase() === clean);
    if (idx >= 0 && idx < 4) {
      return ['a', 'b', 'c', 'd'][idx];
    }
  }
  return 'a';
}

/**
 * POST /api/arena/results/submit
 * Server-authoritative result evaluation and submission endpoint.
 * 
 * 1. Authenticates student via Supabase session (derives user.id).
 * 2. Validates student participation in the room.
 * 3. Fetches authoritative questions and answer keys on the server.
 * 4. Authoritatively evaluates student answers, computing correct count,
 *    negative marking penalties (-0.25 per incorrect), accuracy, and time.
 * 5. Calls submit_battle_result with server-calculated score.
 * 6. Returns final score, rating deltas, and post-match question review data.
 */
export async function POST(req: NextRequest) {
  try {
    // 0. Rate limiting
    const rl = await enforceRateLimit(req, 'api');
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many submissions. Please wait a moment.' },
        { status: 429, headers: { 'Retry-After': String(rl.resetSeconds) } }
      );
    }

    // 1. Authenticate student session
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
    }

    const admin = createAdminClient();
    if (!admin) {
      return NextResponse.json({ error: 'Database service unavailable' }, { status: 500 });
    }

    const body = await req.json().catch(() => ({}));
    const { roomId, answers = {}, timeTakenSeconds = 0 } = body;

    if (!roomId) {
      return NextResponse.json({ error: 'Room ID is required' }, { status: 400 });
    }

    // 2. Validate room and participant membership
    const { data: room, error: roomErr } = await admin
      .from('battle_rooms')
      .select('id, creator_id, opponent_id, status, question_ids, time_limit_seconds')
      .eq('id', roomId)
      .maybeSingle();

    if (roomErr || !room) {
      return NextResponse.json({ error: 'Battle room not found' }, { status: 404 });
    }

    const isCreator = room.creator_id === user.id;
    const isOpponent = room.opponent_id === user.id;

    if (!isCreator && !isOpponent) {
      return NextResponse.json(
        { error: 'Forbidden: You are not an authorized participant in this room' },
        { status: 403 }
      );
    }

    const questionIds = Array.isArray(room.question_ids) ? room.question_ids : [];
    if (questionIds.length === 0) {
      return NextResponse.json({ error: 'No questions assigned to this room' }, { status: 400 });
    }

    // 3. Load authoritative questions with answer keys server-side
    const { data: qRows, error: qErr } = await admin
      .from('questions')
      .select('id, question_text, options, correct_answer, explanation, difficulty')
      .in('id', questionIds);

    if (qErr || !qRows) {
      return NextResponse.json({ error: 'Failed to retrieve authoritative questions' }, { status: 500 });
    }

    // 4. Server-Side Answer Grading & Score Calculation
    let correctCount = 0;
    let incorrectCount = 0;
    const revealMap: Record<string, { correctOptionId: string; explanation?: string; wasCorrect: boolean }> = {};

    for (const q of qRows) {
      const correctOptionId = resolveOptionKey(q.correct_answer, q.options);
      const studentSelectedOption = answers[q.id];

      const wasAnswered = Boolean(studentSelectedOption);
      const wasCorrect = wasAnswered && studentSelectedOption.toLowerCase().trim() === correctOptionId.toLowerCase();

      if (wasCorrect) {
        correctCount += 1;
      } else if (wasAnswered) {
        incorrectCount += 1;
      }

      revealMap[q.id] = {
        correctOptionId,
        explanation: q.explanation || undefined,
        wasCorrect,
      };
    }

    // Standard Academic CEE Marking: +1.0 for correct, -0.25 for incorrect
    const rawScore = (correctCount * 1.0) - (incorrectCount * 0.25);
    const score = Number(Math.max(0, rawScore).toFixed(2));
    const accuracy = questionIds.length > 0 ? Math.round((correctCount / questionIds.length) * 100) : 0;
    const boundedTime = Math.min(room.time_limit_seconds || 300, Math.max(0, Number(timeTakenSeconds) || 0));

    // 5. Submit through atomic RPC
    const { data: rpcData, error: rpcErr } = await admin.rpc('submit_battle_result', {
      p_room_id: room.id,
      p_score: score,
      p_correct_answers: correctCount,
      p_incorrect_answers: incorrectCount,
      p_accuracy: accuracy,
      p_time_taken_seconds: boundedTime,
    });

    if (rpcErr) {
      return NextResponse.json({ error: rpcErr.message }, { status: 500 });
    }

    const resultRow = Array.isArray(rpcData) && rpcData.length > 0 ? rpcData[0] : null;

    return NextResponse.json({
      success: true,
      score,
      correctAnswers: correctCount,
      incorrectAnswers: incorrectCount,
      accuracy,
      timeTakenSeconds: boundedTime,
      ratingChange: resultRow?.rating_change ?? 0,
      newRating: resultRow?.new_rating ?? 1000,
      opponentSubmitted: Boolean(resultRow?.opponent_submitted),
      reveals: revealMap,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal evaluation error' }, { status: 500 });
  }
}
