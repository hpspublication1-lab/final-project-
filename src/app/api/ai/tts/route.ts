import { NextRequest, NextResponse } from 'next/server';
import { VOICE_PERSONAS } from '@/lib/ai/voices';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const { text, persona = 'coach_aria' } = await request.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text required' }, { status: 400 });
    }

    if (!ELEVENLABS_API_KEY) {
      return NextResponse.json({ error: 'ElevenLabs API key missing' }, { status: 500 });
    }

    const voiceId = VOICE_PERSONAS[persona as keyof typeof VOICE_PERSONAS] || VOICE_PERSONAS.coach_aria;

    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        text: text.slice(0, 1000), // Max 1000 chars per stream for speed
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.2,
          use_speaker_boost: true,
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn('ElevenLabs API error:', errText);
      return NextResponse.json({ error: 'ElevenLabs TTS failed', details: errText }, { status: res.status });
    }

    const audioBuffer = await res.arrayBuffer();

    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (error) {
    console.error('TTS API error:', error);
    return NextResponse.json({ error: 'Internal TTS server error' }, { status: 500 });
  }
}
