import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendEnrollmentNotification, sendEmail } from '@/lib/email/service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, studentName, planName, customSubject, customHtml } = body;

    if (!to) {
      return NextResponse.json({ error: 'Recipient email ("to") is required' }, { status: 400 });
    }

    let result;
    if (customSubject && customHtml) {
      result = await sendEmail({
        to,
        subject: customSubject,
        html: customHtml,
      });
    } else {
      result = await sendEnrollmentNotification({
        email: to,
        studentName: studentName || 'Student',
        planName: planName || 'CEE Mastery Crash Course',
      });
    }

    return NextResponse.json({
      message: `Email process triggered for ${to}`,
      result,
    });
  } catch (err: any) {
    console.error('API /api/email/send error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
