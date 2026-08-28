import 'server-only';

const HEYGEN_API_KEY = process.env.HEYGEN_API_KEY;

export interface HeygenSessionResponse {
  sessionId: string;
  token: string;
  sdpOffer?: any;
  iceServers?: any[];
  avatarId: string;
}

export const HEYGEN_AVATARS = {
  coach_aria: 'Ann_Doctor_Sitting_public', // Female British Academic Teacher
  dr_neuro: 'Edward_Teacher_Sitting_public', // Male Science Professor
  prof_sigma: 'Bryan_IT_Expert_public', // Male Engineering Mentor
};

/** Negotiate HeyGen Interactive Streaming Avatar Session */
export async function createHeygenStreamingSession(
  persona: keyof typeof HEYGEN_AVATARS = 'coach_aria'
): Promise<HeygenSessionResponse | null> {
  if (!HEYGEN_API_KEY) {
    return null;
  }

  try {
    const avatarId = HEYGEN_AVATARS[persona] || HEYGEN_AVATARS.coach_aria;

    // Step 1: Create session token
    const tokenRes = await fetch('https://api.heygen.com/v1/streaming.create_token', {
      method: 'POST',
      headers: {
        'x-api-key': HEYGEN_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!tokenRes.ok) {
      console.warn('HeyGen token generation failed:', await tokenRes.text());
      return null;
    }

    const { data: { token } } = await tokenRes.json();

    // Step 2: Initialize Realtime Streaming Session
    const sessionRes = await fetch('https://api.heygen.com/v1/streaming.new', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        quality: 'medium',
        avatar_name: avatarId,
        voice: {
          voice_id: '21m00Tcm4TlvDq8ikWAM', // ElevenLabs integration token
        },
      }),
    });

    if (!sessionRes.ok) {
      console.warn('HeyGen session creation failed:', await sessionRes.text());
      return null;
    }

    const { data } = await sessionRes.json();

    return {
      sessionId: data.session_id,
      token,
      sdpOffer: data.sdp,
      iceServers: data.ice_servers,
      avatarId,
    };
  } catch (error) {
    console.error('HeyGen API client error:', error);
    return null;
  }
}

/** Send Text Command to HeyGen Streaming Avatar */
export async function speakHeygenAvatar(sessionId: string, token: string, text: string): Promise<boolean> {
  if (!HEYGEN_API_KEY || !sessionId) return false;

  try {
    const res = await fetch('https://api.heygen.com/v1/streaming.task', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        session_id: sessionId,
        text,
        task_type: 'repeat',
      }),
    });

    return res.ok;
  } catch {
    return false;
  }
}
