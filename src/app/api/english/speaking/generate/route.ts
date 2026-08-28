import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { assertAiQuota } from '@/lib/ai/completion';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export interface IeltsSpeakingTask {
  id: string;
  part: 1 | 2 | 3;
  topic: string;
  part1Questions?: string[];
  cueCard?: {
    title: string;
    bulletPoints: string[];
    prepTimeSeconds: number;
    speakTimeSeconds: number;
    keyVocabulary: string[];
  };
  part3Questions?: string[];
}

const CUE_CARD_CATEGORIES = [
  'Describe a memorable journey you took in Nepal or abroad',
  'Describe a person who has strongly influenced your life decisions',
  'Describe a piece of technology you use every day that saves you time',
  'Describe an environmental challenge facing your city or country',
  'Describe a traditional festival or cultural event in your community',
  'Describe an accomplishment or goal you achieved after hard work',
  'Describe a book, film, or documentary that made a lasting impression on you',
  'Describe a business, startup, or career path you find inspiring',
];

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required', details: 'Sign in to access IELTS Speaking live practice.' },
        { status: 401 }
      );
    }

    await assertAiQuota(user.id);

    const body = await request.json().catch(() => ({}));
    const part = body.part || 2;
    const requestedTopic = body.topic;

    if (!OPENAI_API_KEY) {
      // Fallback generator if no key configured
      return NextResponse.json(getFallbackTask(part));
    }

    const randomCategory = requestedTopic || CUE_CARD_CATEGORIES[Math.floor(Math.random() * CUE_CARD_CATEGORIES.length)];

    const prompt = `You are an official IELTS Speaking Senior Examiner creating a real exam card.
Generate an authentic IELTS Speaking test for Part ${part}.

Target topic category: "${randomCategory}"

Return ONLY valid JSON with this exact structure:
{
  "id": "speaking_${Date.now()}",
  "part": ${part},
  "topic": "${randomCategory}",
  "part1Questions": [
    "Question 1 (intro/personal)",
    "Question 2 (daily routine/habits)",
    "Question 3 (preferences/opinion)",
    "Question 4 (future outlook)"
  ],
  "cueCard": {
    "title": "Clear cue card title starting with 'Describe a...'",
    "bulletPoints": [
      "What or who it is",
      "When or where it happened / occurs",
      "What key actions or features were involved",
      "And explain why it was significant or memorable to you"
    ],
    "prepTimeSeconds": 60,
    "speakTimeSeconds": 120,
    "keyVocabulary": ["band 8+ word 1", "collocation 2", "idiomatic phrase 3", "academic term 4"]
  },
  "part3Questions": [
    "Abstract/analytical question 1 extending Part 2 topic to societal/global level",
    "Compare and contrast question 2 regarding historical vs modern trends",
    "Future prediction question 3 regarding technology or social change"
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
        temperature: 0.7,
        response_format: { type: 'json_object' },
      }),
    });

    if (!res.ok) {
      return NextResponse.json(getFallbackTask(part));
    }

    const data = await res.json();
    const rawJson = data.choices?.[0]?.message?.content || '{}';

    try {
      const task = JSON.parse(rawJson);
      return NextResponse.json(task);
    } catch {
      return NextResponse.json(getFallbackTask(part));
    }
  } catch (error) {
    console.error('IELTS Speaking task generation error:', error);
    return NextResponse.json(getFallbackTask(2));
  }
}

function getFallbackTask(part: number): IeltsSpeakingTask {
  return {
    id: `speaking_fallback_${Date.now()}`,
    part: (part as 1 | 2 | 3) || 2,
    topic: 'Describe a memorable personal achievement',
    part1Questions: [
      'What do you usually do in your free time?',
      'Do you prefer spending time indoors or outdoors?',
      'How has your daily routine changed in the past few years?',
      'Is there a new skill you would like to learn in the future?',
    ],
    cueCard: {
      title: 'Describe a goal or achievement you reached after hard work',
      bulletPoints: [
        'What the goal or achievement was',
        'When you started working towards it',
        'What challenges you had to overcome along the way',
        'And explain how you felt when you finally succeeded',
      ],
      prepTimeSeconds: 60,
      speakTimeSeconds: 120,
      keyVocabulary: ['perseverance', 'unwavering determination', 'milestone', 'immense satisfaction'],
    },
    part3Questions: [
      'Why do some people set unrealistic goals for themselves?',
      'How has technology affected the way young people achieve success today?',
      'Do you think personal achievements are valued differently in modern society compared to the past?',
    ],
  };
}
