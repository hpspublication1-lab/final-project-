import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getStudentProfile } from '@/lib/ai/agents/studentProfile';
import { createHeygenStreamingSession, speakHeygenAvatar } from '@/lib/ai/heygen';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const {
      studentInput,
      persona = 'coach_aria',
      sessionId,
      token,
    } = await request.json();

    // STAGE 1: Knowledge Retrieval (RAG) & Student Profile
    const profile = await getStudentProfile(user.id, 'ielts');

    // STAGE 2: Teacher Reasoning & Personalization via OpenAI Realtime Engine
    let responseText = `Welcome back! I am your AI teacher. Let us focus on improving your ${profile?.weakTopics?.[0] || 'English fluency'} today.`;

    if (studentInput && OPENAI_API_KEY) {
      const ragPrompt = `You are Live Teacher ${persona.toUpperCase()}.
Student Profile: Target Band ${profile?.targetBand || 8.0}, Weak Areas: ${profile?.weakTopics?.join(', ') || 'Fluency'}.
Student Spoke/Typed: "${studentInput}"

Provide a highly personalized, academic, 2-sentence direct spoken response suitable for video avatar lip-syncing:`;

      const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [{ role: 'user', content: ragPrompt }],
          temperature: 0.3,
          max_tokens: 150,
        }),
      });

      if (aiRes.ok) {
        const data = await aiRes.json();
        responseText = data.choices?.[0]?.message?.content || responseText;
      }
    }

    // STAGE 3: HeyGen Avatar Task Dispatch
    let heygenDispatched = false;
    if (sessionId && token) {
      heygenDispatched = await speakHeygenAvatar(sessionId, token, responseText);
    }

    // If session creation requested
    let newSession = null;
    if (!sessionId) {
      newSession = await createHeygenStreamingSession(persona as any);
    }

    return NextResponse.json({
      responseText,
      heygenDispatched,
      session: newSession,
      personalizedContext: {
        weakTopics: profile?.weakTopics || [],
        targetBand: profile?.targetBand || 8.0,
      },
    });
  } catch (error) {
    console.error('HeyGen pipeline API error:', error);
    return NextResponse.json(
      { error: 'Failed to process HeyGen teacher pipeline' },
      { status: 500 }
    );
  }
}
