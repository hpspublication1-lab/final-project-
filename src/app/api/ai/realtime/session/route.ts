import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getStudentProfile } from '@/lib/ai/agents/studentProfile';
import { VOICE_PERSONAS } from '@/app/api/ai/tts/route';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const userId = user?.id || 'guest_student';
    const { persona = 'coach_aria', subject = 'IELTS Masterclass' } = await request.json();

    // Fetch RAG Student Context
    const profile = userId !== 'guest_student' ? await getStudentProfile(userId, 'ielts') : null;

    const voiceId = VOICE_PERSONAS[persona as keyof typeof VOICE_PERSONAS] || VOICE_PERSONAS.coach_aria;

    // Generate Ephemeral Realtime Session Config
    const sessionConfig = {
      sessionId: `sess_realtime_${Date.now()}_${userId.slice(0, 8)}`,
      persona,
      subject,
      voiceId,
      ragContext: {
        strongTopics: profile?.strongTopics || [],
        weakTopics: profile?.weakTopics || ['Grammatical Range', 'Coherence & Cohesion'],
        targetBand: profile?.targetBand || 8.0,
      },
      instructions: `You are Live Teacher ${persona.toUpperCase()} conducting a 1-on-1 spoken class on ${subject}. Respond with crisp, encouraging, academic English. Keep responses under 3 sentences for fluid voice conversation.`,
      wsEndpoint: 'wss://api.openai.com/v1/realtime',
    };

    return NextResponse.json(sessionConfig);
  } catch (error) {
    console.error('Realtime Session API error:', error);
    return NextResponse.json(
      { error: 'Failed to negotiate realtime AI session' },
      { status: 500 }
    );
  }
}
