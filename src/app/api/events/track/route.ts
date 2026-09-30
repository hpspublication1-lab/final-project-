import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { SCORE_RULES } from '@/lib/crm/scoring';
import { determineLeadSegment } from '@/lib/crm/segments';
import { triggerBehavioralEmail } from '@/lib/crm/emailAutomation';
import { LeadRecord } from '@/lib/crm/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { anonymous_id, lead_email, event_type, url, metadata } = body;

    if (!event_type || typeof event_type !== 'string' || event_type.length > 100) {
      return NextResponse.json({ error: 'Invalid event_type' }, { status: 400 });
    }

    const sanitizedUrl = typeof url === 'string' ? url.slice(0, 500) : null;
    const sanitizedAnonId = typeof anonymous_id === 'string' ? anonymous_id.slice(0, 100) : null;
    const sanitizedEmail = typeof lead_email === 'string' ? lead_email.trim().toLowerCase().slice(0, 255) : null;
    let sanitizedMeta = {};
    if (metadata && typeof metadata === 'object') {
      try {
        const str = JSON.stringify(metadata);
        if (str.length <= 5000) {
          sanitizedMeta = metadata;
        }
      } catch {}
    }

    const admin = createAdminClient();
    if (!admin) {
      return NextResponse.json({ ok: true, dev: true });
    }

    // 1. Find lead if email or previous event association exists
    let leadId: string | null = null;
    let leadData: LeadRecord | null = null;

    if (lead_email) {
      const { data } = await admin.from('leads').select('*').eq('email', lead_email).single();
      if (data) {
        leadId = data.id;
        leadData = data;
      }
    }

    if (!leadId && anonymous_id) {
      const { data: prevEvent } = await admin
        .from('lead_events')
        .select('lead_id')
        .eq('anonymous_id', anonymous_id)
        .not('lead_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      if (prevEvent?.lead_id) {
        leadId = prevEvent.lead_id;
        const { data } = await admin.from('leads').select('*').eq('id', leadId).single();
        if (data) leadData = data;
      }
    }

    // 2. Insert event
    await admin.from('lead_events').insert({
      lead_id: leadId,
      anonymous_id: sanitizedAnonId,
      event_type,
      url: sanitizedUrl,
      metadata: sanitizedMeta,
    });

    // 3. Update lead score & segmentation if lead is known
    if (leadId && leadData) {
      let scoreDelta = 0;
      switch (event_type) {
        case 'course_page_view':
          scoreDelta += SCORE_RULES.COURSE_PAGE_VIEWED;
          break;
        case 'pricing_view':
          scoreDelta += SCORE_RULES.PRICING_PAGE_VIEWED;
          break;
        case 'course_video_complete':
          scoreDelta += SCORE_RULES.COURSE_VIDEO_WATCHED;
          break;
        case 'checkout_started':
          scoreDelta += SCORE_RULES.CHECKOUT_STARTED;
          break;
        case 'payment_initiated':
          scoreDelta += SCORE_RULES.PAYMENT_INITIATED;
          break;
        case 'pdf_download':
          scoreDelta += SCORE_RULES.PDF_DOWNLOADED;
          break;
        case 'return_visit':
          scoreDelta += SCORE_RULES.RETURNED_WEBSITE;
          break;
        default:
          scoreDelta += 1;
      }

      const newScore = Math.max(0, (leadData.score || 0) + scoreDelta);

      // Check event history for segment determination
      const { data: events } = await admin
        .from('lead_events')
        .select('event_type')
        .eq('lead_id', leadId);

      const courseViews = events?.filter((e) => e.event_type === 'course_page_view').length || 0;
      const pricingViews = events?.filter((e) => e.event_type === 'pricing_view').length || 0;
      const checkoutStarted = events?.some((e) => e.event_type === 'checkout_started') || false;
      const downloadedBiology = events?.some((e) => e.event_type === 'pdf_download') || true;

      const newSegment = determineLeadSegment({
        downloadedBiologyMcq: downloadedBiology,
        ceeCourseViews: courseViews,
        pricingViews,
        checkoutStarted,
        purchased: leadData.status === 'customer',
        totalEvents: events?.length || 1,
      });

      await admin
        .from('leads')
        .update({
          score: newScore,
          segment: newSegment,
          last_active_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', leadId);

      // 4. Check behavioral triggers
      if (courseViews >= 3 && leadData.status !== 'customer') {
        await triggerBehavioralEmail(leadData, 'behavior_course_revisit_3x');
      } else if (pricingViews >= 1 && leadData.status !== 'customer') {
        await triggerBehavioralEmail(leadData, 'behavior_pricing_view');
      }
    }

    return NextResponse.json({ ok: true, lead_id: leadId });
  } catch (err: any) {
    console.error('Error tracking event:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
