import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { scheduleWelcomeSequence } from '@/lib/crm/emailAutomation';
import { SCORE_RULES } from '@/lib/crm/scoring';
import { LeadRecord } from '@/lib/crm/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      first_name,
      email,
      phone,
      academic_level,
      prep_status,
      utm_source,
      utm_medium,
      utm_campaign,
      utm_content,
      referrer,
      landing_page,
    } = body;

    // 1. Validation
    if (!first_name || !first_name.trim()) {
      return NextResponse.json({ error: 'First name is required.' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const cleanEmail = (email || '').toLowerCase().trim();
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      return NextResponse.json({ error: 'Please provide a valid email address.' }, { status: 400 });
    }

    const admin = createAdminClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://samyakcee.com';
    const downloadUrl = `${siteUrl.replace(/\/+$/, '')}/api/lead-magnet/download?email=${encodeURIComponent(cleanEmail)}`;

    if (!admin) {
      // Dev mode fallback
      return NextResponse.json({
        ok: true,
        message: 'Lead captured successfully (dev mode)',
        downloadUrl,
      });
    }

    // 2. Check if lead already exists
    const { data: existingLead } = await admin
      .from('leads')
      .select('*')
      .eq('email', cleanEmail)
      .single();

    let leadRecord: LeadRecord;

    if (existingLead) {
      // Update existing lead with latest active timestamp and UTMs
      const { data: updated, error } = await admin
        .from('leads')
        .update({
          first_name: first_name.trim(),
          phone: phone ? phone.trim() : existingLead.phone,
          academic_level: academic_level || existingLead.academic_level,
          prep_status: prep_status || existingLead.prep_status,
          utm_source: utm_source || existingLead.utm_source,
          utm_medium: utm_medium || existingLead.utm_medium,
          utm_campaign: utm_campaign || existingLead.utm_campaign,
          utm_content: utm_content || existingLead.utm_content,
          score: (existingLead.score || 0) + SCORE_RULES.PDF_DOWNLOADED,
          last_active_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingLead.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating existing lead:', error);
      }
      leadRecord = updated || existingLead;
    } else {
      // Insert new lead
      const { data: inserted, error } = await admin
        .from('leads')
        .insert({
          email: cleanEmail,
          first_name: first_name.trim(),
          phone: phone ? phone.trim() : null,
          academic_level: academic_level || null,
          prep_status: prep_status || null,
          score: SCORE_RULES.EMAIL_CAPTURED + SCORE_RULES.PDF_DOWNLOADED,
          segment: 'BIOLOGY_INTEREST',
          status: 'new',
          lead_magnet: '500_cee_biology_mcqs',
          utm_source: utm_source || null,
          utm_medium: utm_medium || null,
          utm_campaign: utm_campaign || null,
          utm_content: utm_content || null,
          referrer: referrer || null,
          landing_page: landing_page || null,
          consent: true,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating lead:', error);
        return NextResponse.json({ error: 'Failed to record lead profile' }, { status: 500 });
      }
      leadRecord = inserted;

      // 3. Schedule 5-Email Welcome Sequence
      await scheduleWelcomeSequence(leadRecord);
    }

    // 4. Log event
    await admin.from('lead_events').insert({
      lead_id: leadRecord.id,
      event_type: 'lead_form_submit',
      url: landing_page || null,
      metadata: { lead_magnet: '500_cee_biology_mcqs', utm_source, utm_campaign },
    });

    return NextResponse.json({
      ok: true,
      message: 'Success! Your Free CEE Biology Power Pack is ready.',
      downloadUrl,
      lead_id: leadRecord.id,
    });
  } catch (err: any) {
    console.error('Error capturing lead:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
