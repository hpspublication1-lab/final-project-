import { NextResponse } from 'next/server';
import { SUPPORT_CONFIG } from '@/lib/config/support';
import { PAYMENT_METHODS } from '@/lib/config/payments';

export const dynamic = 'force-dynamic';

export async function GET() {
  const config = {
    appName: 'Samyak Guru',
    minAppVersion: '1.0.0',
    latestAppVersion: '1.2.0',
    forceUpdate: false,
    maintenanceMode: false,
    maintenanceMessage: null,
    serverTime: new Date().toISOString(),
    supportedPlatforms: ['android', 'ios', 'web'],
    features: {
      videoPlayback: true,
      offlineDownloads: true,
      liveClasses: true,
      mockExaminations: true,
      aiTutor: true,
      doubts: true,
    },
    activePaymentGateways: [
      { id: 'fonepay', name: 'Fonepay Dynamic QR (50+ Banks)', enabled: PAYMENT_METHODS.fonepay },
    ],
    supportChannels: {
      whatsapp: SUPPORT_CONFIG.phone,
      email: SUPPORT_CONFIG.email,
      phone: SUPPORT_CONFIG.phone,
      hours: SUPPORT_CONFIG.hours,
    },
    emergencyNotice: null,
  };

  return NextResponse.json(
    { success: true, data: config },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    }
  );
}
