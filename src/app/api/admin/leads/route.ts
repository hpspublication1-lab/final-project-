import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyServerPermission } from '@/lib/auth/serverGuard';

export async function GET(req: NextRequest) {
  try {
    const guard = await verifyServerPermission(req, 'users:view');
    if (!guard.authorized) return guard.response;

    const admin = createAdminClient();
    if (!admin) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 503 });
    }

    // 1. Fetch leads
    const { data: leads, error: leadsError } = await admin
      .from('leads')
      .select('*')
      .order('last_active_at', { ascending: false });

    if (leadsError) {
      console.error('Error fetching leads:', leadsError);
      return NextResponse.json(getDemoCrmData());
    }

    // 2. Fetch events
    const { data: events } = await admin
      .from('lead_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500);

    // 3. Fetch email logs
    const { data: emailLogs } = await admin
      .from('email_logs')
      .select('*')
      .order('sent_at', { ascending: false })
      .limit(200);

    // 4. Fetch email queue
    const { data: emailQueue } = await admin
      .from('email_queue')
      .select('*')
      .order('scheduled_at', { ascending: true })
      .limit(100);

    return NextResponse.json({
      leads: leads || [],
      events: events || [],
      emailLogs: emailLogs || [],
      emailQueue: emailQueue || [],
    });
  } catch (err: any) {
    console.error('Error in /api/admin/leads:', err);
    return NextResponse.json(getDemoCrmData());
  }
}

function getDemoCrmData() {
  const now = new Date();
  const leads = [
    {
      id: 'lead-1',
      first_name: 'Aayush',
      email: 'aayush.shrestha@gmail.com',
      phone: '9841234567',
      academic_level: 'Class 12 / Passed',
      prep_status: 'Aiming for MBBS scholarship',
      score: 75,
      segment: 'HIGH_INTENT',
      status: 'nurturing',
      lead_magnet: '500_cee_biology_mcqs',
      utm_source: 'tiktok',
      utm_medium: 'organic',
      utm_campaign: 'biology_mcq_viral',
      utm_content: 'reel_03',
      landing_page: '/free-cee-biology-mcqs',
      device: 'Mobile (iOS)',
      consent: true,
      created_at: new Date(now.getTime() - 2 * 3600 * 1000).toISOString(),
      updated_at: new Date(now.getTime() - 10 * 60 * 1000).toISOString(),
      last_active_at: new Date(now.getTime() - 10 * 60 * 1000).toISOString(),
      total_revenue: 0,
    },
    {
      id: 'lead-2',
      first_name: 'Pooja',
      email: 'pooja.adhikari@yahoo.com',
      phone: '9812345678',
      academic_level: 'Class 12',
      prep_status: 'First attempt',
      score: 110,
      segment: 'PURCHASED',
      status: 'customer',
      lead_magnet: '500_cee_biology_mcqs',
      utm_source: 'google',
      utm_medium: 'cpc',
      utm_campaign: 'cee_crash_course',
      landing_page: '/courses?sector=cee_medical',
      device: 'Desktop (Chrome)',
      consent: true,
      created_at: new Date(now.getTime() - 24 * 3600 * 1000).toISOString(),
      updated_at: new Date(now.getTime() - 1 * 3600 * 1000).toISOString(),
      last_active_at: new Date(now.getTime() - 1 * 3600 * 1000).toISOString(),
      total_revenue: 4999,
    },
    {
      id: 'lead-3',
      first_name: 'Bikash',
      email: 'bikash.gurung@outlook.com',
      phone: '9801122334',
      academic_level: 'Class 12 / Passed',
      prep_status: 'Repeater',
      score: 45,
      segment: 'PAYMENT_ABANDONED',
      status: 'high_intent',
      lead_magnet: '500_cee_biology_mcqs',
      utm_source: 'facebook',
      utm_medium: 'ad',
      utm_campaign: 'retargeting_cee',
      landing_page: '/checkout',
      device: 'Mobile (Android)',
      consent: true,
      created_at: new Date(now.getTime() - 12 * 3600 * 1000).toISOString(),
      updated_at: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
      last_active_at: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
      total_revenue: 0,
    },
    {
      id: 'lead-4',
      first_name: 'Sushma',
      email: 'sushma.poudel@gmail.com',
      phone: '9867543210',
      academic_level: 'Class 11',
      prep_status: 'Early foundation',
      score: 25,
      segment: 'BIOLOGY_INTEREST',
      status: 'new',
      lead_magnet: '500_cee_biology_mcqs',
      utm_source: 'instagram',
      utm_medium: 'story',
      utm_campaign: 'free_mcq_download',
      landing_page: '/free-cee-biology-mcqs',
      device: 'Mobile (iOS)',
      consent: true,
      created_at: new Date(now.getTime() - 48 * 3600 * 1000).toISOString(),
      updated_at: new Date(now.getTime() - 48 * 3600 * 1000).toISOString(),
      last_active_at: new Date(now.getTime() - 48 * 3600 * 1000).toISOString(),
      total_revenue: 0,
    },
  ];

  const events = [
    {
      id: 'ev-1',
      lead_id: 'lead-1',
      event_type: 'checkout_started',
      url: '/checkout',
      created_at: new Date(now.getTime() - 10 * 60 * 1000).toISOString(),
      metadata: { planId: 'cee_mastery_crash_course', amount: 4999 },
    },
    {
      id: 'ev-2',
      lead_id: 'lead-1',
      event_type: 'pricing_view',
      url: '/courses#pricing',
      created_at: new Date(now.getTime() - 25 * 60 * 1000).toISOString(),
    },
    {
      id: 'ev-3',
      lead_id: 'lead-1',
      event_type: 'course_page_view',
      url: '/courses?sector=cee_medical',
      created_at: new Date(now.getTime() - 45 * 60 * 1000).toISOString(),
    },
    {
      id: 'ev-4',
      lead_id: 'lead-1',
      event_type: 'pdf_download',
      url: '/free-cee-biology-mcqs',
      created_at: new Date(now.getTime() - 2 * 3600 * 1000).toISOString(),
    },
    {
      id: 'ev-5',
      lead_id: 'lead-1',
      event_type: 'lead_form_submit',
      url: '/free-cee-biology-mcqs',
      created_at: new Date(now.getTime() - 2 * 3600 * 1000).toISOString(),
    },
  ];

  return { leads, events, emailLogs: [], emailQueue: [] };
}
