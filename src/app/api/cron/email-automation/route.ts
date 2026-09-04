import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { dispatchEmailNow } from '@/lib/crm/emailAutomation';
import { LeadRecord } from '@/lib/crm/types';

export async function GET(req: NextRequest) {
  return handleCron();
}

export async function POST(req: NextRequest) {
  return handleCron();
}

async function handleCron() {
  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ ok: false, message: 'Database not available' }, { status: 500 });
  }

  const now = new Date().toISOString();

  // Fetch pending emails that are due for dispatch
  const { data: queueItems, error } = await admin
    .from('email_queue')
    .select('*, leads (*)')
    .eq('status', 'pending')
    .lte('scheduled_at', now)
    .limit(25);

  if (error) {
    console.error('Error fetching email queue:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!queueItems || queueItems.length === 0) {
    return NextResponse.json({ ok: true, processed: 0, message: 'No emails currently due.' });
  }

  const results: any[] = [];

  for (const item of queueItems) {
    const lead: LeadRecord = item.leads;

    // Safety checks
    if (!lead || lead.unsubscribed_at) {
      await admin
        .from('email_queue')
        .update({ status: 'cancelled', failure_reason: 'Lead unsubscribed or not found' })
        .eq('id', item.id);
      results.push({ id: item.id, status: 'cancelled' });
      continue;
    }

    if (lead.status === 'customer' && !item.template_id.includes('onboarding')) {
      await admin
        .from('email_queue')
        .update({ status: 'cancelled', failure_reason: 'Lead already enrolled as customer' })
        .eq('id', item.id);
      results.push({ id: item.id, status: 'cancelled_as_customer' });
      continue;
    }

    try {
      const success = await dispatchEmailNow(lead, item.template_id);
      if (success) {
        await admin
          .from('email_queue')
          .update({ status: 'sent', sent_at: new Date().toISOString() })
          .eq('id', item.id);
        results.push({ id: item.id, status: 'sent', email: lead.email });
      } else {
        await admin
          .from('email_queue')
          .update({ status: 'failed', failure_reason: 'Email provider dispatch failed' })
          .eq('id', item.id);
        results.push({ id: item.id, status: 'failed', email: lead.email });
      }
    } catch (err: any) {
      await admin
        .from('email_queue')
        .update({ status: 'failed', failure_reason: err.message || 'Unknown error' })
        .eq('id', item.id);
      results.push({ id: item.id, status: 'failed', error: err.message });
    }
  }

  return NextResponse.json({ ok: true, processed: results.length, results });
}
