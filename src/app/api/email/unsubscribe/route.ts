import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyUnsubscribeToken } from '@/lib/crm/emailAutomation';

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email');
  const token = req.nextUrl.searchParams.get('token');

  if (!email || !token) {
    return new NextResponse('Invalid or missing unsubscribe parameters.', { status: 400 });
  }

  const isValid = verifyUnsubscribeToken(email, token);
  if (!isValid) {
    return new NextResponse('Invalid or expired unsubscribe link.', { status: 403 });
  }

  const admin = createAdminClient();
  if (admin) {
    // 1. Mark lead as unsubscribed
    await admin
      .from('leads')
      .update({
        unsubscribed_at: new Date().toISOString(),
        status: 'unsubscribed',
        updated_at: new Date().toISOString(),
      })
      .eq('email', email.toLowerCase().trim());

    // 2. Cancel all pending marketing emails in queue
    const { data: lead } = await admin
      .from('leads')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (lead?.id) {
      await admin
        .from('email_queue')
        .update({ status: 'cancelled', failure_reason: 'User unsubscribed' })
        .eq('lead_id', lead.id)
        .eq('status', 'pending');
    }
  }

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Unsubscribed — Samyak CEE Mastery</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: #0f172a;
      color: #f8fafc;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
    }
    .card {
      background-color: #1e293b;
      border: 1px solid #334155;
      border-radius: 16px;
      padding: 36px 32px;
      max-width: 480px;
      text-align: center;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
    }
    h1 { font-size: 22px; margin: 0 0 12px 0; color: #ffffff; }
    p { font-size: 14px; color: #94a3b8; line-height: 1.6; margin: 0 0 24px 0; }
    .email { color: #38bdf8; font-weight: 600; }
    .btn {
      display: inline-block;
      background: #4f46e5;
      color: #ffffff;
      padding: 10px 24px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 700;
      font-size: 13px;
    }
  </style>
</head>
<body>
  <div class="card">
    <div style="font-size: 40px; margin-bottom: 12px;">✅</div>
    <h1>You have been unsubscribed</h1>
    <p>
      <span class="email">${email}</span> will no longer receive educational tips or promotional study updates from Samyak CEE.
    </p>
    <a href="https://samyakcee.com" class="btn">Return to Samyak CEE</a>
  </div>
</body>
</html>
`;

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
