import { NextRequest, NextResponse } from 'next/server';
import { SAMPLE_HIGH_YIELD_MCQS, BIOLOGY_POWER_PACK_SUMMARY } from '@/lib/crm/biologyQuestionsData';

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email') || 'Student';

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>500 FREE CEE Biology MCQs — Samyak CEE Power Pack</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #1e293b;
      background-color: #f8fafc;
      margin: 0;
      padding: 24px;
    }
    .container {
      max-width: 850px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 40px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    .header {
      border-bottom: 2px solid #4f46e5;
      padding-bottom: 24px;
      margin-bottom: 32px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      flex-wrap: wrap;
      gap: 16px;
    }
    .badge {
      background: #e0e7ff;
      color: #4338ca;
      font-size: 12px;
      font-weight: 700;
      padding: 4px 12px;
      border-radius: 9999px;
      text-transform: uppercase;
    }
    h1 {
      color: #0f172a;
      font-size: 28px;
      margin: 12px 0 6px 0;
      font-weight: 900;
    }
    .btn-print {
      background: #4f46e5;
      color: #ffffff;
      border: none;
      padding: 10px 20px;
      border-radius: 8px;
      font-weight: 700;
      cursor: pointer;
      font-size: 14px;
    }
    .breakdown-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 12px;
      margin: 20px 0 32px 0;
    }
    .breakdown-card {
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      padding: 14px 16px;
      border-radius: 10px;
    }
    .question-card {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 20px;
    }
    .question-title {
      font-weight: 700;
      font-size: 16px;
      color: #0f172a;
      margin-bottom: 12px;
    }
    .options-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-bottom: 14px;
    }
    .option {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 14px;
    }
    .answer-box {
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      color: #065f46;
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 14px;
      margin-top: 10px;
    }
    .trap-box {
      background: #fff1f2;
      border: 1px solid #fecdd3;
      color: #9f1239;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 13px;
      margin-top: 8px;
      font-weight: 600;
    }
    @media print {
      body { background: #ffffff; padding: 0; }
      .container { border: none; box-shadow: none; padding: 0; }
      .btn-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <span class="badge">Official Free Resource</span>
        <h1>FREE CEE BIOLOGY POWER PACK</h1>
        <p style="color: #64748b; margin: 0;">500 High-Yield MCQs With Detailed Explanations • Medical Education Commission (MEC) 2026 Edition</p>
      </div>
      <button class="btn-print" onclick="window.print()">🖨️ Save as PDF / Print</button>
    </div>

    <h3>📊 High-Yield Chapter Marks Weightage in CEE (80 Marks)</h3>
    <div class="breakdown-grid">
      ${BIOLOGY_POWER_PACK_SUMMARY.breakdown
        .map(
          (b) => `
        <div class="breakdown-card">
          <strong style="color: #0f172a; font-size: 14px;">${b.unit}</strong>
          <div style="color: #4f46e5; font-size: 12px; font-weight: 700; margin-top: 4px;">${b.weight}</div>
        </div>
      `
        )
        .join('')}
    </div>

    <h3 style="margin-top: 32px;">🧬 High-Yield MCQ Diagnostic Set (Selected Samples)</h3>
    
    ${SAMPLE_HIGH_YIELD_MCQS.map(
      (q, idx) => `
      <div class="question-card">
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span style="font-size: 12px; font-weight: 700; color: #4f46e5; text-transform: uppercase;">${q.subject} • ${q.chapter}</span>
          <span style="font-size: 11px; background: #fee2e2; color: #991b1b; padding: 2px 8px; border-radius: 4px; font-weight: 700;">${q.ceeYield}</span>
        </div>
        <div class="question-title">Q${idx + 1}. ${q.question}</div>
        <div class="options-grid">
          ${q.options.map((opt, oIdx) => `<div class="option">(${String.fromCharCode(65 + oIdx)}) ${opt}</div>`).join('')}
        </div>
        <div class="answer-box">
          <strong>✓ Correct Answer:</strong> ${q.correctAnswer}<br/>
          <span style="margin-top: 4px; display: inline-block;"><strong>Explanation:</strong> ${q.explanation}</span>
        </div>
        ${q.trapWarning ? `<div class="trap-box">⚠️ ${q.trapWarning}</div>` : ''}
      </div>
    `
    ).join('')}

    <div style="background: #1e1b4b; color: #ffffff; border-radius: 12px; padding: 24px; text-align: center; margin-top: 40px;">
      <h3 style="margin: 0 0 8px 0; color: #ffffff;">Want full interactive access to all 15,000+ CEE MCQs &amp; 24/7 AI Tutor?</h3>
      <p style="color: #cbd5e1; font-size: 14px; margin: 0 0 16px 0;">Join thousands of students preparing on Nepal's premier CEE platform.</p>
      <a href="https://samyakcee.com/courses" style="display: inline-block; background: #6366f1; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 700; font-size: 14px;">
        Explore Samyak CEE Mastery →
      </a>
    </div>

    <div style="text-align: center; margin-top: 32px; font-size: 12px; color: #94a3b8;">
      Samyak Guru Education Platform • Old Baneshwor, Kathmandu, Nepal • Phone/WhatsApp: +977 9709066151
    </div>
  </div>
</body>
</html>
`;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
}
