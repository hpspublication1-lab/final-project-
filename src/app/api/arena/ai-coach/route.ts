import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, roomId, score, accuracy, subject } = body;

    // AI Arena Coach analysis payload
    const coachReport = {
      summary: `You completed the ${subject || 'CEE'} battle with ${accuracy || 75}% accuracy and an average response time of 14s per MCQ.`,
      strengths: [`Strong speed on ${subject || 'Biology'} direct recall questions`],
      weaknesses: [`Slight drop in accuracy on multi-step numericals`],
      recommendedTopics: [
        { topic: 'Organic Reactions', type: 'MCQ Practice', url: '/practice?subject=chemistry' },
        { topic: 'Current Electricity Numericals', type: 'Speed Drill', url: '/practice?subject=physics' },
      ],
      aiTip: 'Try solving Physics numericals using dimensional elimination to shave off 4 seconds per question.',
    };

    return NextResponse.json({ report: coachReport });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'AI Coach analysis failed' }, { status: 500 });
  }
}
