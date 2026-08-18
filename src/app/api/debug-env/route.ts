export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';

export async function GET() {
  const pw = process.env.FONEPAY_PASSWORD ?? '';
  return NextResponse.json({
    passwordLength: pw.length,
    expectedLength: 'APPLE12345.6ss$'.length, // 15
    lastChar: pw.length > 0 ? pw[pw.length - 1] : '',
    endsWith$: pw.endsWith('$'),
    fonepayEnv: process.env.FONEPAY_ENV,
    merchantCodeLength: (process.env.FONEPAY_MERCHANT_CODE ?? '').length,
    usernameLength: (process.env.FONEPAY_USERNAME ?? '').length,
    secretKeyLength: (process.env.FONEPAY_SECRET_KEY ?? '').length,
  });
}
