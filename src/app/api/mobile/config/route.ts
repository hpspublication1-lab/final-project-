import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const config = {
    appName: 'Samyak Tutor',
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
      { id: 'fonepay', name: 'Fonepay Direct / Dynamic QR', enabled: true },
      { id: 'esewa', name: 'eSewa Mobile Wallet', enabled: true },
      { id: 'manual_bank', name: 'Direct Bank Deposit (Nepal Bank / Nabil)', enabled: true },
    ],
    supportChannels: {
      whatsapp: '+977-9800000000',
      email: 'support@samyaktutor.com',
      phone: '+977-1-4200000',
      hours: 'Sun–Fri 07:00 – 20:00 NPT',
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
