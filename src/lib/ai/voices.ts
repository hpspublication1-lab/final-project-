// Official ElevenLabs High-Yield Voice IDs
export const VOICE_PERSONAS = {
  coach_aria: 'EXAVITQu4vr4xnSDxMaL', // Bella - Clear British/Academic Tone
  dr_neuro: '21m00Tcm4TlvDq8ikWAM', // Rachel - Academic Professor
  prof_sigma: 'ErXwobaYiN019PkySvjV', // Antoni - Deep Analytical Male
  ms_lexis: 'AZnzlk1XvdvUeBnXmlld', // Domi - Professional Evaluator
} as const;

export type VoicePersonaKey = keyof typeof VOICE_PERSONAS;
