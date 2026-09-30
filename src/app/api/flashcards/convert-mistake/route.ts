import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required', details: 'Please log in to add items to your personal flashcards.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { front, back, hint, subjectId, chapterId, topic } = body;

    if (!front || !back) {
      return NextResponse.json(
        { error: 'Invalid payload', details: 'Both front (question) and back (answer/solution) are required.' },
        { status: 400 }
      );
    }

    const admin = createAdminClient() || supabase;

    // 1. Insert into flashcards
    const flashcardPayload: Record<string, any> = {
      front: String(front).trim(),
      back: String(back).trim(),
      hint: hint ? String(hint).trim() : null,
      created_by: user.id,
      is_active: true,
      is_premium: false,
    };

    if (subjectId && /^[0-9a-fA-F-]{36}$/.test(subjectId)) {
      flashcardPayload.subject_id = subjectId;
    }
    if (chapterId && /^[0-9a-fA-F-]{36}$/.test(chapterId)) {
      flashcardPayload.chapter_id = chapterId;
    }

    const { data: newCard, error: insertCardError } = await admin
      .from('flashcards')
      .insert(flashcardPayload)
      .select('id, front, back, hint, created_at')
      .single();

    if (insertCardError) {
      console.warn('Direct flashcards table insert error (falling back to client local deck):', insertCardError.message);
      // Return a simulated success so the student client can store in local storage without breaking the session
      return NextResponse.json({
        ok: true,
        stored: 'local_fallback',
        flashcard: {
          id: 'local-' + Date.now(),
          front,
          back,
          hint,
          due_at: new Date().toISOString(),
          topic: topic || 'Custom Mistake',
        },
        message: 'Saved to your personal offline review deck.',
      });
    }

    // 2. Schedule immediate review in flashcard_reviews (SM-2)
    const { error: reviewError } = await admin
      .from('flashcard_reviews')
      .upsert({
        student_id: user.id,
        flashcard_id: newCard.id,
        ease_factor: 2.50,
        interval_days: 0,
        repetitions: 0,
        due_at: new Date().toISOString(),
      }, { onConflict: 'student_id,flashcard_id' });

    if (reviewError) {
      console.warn('Initial flashcard_reviews entry notice:', reviewError.message);
    }

    return NextResponse.json({
      ok: true,
      stored: 'database',
      flashcard: newCard,
      message: 'Mistake successfully converted to an active SM-2 Flashcard! It is now scheduled in your flashcards queue.',
    });
  } catch (err: any) {
    console.error('Failed to convert mistake to flashcard:', err);
    return NextResponse.json(
      { error: 'Internal Server Error', details: err?.message || 'Failed to create flashcard' },
      { status: 500 }
    );
  }
}
