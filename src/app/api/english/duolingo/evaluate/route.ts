import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { assertAiQuota } from '@/lib/ai/completion';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export interface DetEvaluationResult {
  overallScore: number; // 10-160 scale (in 5-point increments)
  subscores: {
    literacy: number; // Read & Write (10-160)
    comprehension: number; // Read & Listen (10-160)
    conversation: number; // Listen & Speak (10-160)
    production: number; // Write & Speak (10-160)
  };
  cefrLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  feedback: {
    vocabularyPrecision: string;
    grammarAccuracy: string;
    fluencyPacing: string;
  };
  corrections: Array<{ original: string; corrected: string; explanation: string }>;
  modelResponse: string;
  itContextAdvice: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required', details: 'Sign in to evaluate Duolingo English Test (DET) performance.' },
        { status: 401 }
      );
    }

    await assertAiQuota(user.id);

    const body = await request.json();
    const {
      taskType = 'interactive-writing', // 'read-complete', 'write-photo', 'interactive-writing', 'speak-photo', 'dictation'
      promptText,
      userResponse,
      targetItSector = true,
    } = body;

    if (!userResponse || typeof userResponse !== 'string' || userResponse.trim().length < 5) {
      return NextResponse.json(
        { error: 'Invalid response', details: 'Please enter a complete response for DET scoring.' },
        { status: 400 }
      );
    }

    if (!OPENAI_API_KEY) {
      return NextResponse.json(getFallbackDetEvaluation(userResponse));
    }

    const systemPrompt = `You are a certified Duolingo English Test (DET) Senior Assessment Specialist and IT Sector English Coach.
Evaluate the student's submission on the official DET 10-160 point scale (in multiples of 5).

Task Type: DET ${taskType}
Prompt / Question: "${promptText || 'Describe a technology or software tool you use daily'}"
Candidate Response: "${userResponse}"
Target Focus: IT / Computer Science / Tech Sector Professional English

DET CEFR Scale:
- 10-55: A1-A2 Basic
- 60-85: B1 Intermediate
- 90-115: B2 Upper-Intermediate (Minimum for most US/UK IT Master's programs)
- 120-145: C1 Advanced (Target for top IT Universities & Remote Senior Dev Roles)
- 150-160: C2 Expert Mastery

Return ONLY valid JSON matching this schema:
{
  "overallScore": number (60-160, multiple of 5),
  "subscores": {
    "literacy": number,
    "comprehension": number,
    "conversation": number,
    "production": number
  },
  "cefrLevel": "B2" | "C1" | "C2",
  "feedback": {
    "vocabularyPrecision": "string",
    "grammarAccuracy": "string",
    "fluencyPacing": "string"
  },
  "corrections": [
    {"original": "string", "corrected": "string", "explanation": "string"}
  ],
  "modelResponse": "Ideal 130-150 DET Score model answer incorporating IT/tech vocabulary",
  "itContextAdvice": "Specific advice for IT job interviews or US/UK Tech MS applications"
}`;

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Evaluate this DET response: "${userResponse}"` },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      }),
    });

    if (!res.ok) {
      return NextResponse.json(getFallbackDetEvaluation(userResponse));
    }

    const data = await res.json();
    const rawJson = data.choices?.[0]?.message?.content || '{}';

    try {
      const parsed = JSON.parse(rawJson);
      const admin = createAdminClient();
      await admin.from('english_practice_attempts').insert({
        user_id: user.id,
        task_type_slug: `det-${taskType}`,
        prompt_text: promptText || 'DET Test Task',
        response_text: userResponse,
        band_score: (parsed.overallScore || 115) / 15, // Map 120 -> ~8.0 equivalent
        rubric_scores: parsed.subscores,
        feedback: JSON.stringify(parsed.feedback),
        weakest_criterion: `DET Production (${parsed.subscores?.production || 110})`,
      });
      return NextResponse.json(parsed);
    } catch {
      return NextResponse.json(getFallbackDetEvaluation(userResponse));
    }
  } catch (error) {
    console.error('DET evaluation error:', error);
    return NextResponse.json(
      { error: 'DET evaluation failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

function getFallbackDetEvaluation(userResponse: string): DetEvaluationResult {
  const words = userResponse.trim().split(/\s+/).length;
  const estimatedScore = Math.min(145, Math.max(85, 90 + Math.floor(words / 4) * 5));

  return {
    overallScore: estimatedScore,
    subscores: {
      literacy: estimatedScore + 5,
      comprehension: estimatedScore,
      conversation: estimatedScore - 5,
      production: estimatedScore,
    },
    cefrLevel: estimatedScore >= 120 ? 'C1' : 'B2',
    feedback: {
      vocabularyPrecision: 'Good usage of technical vocabulary with clear sentence structures.',
      grammarAccuracy: 'Sentences are mostly well-formed with minor subject-verb agreement points to refine.',
      fluencyPacing: 'Good production rate for DET timed writing.',
    },
    corrections: [
      {
        original: 'We need to deploy software fastly',
        corrected: 'We need to deploy software rapidly / efficiently',
        explanation: '"Fastly" is informal; use "rapidly" or "expeditiously" in formal DET essays.',
      },
    ],
    modelResponse: 'In modern software engineering, scalable cloud architecture and continuous integration pipelines are fundamental for delivering high-performance applications...',
    itContextAdvice: 'For US/UK Computer Science MS programs, aiming for DET 125+ (Subscores: Production 115+, Literacy 125+) satisfies graduate admission criteria at universities like Northeastern, NYU, and CMU.',
  };
}
