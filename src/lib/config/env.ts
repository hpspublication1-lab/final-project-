/**
 * Central Environment Validation Module
 * Validates presence of critical infrastructure configuration without leaking secret values.
 */

export interface EnvValidationReport {
  isValid: boolean;
  database: { configured: boolean; message: string };
  payments: { configured: boolean; message: string };
  videoStream: { configured: boolean; message: string };
  liveClass: { configured: boolean; message: string };
  aiServices: { configured: boolean; message: string };
  missingKeys: string[];
}

export function validateEnvironment(): EnvValidationReport {
  const missingKeys: string[] = [];

  // 1. Supabase Database & Auth
  const hasDbUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  const hasAnonKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!hasDbUrl) missingKeys.push('NEXT_PUBLIC_SUPABASE_URL');
  if (!hasAnonKey) missingKeys.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  if (!hasServiceKey) missingKeys.push('SUPABASE_SERVICE_ROLE_KEY');

  // 2. Fonepay Gateway
  const hasFonepayMerchant = !!process.env.FONEPAY_MERCHANT_CODE;
  const hasFonepaySecret = !!process.env.FONEPAY_SECRET_KEY;
  if (!hasFonepayMerchant) missingKeys.push('FONEPAY_MERCHANT_CODE');
  if (!hasFonepaySecret) missingKeys.push('FONEPAY_SECRET_KEY');

  // 3. Bunny.net Video Stream
  const hasBunnyLib = !!process.env.BUNNY_LIBRARY_ID;
  const hasBunnyKey = !!process.env.BUNNY_STREAM_API_KEY;
  if (!hasBunnyLib) missingKeys.push('BUNNY_LIBRARY_ID');
  if (!hasBunnyKey) missingKeys.push('BUNNY_STREAM_API_KEY');

  // 4. 100ms Live Classrooms
  const hasHmsKey = !!process.env.HMS_APP_ACCESS_KEY;
  const hasHmsSecret = !!process.env.HMS_APP_SECRET;
  if (!hasHmsKey) missingKeys.push('HMS_APP_ACCESS_KEY');
  if (!hasHmsSecret) missingKeys.push('HMS_APP_SECRET');

  // 5. AI Services
  const hasOpenAi = !!process.env.OPENAI_API_KEY;
  if (!hasOpenAi) missingKeys.push('OPENAI_API_KEY');

  return {
    isValid: missingKeys.length === 0,
    database: {
      configured: hasDbUrl && hasAnonKey && hasServiceKey,
      message: hasDbUrl && hasAnonKey && hasServiceKey ? 'Supabase online' : 'Missing Supabase credentials',
    },
    payments: {
      configured: hasFonepayMerchant && hasFonepaySecret,
      message: hasFonepayMerchant && hasFonepaySecret ? 'Fonepay configured' : 'Missing Fonepay credentials',
    },
    videoStream: {
      configured: hasBunnyLib && hasBunnyKey,
      message: hasBunnyLib && hasBunnyKey ? 'Bunny.net configured' : 'Missing Bunny.net credentials',
    },
    liveClass: {
      configured: hasHmsKey && hasHmsSecret,
      message: hasHmsKey && hasHmsSecret ? '100ms Live configured' : 'Missing 100ms credentials',
    },
    aiServices: {
      configured: hasOpenAi,
      message: hasOpenAi ? 'OpenAI AI Tutor configured' : 'Missing OpenAI API Key',
    },
    missingKeys,
  };
}
