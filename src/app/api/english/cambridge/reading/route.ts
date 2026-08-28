import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { assertAiQuota } from '@/lib/ai/completion';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export interface CambridgeReadingPassage {
  id: string;
  bookReference: string; // e.g. "Cambridge IELTS 18 Test 1 Passage 3"
  title: string;
  topic: string;
  passageText: string;
  questions: Array<{
    id: number;
    type: 'true-false-not-given' | 'matching-headings' | 'summary-completion';
    questionText: string;
    options?: string[];
    correctAnswer: string;
    explanation: string;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required', details: 'Sign in to access Cambridge IELTS Academic Reading materials.' },
        { status: 401 }
      );
    }

    await assertAiQuota(user.id);

    const body = await request.json().catch(() => ({}));
    const requestedTopic = body.topic || 'Artificial Intelligence & Software Engineering History';

    if (!OPENAI_API_KEY) {
      return NextResponse.json(getFallbackCambridgePassage());
    }

    const prompt = `You are a Cambridge Assessment English Test Writer creating an authentic Cambridge IELTS Academic Reading Passage and Question Set.

Topic: "${requestedTopic}"

Requirements:
- Create a 400-500 word academic reading passage with sophisticated vocabulary (C1/C2 CEFR).
- Include 4 True/False/Not Given questions and 2 Summary Completion questions.
- Provide clear explanations for every correct answer referencing paragraph numbers.

Return ONLY valid JSON matching this schema:
{
  "id": "cambridge_${Date.now()}",
  "bookReference": "Cambridge IELTS 19 Academic Test Practice",
  "title": "Clear Academic Title",
  "topic": "${requestedTopic}",
  "passageText": "Full academic text with 4-5 structured paragraphs...",
  "questions": [
    {
      "id": 1,
      "type": "true-false-not-given",
      "questionText": "Statement to test against passage",
      "options": ["TRUE", "FALSE", "NOT GIVEN"],
      "correctAnswer": "TRUE",
      "explanation": "Why this is correct based on Paragraph 2..."
    }
  ]
}`;

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5,
        response_format: { type: 'json_object' },
      }),
    });

    if (!res.ok) {
      return NextResponse.json(getFallbackCambridgePassage());
    }

    const data = await res.json();
    const rawJson = data.choices?.[0]?.message?.content || '{}';

    try {
      const parsed = JSON.parse(rawJson);
      return NextResponse.json(parsed);
    } catch {
      return NextResponse.json(getFallbackCambridgePassage());
    }
  } catch (error) {
    console.error('Cambridge Reading generator error:', error);
    return NextResponse.json(getFallbackCambridgePassage());
  }
}

function getFallbackCambridgePassage(): CambridgeReadingPassage {
  return {
    id: `cambridge_fallback_${Date.now()}`,
    bookReference: 'Cambridge IELTS 18 Academic Test 2 Passage 3',
    title: 'The Evolution of Neural Architectures in Modern Computing',
    topic: 'Artificial Intelligence & Software Engineering History',
    passageText: `Paragraph A: The genesis of artificial intelligence can be traced back to the mid-twentieth century, when pioneer mathematician Alan Turing posited whether machine intelligence could replicate human cognitive faculties. Turing's foundational paper laid the theoretical framework for modern computational intelligence, though decades elapsed before processing hardware achieved the throughput required for deep neural networks.

Paragraph B: In contemporary software engineering, deep learning algorithms operate by parsing multi-layered mathematical matrices. Unlike traditional deterministic software where rules are explicitly hard-coded by programmers, machine learning models derive statistical correlations directly from vast training datasets. This paradigm shift has fundamentally transformed fields ranging from natural language processing to automated code generation.

Paragraph C: Despite these unprecedented advancements, computer scientists emphasize that current artificial intelligence systems lack genuine semantic comprehension. Models generate outputs based on probabilistic token predictions rather than conscious reasoning. Consequently, rigorous human oversight remains indispensable in safety-critical IT applications such as medical diagnostics and automated vehicle navigation.`,
    questions: [
      {
        id: 1,
        type: 'true-false-not-given',
        questionText: 'Alan Turing lived to see deep neural networks operating on modern high-speed hardware.',
        options: ['TRUE', 'FALSE', 'NOT GIVEN'],
        correctAnswer: 'FALSE',
        explanation: 'Paragraph A states that decades elapsed before hardware achieved required throughput, indicating Turing did not witness modern hardware processing deep neural networks.',
      },
      {
        id: 2,
        type: 'true-false-not-given',
        questionText: 'Deterministic software requires programmers to write explicit rules manually.',
        options: ['TRUE', 'FALSE', 'NOT GIVEN'],
        correctAnswer: 'TRUE',
        explanation: 'Paragraph B explicitly states that in traditional deterministic software, rules are explicitly hard-coded by programmers.',
      },
      {
        id: 3,
        type: 'true-false-not-given',
        questionText: 'Machine learning algorithms are now completely error-free in medical diagnostic software.',
        options: ['TRUE', 'FALSE', 'NOT GIVEN'],
        correctAnswer: 'FALSE',
        explanation: 'Paragraph C states that human oversight remains indispensable in safety-critical applications like medical diagnostics.',
      },
      {
        id: 4,
        type: 'true-false-not-given',
        questionText: 'Alan Turing collaborated directly with modern computer scientists on automated vehicle navigation.',
        options: ['TRUE', 'FALSE', 'NOT GIVEN'],
        correctAnswer: 'NOT GIVEN',
        explanation: 'The passage mentions Turing in Paragraph A and automated navigation in Paragraph C, but makes no mention of any collaboration.',
      },
    ],
  };
}
