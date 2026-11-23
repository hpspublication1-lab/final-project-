import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getSessionUser } from '@/lib/supabase/route-auth';

/**
 * Grade one Battle Arena answer, on the server.
 *
 * /api/arena/questions correctly strips `correct_answer` before replying, but
 * the client still read that field to decide what the right option was. With
 * the field absent, its resolver fell through to its default and returned 'a'
 * for every question — so answering A always scored, and answering correctly
 * scored nothing. This route is where that decision belongs.
 *
 * It also replaces the client's direct INSERT into battle_answers, which let a
 * player write their own `is_correct`.
 *
 * Returns the verdict for the question just answered. That is safe: the answer
 * is already locked in and cannot be changed.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
    }

    const admin = createAdminClient();
    if (!admin) {
      console.error('Supabase service role key is not configured.');
      return NextResponse.json({ error: 'Arena unavailable' }, { status: 503 });
    }

    const body = await req.json().catch(() => null);
    const roomId: string | undefined = body?.roomId;
    const questionId: string | undefined = body?.questionId;
    const selectedOption: string | undefined = body?.selectedOption;
    const questionIndex: number = Number(body?.questionIndex ?? 0);
    const timeTakenSeconds: number | null =
      body?.timeTakenSeconds === undefined ? null : Number(body.timeTakenSeconds);

    if (!roomId || !questionId) {
      return NextResponse.json({ error: 'roomId and questionId are required' }, { status: 400 });
    }

    const picked = String(selectedOption ?? '').trim().toLowerCase();
    if (picked && !['a', 'b', 'c', 'd'].includes(picked)) {
      return NextResponse.json({ error: 'selectedOption must be a, b, c or d' }, { status: 400 });
    }

    // The caller must be in this room, and the question must belong to it.
    const { data: room, error: roomErr } = await admin
      .from('battle_rooms')
      .select('id, question_ids, player_one, player_two')
      .eq('id', roomId)
      .maybeSingle();

    if (roomErr || !room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    if (![room.player_one, room.player_two].includes(user.id)) {
      return NextResponse.json({ error: 'Not a participant in this room' }, { status: 403 });
    }

    const roomQuestionIds: string[] = room.question_ids ?? [];
    if (roomQuestionIds.length > 0 && !roomQuestionIds.includes(questionId)) {
      return NextResponse.json({ error: 'Question is not part of this room' }, { status: 400 });
    }

    // An answer already recorded wins. Re-submitting cannot improve a score.
    const { data: existing } = await admin
      .from('battle_answers')
      .select('is_correct, selected_option')
      .eq('room_id', roomId)
      .eq('player_id', user.id)
      .eq('question_id', questionId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({
        success: true,
        alreadyAnswered: true,
        isCorrect: existing.is_correct,
        correctOption: await correctOptionFor(admin, questionId),
      });
    }

    const correctOption = await correctOptionFor(admin, questionId);
    if (!correctOption) {
      return NextResponse.json(
        { error: 'This question has no usable answer key and cannot be graded' },
        { status: 422 }
      );
    }

    const isCorrect = picked === correctOption;

    const { error: insertErr } = await admin.from('battle_answers').insert({
      room_id: roomId,
      player_id: user.id,
      question_id: questionId,
      question_index: Number.isFinite(questionIndex) ? questionIndex : 0,
      selected_option: picked || null,
      is_correct: isCorrect,
      time_taken_seconds: Number.isFinite(timeTakenSeconds as number) ? timeTakenSeconds : null,
    });

    if (insertErr) {
      console.error('Failed to record battle answer:', insertErr.message);
      return NextResponse.json({ error: 'Could not record answer' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      alreadyAnswered: false,
      isCorrect,
      correctOption,
    });
  } catch (err: any) {
    console.error('Arena answer error:', err?.message);
    return NextResponse.json({ error: 'Failed to record answer' }, { status: 500 });
  }
}

/**
 * Resolve a question's stored answer to a single option letter.
 *
 * `correct_answer` may hold a letter, an index, or the option's text,
 * depending on when the row was written. A bare index is ambiguous between
 * 0- and 1-based, so it is read as 0-based to match the client's historic
 * behaviour, and the option text is tried first because it is unambiguous.
 */
async function correctOptionFor(
  admin: ReturnType<typeof createAdminClient>,
  questionId: string
): Promise<string | null> {
  const { data } = await admin!
    .from('questions')
    .select('correct_answer, correct_option, options')
    .eq('id', questionId)
    .maybeSingle();

  if (!data) return null;

  const letters = ['a', 'b', 'c', 'd'];
  const raw = String(data.correct_answer ?? data.correct_option ?? '').trim();
  if (!raw) return null;

  if (/^[a-d]$/i.test(raw)) return raw.toLowerCase();
  if (/^option[_ ]?[a-d]$/i.test(raw)) return raw.slice(-1).toLowerCase();

  const options: string[] = Array.isArray(data.options)
    ? (data.options as string[])
    : typeof data.options === 'string'
      ? safeParseArray(data.options)
      : [];

  const byText = options.findIndex(
    (o) => typeof o === 'string' && o.trim().toLowerCase() === raw.toLowerCase()
  );
  if (byText >= 0 && byText < 4) return letters[byText];

  if (/^\d+$/.test(raw)) {
    const index = parseInt(raw, 10);
    if (index >= 0 && index < 4) return letters[index];
  }

  return null;
}

function safeParseArray(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
