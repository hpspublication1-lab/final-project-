export interface EmailTemplateContext {
  firstName: string;
  email: string;
  unsubscribeUrl: string;
  downloadUrl?: string;
  courseUrl?: string;
  checkoutUrl?: string;
  planName?: string;
}

const EMAIL_WRAPPER = (content: string, unsubscribeUrl: string, previewText: string = '') => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Samyak CEE Mastery</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0B0F19; color: #F1F5F9; -webkit-font-smoothing: antialiased;">
  <!-- Preview Text -->
  <div style="display: none; max-height: 0px; overflow: hidden; mso-hide: all;">
    ${previewText}
  </div>

  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 30px auto; background-color: #111827; border-radius: 20px; overflow: hidden; border: 1px solid #1F2937; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
    
    <!-- Top Brand Bar -->
    <tr>
      <td style="padding: 24px 32px; background: linear-gradient(135deg, #1E1B4B 0%, #0F172A 100%); border-bottom: 1px solid #1F2937;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
          <tr>
            <td>
              <span style="font-size: 20px; font-weight: 900; color: #FFFFFF; letter-spacing: -0.5px;">
                SAMYAK <span style="color: #6366F1;">CEE</span>
              </span>
            </td>
            <td style="text-align: right;">
              <span style="font-size: 11px; font-weight: 700; color: #A5B4FC; background-color: rgba(99, 102, 241, 0.15); padding: 4px 10px; border-radius: 9999px; border: 1px solid rgba(99, 102, 241, 0.3);">
                NEPAL CEE PREPARATION
              </span>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Main Content Area -->
    <tr>
      <td style="padding: 36px 32px; font-size: 15px; line-height: 1.65; color: #CBD5E1;">
        ${content}
      </td>
    </tr>

    <!-- Support & Physical Location Footer -->
    <tr>
      <td style="padding: 24px 32px; background-color: #0B0F19; border-top: 1px solid #1F2937; text-align: center;">
        <p style="margin: 0 0 10px 0; font-size: 12px; color: #94A3B8;">
          Need 1-on-1 counseling? Message our team on <a href="https://wa.me/9779709066151" style="color: #6366F1; font-weight: 700; text-decoration: none;">WhatsApp (+977 9709066151)</a>
        </p>
        <p style="margin: 0 0 10px 0; font-size: 11px; color: #64748B;">
          Samyak Guru Education Platform • Old Baneshwor, Kathmandu, Nepal
        </p>
        <p style="margin: 0; font-size: 11px; color: #64748B;">
          You received this because you requested study materials on samyakcee.com • 
          <a href="${unsubscribeUrl}" style="color: #94A3B8; text-decoration: underline;">Unsubscribe safely</a>
        </p>
      </td>
    </tr>

  </table>
</body>
</html>
`;

export const EMAIL_TEMPLATES: Record<string, { subject: string; render: (ctx: EmailTemplateContext) => string }> = {
  // ─── 5-EMAIL WELCOME SEQUENCE ───────────────────────────────────────────────

  // EMAIL #1 (Immediately)
  seq_email_1_immediate: {
    subject: 'Your 500 CEE Biology MCQs are here 🎯',
    render: (ctx) => {
      const download = ctx.downloadUrl || 'https://samyakcee.com/api/lead-magnet/download';
      const content = `
        <h1 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 800; color: #FFFFFF; letter-spacing: -0.5px;">
          Here is your Free CEE Biology Power Pack, ${ctx.firstName}! 🎯
        </h1>
        <p style="margin: 0 0 18px 0; font-size: 15px; color: #CBD5E1;">
          Thank you for requesting the <strong>500 High-Yield CEE Biology MCQs With Detailed Explanations</strong>.
        </p>
        <p style="margin: 0 0 24px 0; font-size: 15px; color: #CBD5E1;">
          Biology carries <strong>80 full marks</strong> in the Nepal CEE entrance exam. Mastering the high-yield sub-chapters (Genetics, Photosynthesis, Human Physiology, Plant Anatomy) gives you the decisive edge for government scholarship seats.
        </p>

        <!-- Download Box -->
        <div style="background-color: #1E293B; border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 28px; border: 1px solid #334155;">
          <div style="font-size: 32px; margin-bottom: 8px;">🧬 📚</div>
          <div style="font-size: 16px; font-weight: 800; color: #FFFFFF; margin-bottom: 6px;">FREE CEE BIOLOGY POWER PACK</div>
          <div style="font-size: 13px; color: #94A3B8; margin-bottom: 20px;">500 Chapter-Wise MCQs + Trap Option Explanations</div>
          <a href="${download}" style="display: inline-block; background: linear-gradient(135deg, #4F46E5 0%, #6366F1 100%); color: #FFFFFF; font-weight: 800; font-size: 14px; padding: 14px 32px; border-radius: 12px; text-decoration: none; box-shadow: 0 4px 14px rgba(79, 70, 229, 0.4);">
            📥 DOWNLOAD YOUR FREE MCQs (PDF)
          </a>
        </div>

        <p style="margin: 0 0 16px 0; font-size: 14px; color: #94A3B8;">
          💡 <strong>Pro Tip:</strong> Try attempting at least 20 questions every morning without looking at the explanations first.
        </p>
        <p style="margin: 0; font-size: 14px; color: #94A3B8;">
          Tomorrow, I will send you a 3-minute diagnostic challenge to test where you stand in Botany right now.
        </p>
      `;
      return EMAIL_WRAPPER(content, ctx.unsubscribeUrl, 'Your 500 CEE Biology MCQs are ready to download.');
    },
  },

  // EMAIL #2 (+1 Day)
  seq_email_2_day1: {
    subject: 'How strong is your CEE Biology right now?',
    render: (ctx) => {
      const challengeUrl = 'https://samyakcee.com/practice?subject=biology';
      const content = `
        <h1 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 800; color: #FFFFFF; letter-spacing: -0.5px;">
          Quick question, ${ctx.firstName}: How confident are you in Botany?
        </h1>
        <p style="margin: 0 0 16px 0; font-size: 15px; color: #CBD5E1;">
          In last year's CEE exam, over <strong>64% of aspirants lost marks in 3 specific topics</strong>:
        </p>
        <ul style="margin: 0 0 20px 0; padding-left: 20px; font-size: 14px; color: #E2E8F0; line-height: 1.8;">
          <li>C3 vs. C4 photosynthetic pathway enzymes</li>
          <li>Linkage &amp; Recombination frequency calculations</li>
          <li>Secondary growth in dicot stems &amp; roots</li>
        </ul>

        <div style="background-color: #1E293B; border-radius: 14px; padding: 20px; margin-bottom: 24px; border-left: 4px solid #6366F1;">
          <strong style="color: #FFFFFF; font-size: 14px;">🎯 Today's 1-Minute Diagnostic Challenge:</strong>
          <p style="margin: 8px 0 0 0; font-size: 13px; color: #CBD5E1;">
            <em>"Which enzyme catalyzes primary CO₂ fixation in sugarcane mesophyll cells?"</em>
          </p>
        </div>

        <div style="text-align: center; margin: 24px 0;">
          <a href="${challengeUrl}" style="display: inline-block; background: linear-gradient(135deg, #2563EB 0%, #3B82F6 100%); color: #FFFFFF; font-weight: 800; font-size: 14px; padding: 14px 28px; border-radius: 12px; text-decoration: none;">
            ⚡ TAKE THE 10-MCQ FREE CHALLENGE
          </a>
        </div>

        <p style="margin: 0; font-size: 14px; color: #94A3B8;">
          Test yourself on the live platform and get your instant accuracy breakdown.
        </p>
      `;
      return EMAIL_WRAPPER(content, ctx.unsubscribeUrl, 'Take the quick 1-minute CEE Biology diagnostic challenge.');
    },
  },

  // EMAIL #3 (+2 Days)
  seq_email_3_day2: {
    subject: 'Most CEE students make this mistake',
    render: (ctx) => {
      const methodologyUrl = 'https://samyakcee.com/subjects';
      const content = `
        <h1 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 800; color: #FFFFFF; letter-spacing: -0.5px;">
          The #1 mistake CEE aspirants make (${ctx.firstName}, avoid this)
        </h1>
        <p style="margin: 0 0 16px 0; font-size: 15px; color: #CBD5E1;">
          Most students spend <strong>80% of their study time re-reading heavy textbooks</strong> and only 20% practicing MCQs.
        </p>
        <p style="margin: 0 0 20px 0; font-size: 15px; color: #CBD5E1;">
          Medical entrance exams do NOT test memory of paragraphs. They test:
        </p>
        <ol style="margin: 0 0 20px 0; padding-left: 20px; font-size: 14px; color: #E2E8F0; line-height: 1.8;">
          <li><strong>Trap Identification:</strong> Spotting subtle wrong options in 30 seconds.</li>
          <li><strong>Active Recall:</strong> Retrieving formulas under timed pressure.</li>
          <li><strong>Error Analysis:</strong> Knowing <em>why</em> you marked Option B instead of Option C.</li>
        </ol>

        <p style="margin: 0 0 24px 0; font-size: 15px; color: #CBD5E1;">
          That is why at <strong>Samyak CEE</strong>, every chapter note is compressed into high-yield derivation summaries, accompanied by instant mistake analysis.
        </p>

        <div style="text-align: center; margin: 28px 0;">
          <a href="${methodologyUrl}" style="display: inline-block; background: #6366F1; color: #FFFFFF; font-weight: 800; font-size: 14px; padding: 14px 28px; border-radius: 12px; text-decoration: none;">
            📖 EXPLORE HIGH-YIELD SUB-CHAPTER NOTES
          </a>
        </div>
      `;
      return EMAIL_WRAPPER(content, ctx.unsubscribeUrl, 'Are you making this common CEE preparation mistake?');
    },
  },

  // EMAIL #4 (+4 Days)
  seq_email_4_day4: {
    subject: "Want to know where you're actually weak?",
    render: (ctx) => {
      const mistakeUrl = 'https://samyakcee.com/mistake-analyser';
      const content = `
        <h1 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 800; color: #FFFFFF; letter-spacing: -0.5px;">
          Stop guessing which topics to revise, ${ctx.firstName} 🎯
        </h1>
        <p style="margin: 0 0 16px 0; font-size: 15px; color: #CBD5E1;">
          When preparing for 200 marks in CEE, studying chapters you already know gives a false sense of security.
        </p>
        <p style="margin: 0 0 20px 0; font-size: 15px; color: #CBD5E1;">
          The real rank jump comes from eliminating your <strong>blind spots</strong>.
        </p>

        <div style="background-color: #1E293B; border-radius: 14px; padding: 20px; margin-bottom: 24px; border: 1px solid #334155;">
          <div style="font-size: 15px; font-weight: 700; color: #38BDF8; margin-bottom: 6px;">🧠 Samyak AI Mistake Analyser</div>
          <p style="margin: 0; font-size: 13px; color: #CBD5E1; line-height: 1.6;">
            Our neural engine tags every question by micro-topic. When you practice, it tracks your sub-chapter accuracy and generates targeted revision tests to turn weak areas into strengths.
          </p>
        </div>

        <div style="text-align: center; margin: 24px 0;">
          <a href="${mistakeUrl}" style="display: inline-block; background: linear-gradient(135deg, #059669 0%, #10B981 100%); color: #FFFFFF; font-weight: 800; font-size: 14px; padding: 14px 28px; border-radius: 12px; text-decoration: none;">
            🔍 CHECK YOUR WEAK TOPICS NOW
          </a>
        </div>
      `;
      return EMAIL_WRAPPER(content, ctx.unsubscribeUrl, 'Discover your exact CEE preparation weaknesses with AI analysis.');
    },
  },

  // EMAIL #5 (+6 Days)
  seq_email_5_day6: {
    subject: "Your CEE preparation shouldn't be random.",
    render: (ctx) => {
      const courseUrl = 'https://samyakcee.com/courses?sector=cee_medical';
      const content = `
        <h1 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 800; color: #FFFFFF; letter-spacing: -0.5px;">
          Structured preparation beats random effort every single time.
        </h1>
        <p style="margin: 0 0 16px 0; font-size: 15px; color: #CBD5E1;">
          ${ctx.firstName}, with the CEE entrance exam approaching, having a clear daily roadmap is the difference between getting a scholarship seat or missing the cutoff.
        </p>

        <!-- Course Value Breakdown -->
        <div style="background-color: #1E293B; border-radius: 16px; padding: 24px; margin-bottom: 28px; border: 1px solid #334155;">
          <h3 style="margin: 0 0 14px 0; font-size: 16px; color: #FFFFFF; font-weight: 800;">
            🎓 What You Get with Samyak CEE Mastery:
          </h3>
          <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #CBD5E1; line-height: 1.9;">
            <li><strong>15,000+ Verified CEE MCQs</strong> with step-by-step solutions</li>
            <li><strong>1,200+ Sub-Chapter High-Yield Notes</strong> (Bio, Chem, Physics, MAT)</li>
            <li><strong>24/7 AI Live Teacher Avatar &amp; Doubt Solver</strong> (Instant help)</li>
            <li><strong>Real-Time 2-Player Battle Arena</strong> for entrance speed</li>
            <li><strong>Weekly Full-Length 200-Mark Saturday Mock Exams</strong> with national percentiles</li>
            <li><strong>100% Mobile App &amp; Web Synchronization</strong></li>
          </ul>
        </div>

        <div style="text-align: center; margin: 28px 0;">
          <a href="${courseUrl}" style="display: inline-block; background: linear-gradient(135deg, #4F46E5 0%, #6366F1 100%); color: #FFFFFF; font-weight: 900; font-size: 15px; padding: 16px 36px; border-radius: 14px; text-decoration: none; box-shadow: 0 6px 20px rgba(79, 70, 229, 0.4);">
            🚀 ENROLL IN CEE MASTERY TODAY →
          </a>
        </div>

        <p style="margin: 0; font-size: 13px; color: #94A3B8; text-align: center;">
          Backed by our 7-Day Money-Back Guarantee. Pay securely via Fonepay QR.
        </p>
      `;
      return EMAIL_WRAPPER(content, ctx.unsubscribeUrl, 'Get the complete structured CEE 2026 preparation system.');
    },
  },

  // ─── BEHAVIOR-TRIGGERED FOLLOW-UP EMAILS ─────────────────────────────────────

  // CASE A: 3+ CEE Course Page Visits
  behavior_course_revisit_3x: {
    subject: 'Still deciding about your CEE preparation?',
    render: (ctx) => {
      const courseUrl = 'https://samyakcee.com/courses?sector=cee_medical';
      const content = `
        <h1 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 800; color: #FFFFFF; letter-spacing: -0.5px;">
          We noticed you were checking out the CEE Mastery program 👀
        </h1>
        <p style="margin: 0 0 16px 0; font-size: 15px; color: #CBD5E1;">
          Hi ${ctx.firstName}, choosing your preparation platform is a critical decision.
        </p>
        <p style="margin: 0 0 20px 0; font-size: 15px; color: #CBD5E1;">
          Here are the 3 most common questions students ask before joining:
        </p>
        <div style="background-color: #1E293B; border-radius: 14px; padding: 20px; margin-bottom: 24px; border: 1px solid #334155; font-size: 14px; line-height: 1.7;">
          <p style="margin: 0 0 12px 0;"><strong>Q: Is this updated for CEE 2026?</strong><br/><span style="color: #94A3B8;">Yes, completely aligned with the updated Medical Education Commission syllabus.</span></p>
          <p style="margin: 0 0 12px 0;"><strong>Q: Can I study offline on my phone?</strong><br/><span style="color: #94A3B8;">Yes, our mobile app caches practice tests and PDF formula guides for offline use.</span></p>
          <p style="margin: 0;"><strong>Q: What if it does not work for me?</strong><br/><span style="color: #94A3B8;">You are protected by our 7-day 100% money-back guarantee.</span></p>
        </div>

        <div style="text-align: center; margin: 24px 0;">
          <a href="${courseUrl}" style="display: inline-block; background: #6366F1; color: #FFFFFF; font-weight: 800; font-size: 14px; padding: 14px 30px; border-radius: 12px; text-decoration: none;">
            VIEW CEE COURSE DETAILS →
          </a>
        </div>
      `;
      return EMAIL_WRAPPER(content, ctx.unsubscribeUrl, 'Answers to common questions about Samyak CEE Mastery.');
    },
  },

  // CASE B: Visited Pricing Page
  behavior_pricing_view: {
    subject: 'Thinking about joining Samyak CEE?',
    render: (ctx) => {
      const pricingUrl = 'https://samyakcee.com/courses#pricing';
      const content = `
        <h1 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 800; color: #FFFFFF; letter-spacing: -0.5px;">
          Invest in your medical seat, not expensive coaching fees.
        </h1>
        <p style="margin: 0 0 16px 0; font-size: 15px; color: #CBD5E1;">
          Hi ${ctx.firstName}, traditional coaching institutes in Kathmandu charge Rs. 35,000 to Rs. 50,000+ for crowded halls where asking doubts is nearly impossible.
        </p>
        <p style="margin: 0 0 20px 0; font-size: 15px; color: #CBD5E1;">
          With <strong>Samyak CEE</strong>, you get full 1-year access to all classes, 15,000+ MCQs, 24/7 AI tutor help, and full mock exams at a fraction of the cost.
        </p>

        <div style="text-align: center; margin: 28px 0;">
          <a href="${pricingUrl}" style="display: inline-block; background: #6366F1; color: #FFFFFF; font-weight: 800; font-size: 14px; padding: 14px 30px; border-radius: 12px; text-decoration: none;">
            EXPLORE PLANS &amp; PRICING →
          </a>
        </div>
      `;
      return EMAIL_WRAPPER(content, ctx.unsubscribeUrl, 'Affordable, high-yield CEE preparation for Nepal students.');
    },
  },

  // CASE C: Abandoned Checkout (Email 1)
  behavior_checkout_abandoned: {
    subject: 'You were almost there 👀',
    render: (ctx) => {
      const checkoutUrl = ctx.checkoutUrl || 'https://samyakcee.com/checkout';
      const content = `
        <h1 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 800; color: #FFFFFF; letter-spacing: -0.5px;">
          Did something interrupt your checkout, ${ctx.firstName}?
        </h1>
        <p style="margin: 0 0 16px 0; font-size: 15px; color: #CBD5E1;">
          We noticed you started enrolling in <strong>${ctx.planName || 'CEE Mastery'}</strong>, but didn't finish scanning the Fonepay QR code.
        </p>
        <p style="margin: 0 0 24px 0; font-size: 15px; color: #CBD5E1;">
          Your course slot is reserved for you. You can resume your checkout with one click:
        </p>

        <div style="text-align: center; margin: 28px 0;">
          <a href="${checkoutUrl}" style="display: inline-block; background: linear-gradient(135deg, #059669 0%, #10B981 100%); color: #FFFFFF; font-weight: 800; font-size: 14px; padding: 14px 32px; border-radius: 12px; text-decoration: none;">
            COMPLETE ENROLLMENT NOW →
          </a>
        </div>

        <p style="margin: 0; font-size: 13px; color: #94A3B8;">
          If you experienced payment app issues or need installment options, reply to this email or message us on WhatsApp.
        </p>
      `;
      return EMAIL_WRAPPER(content, ctx.unsubscribeUrl, 'Resume your reserved CEE enrollment.');
    },
  },

  // CASE D: Payment Failed
  behavior_payment_failed: {
    subject: "We couldn't complete your payment",
    render: (ctx) => {
      const retryUrl = ctx.checkoutUrl || 'https://samyakcee.com/checkout';
      const content = `
        <h1 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 800; color: #FFFFFF; letter-spacing: -0.5px;">
          Your payment was not completed
        </h1>
        <p style="margin: 0 0 16px 0; font-size: 15px; color: #CBD5E1;">
          Hi ${ctx.firstName}, your recent Fonepay payment attempt for <strong>${ctx.planName || 'CEE Mastery'}</strong> was not completed.
        </p>
        <p style="margin: 0 0 24px 0; font-size: 15px; color: #CBD5E1;">
          No funds were deducted. This usually happens if the banking session timed out or the network connection dropped.
        </p>

        <div style="text-align: center; margin: 28px 0;">
          <a href="${retryUrl}" style="display: inline-block; background: #6366F1; color: #FFFFFF; font-weight: 800; font-size: 14px; padding: 14px 32px; border-radius: 12px; text-decoration: none;">
            🔄 RETRY PAYMENT WITH FONEPAY QR
          </a>
        </div>

        <p style="margin: 0; font-size: 13px; color: #94A3B8;">
          If money was deducted from your bank without course activation, contact our team immediately on WhatsApp (+977 9709066151) with your transaction ID for instant manual activation.
        </p>
      `;
      return EMAIL_WRAPPER(content, ctx.unsubscribeUrl, 'Payment incomplete notification.');
    },
  },

  // CASE E: PDF Downloaded but No Activity After 3 Days
  behavior_pdf_no_engagement_day3: {
    subject: 'You downloaded the MCQs. Now test yourself.',
    render: (ctx) => {
      const practiceUrl = 'https://samyakcee.com/practice';
      const content = `
        <h1 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 800; color: #FFFFFF; letter-spacing: -0.5px;">
          Have you solved the 500 Biology MCQs yet, ${ctx.firstName}?
        </h1>
        <p style="margin: 0 0 16px 0; font-size: 15px; color: #CBD5E1;">
          Reading MCQs on a PDF is a good start, but real exam simulation requires timed answering.
        </p>
        <p style="margin: 0 0 24px 0; font-size: 15px; color: #CBD5E1;">
          Jump onto the Samyak Guru web practice portal for free interactive chapter-wise MCQs with live score tracking:
        </p>

        <div style="text-align: center; margin: 24px 0;">
          <a href="${practiceUrl}" style="display: inline-block; background: #2563EB; color: #FFFFFF; font-weight: 800; font-size: 14px; padding: 14px 30px; border-radius: 12px; text-decoration: none;">
            ⚡ START FREE PRACTICE SESSION →
          </a>
        </div>
      `;
      return EMAIL_WRAPPER(content, ctx.unsubscribeUrl, 'Take your CEE practice to the next level.');
    },
  },

  // CASE G: Student Purchases (Immediate Onboarding)
  behavior_student_onboarding: {
    subject: 'Welcome to Samyak CEE 🎉',
    render: (ctx) => {
      const dashboardUrl = 'https://samyakcee.com/student-dashboard';
      const content = `
        <h1 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 800; color: #FFFFFF; letter-spacing: -0.5px;">
          Welcome to Samyak CEE, ${ctx.firstName}! 🎉
        </h1>
        <p style="margin: 0 0 16px 0; font-size: 15px; color: #CBD5E1;">
          Your enrollment for <strong>${ctx.planName || 'CEE Mastery'}</strong> is confirmed and fully active.
        </p>

        <div style="background-color: #1E293B; border-radius: 16px; padding: 20px; margin-bottom: 24px; border: 1px solid #334155;">
          <h3 style="margin: 0 0 10px 0; font-size: 15px; color: #38BDF8; font-weight: 700;">🚀 3 Steps to Start Today:</h3>
          <ol style="margin: 0; padding-left: 20px; font-size: 14px; color: #CBD5E1; line-height: 1.8;">
            <li>Log in to your <strong>Student Dashboard</strong> to see your daily study plan.</li>
            <li>Take your first <strong>Diagnostic Baseline Test</strong> under Mock Exams.</li>
            <li>Ask any difficult formula or doubt to the <strong>24/7 AI Tutor</strong>.</li>
          </ol>
        </div>

        <div style="text-align: center; margin: 28px 0;">
          <a href="${dashboardUrl}" style="display: inline-block; background: linear-gradient(135deg, #2563EB 0%, #3B82F6 100%); color: #FFFFFF; font-weight: 800; font-size: 14px; padding: 14px 32px; border-radius: 12px; text-decoration: none;">
            ENTER YOUR STUDENT DASHBOARD →
          </a>
        </div>
      `;
      return EMAIL_WRAPPER(content, ctx.unsubscribeUrl, 'Your Samyak CEE student access is ready.');
    },
  },
};
