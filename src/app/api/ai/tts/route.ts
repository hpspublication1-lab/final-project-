import { NextRequest, NextResponse } from 'next/server';
import { VOICE_PERSONAS } from '@/lib/ai/voices';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, enforceRateLimit } from '@/lib/security/rateLimiter';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

export async function POST(request: NextRequest) {
  try {
    // 1. Mandatory authentication check (fails safely)
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required to generate AI speech audio.' },
        { status: 401 }
      );
    }

    // 2. User-bound rate limiting (cannot be bypassed by spoofing IP/proxy headers)
    const userRl = await checkRateLimit(`ai-tts:user:${user.id}`, 20, 60 * 1000);
    if (!userRl.allowed) {
      return NextResponse.json(
        { error: 'Too many voice generation requests. Please slow down.' },
        { status: 429, headers: { 'Retry-After': String(userRl.resetSeconds) } }
      );
    }

    // 3. IP-based rate limiting as defense-in-depth (ai preset: 15 req / 60s)
    const ipRl = await enforceRateLimit(request, 'ai', 'ai-tts');
    if (!ipRl.allowed) {
      return NextResponse.json(
        { error: 'Too many voice generation requests from this IP address.' },
        { status: 429, headers: { 'Retry-After': String(ipRl.resetSeconds) } }
      );
    }

    // 4. Safe body parsing and input validation
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 });
    }

    const { text, persona = 'coach_aria' } = body || {};

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json({ error: 'Text required' }, { status: 400 });
    }

    if (!ELEVENLABS_API_KEY) {
      return NextResponse.json({ error: 'ElevenLabs API key missing or unconfigured' }, { status: 503 });
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
