import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import PublicNav from '@/components/PublicNav';
import HomepageFooter from '@/app/components/HomepageFooter';
import {
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  CreditCard,
  Mail,
  HelpCircle,
  Zap,
  ArrowRight,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Refund & Cancellation Policy — Samyak Guru & Samyak CEE Mastery',
  description:
    'Clear and transparent refund rules for Samyak Guru courses, batches, and prebooking tokens. Full 7-day money-back guarantee for eligible students.',
  alternates: {
    canonical: '/refund-policy',
  },
};

export default function RefundPolicyPage() {
  const lastUpdated = 'August 30, 2026';

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between selection:bg-primary/20">
      <PublicNav />

      <main className="flex-1 pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
        {/* Header Badge & Title */}
        <div className="text-center space-y-3 mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs font-black uppercase tracking-wider font-mono">
            <RotateCcw size={16} />
            <span>TRANSPARENT &amp; STUDENT-FIRST GUARANTEE</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-foreground tracking-tight">
            Refund &amp; Cancellation Policy
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground font-medium max-w-2xl mx-auto">
            We want you to study with absolute peace of mind. Here are our clear and transparent refund terms.
          </p>
          <p className="text-xs text-muted-foreground/80 font-mono">
            Effective Date: {lastUpdated}
          </p>
        </div>

        {/* 3 Core Highlights */}
        <div className="grid sm:grid-cols-3 gap-4 mb-12">
          <div className="p-5 rounded-2xl bg-card border-2 border-emerald-500/30 flex flex-col justify-between space-y-3 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h2 className="text-sm font-black text-foreground mb-1">7-Day Money-Back Guarantee</h2>
              <p className="text-xs text-muted-foreground">Full refund within 7 days if &lt;10% of course content has been accessed.</p>
            </div>
            <span className="text-[10px] font-mono font-bold text-emerald-600 uppercase">100% Risk-Free</span>
          </div>

          <div className="p-5 rounded-2xl bg-card border border-border flex flex-col justify-between space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <Clock size={22} />
            </div>
            <div>
              <h2 className="text-sm font-black text-foreground mb-1">24–48h Rapid Payout</h2>
              <p className="text-xs text-muted-foreground">Approved refunds are credited directly back to your eSewa, Khalti, or Bank account.</p>
            </div>
            <span className="text-[10px] font-mono font-bold text-blue-600 uppercase">Direct Source Transfer</span>
          </div>

          <div className="p-5 rounded-2xl bg-card border border-border flex flex-col justify-between space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
              <CreditCard size={22} />
            </div>
            <div>
              <h2 className="text-sm font-black text-foreground mb-1">Token Credit Rule</h2>
              <p className="text-xs text-muted-foreground">Prebooking tokens (Rs. 300) are 100% credited toward your final batch fee.</p>
            </div>
            <span className="text-[10px] font-mono font-bold text-purple-600 uppercase">100% Value Retained</span>
          </div>
        </div>

        {/* Detailed Sections */}
        <div className="space-y-8 text-sm leading-relaxed text-muted-foreground">
          
          {/* Section 1: 7-Day Refund Policy */}
          <section className="bg-card border border-border p-6 sm:p-8 rounded-3xl space-y-4">
            <div className="flex items-center gap-3 text-foreground font-black text-lg">
              <span className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center text-xs font-mono">1</span>
              <h2>7-Day Full Refund Eligibility</h2>
            </div>
            <p>
              We stand firmly behind the quality of our master video lectures, question banks, and AI tutors. If you enroll in any full course (e.g. <em>SEE Mission A+</em>, <em>CEE Medical Entrance</em>, or <em>IELTS Mastery</em>) and feel it is not the right fit for your learning style:
            </p>
            <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-2">
              <h3 className="font-bold text-foreground text-xs uppercase font-mono text-emerald-600">You are eligible for a 100% Full Refund if:</h3>
              <ul className="space-y-1.5 list-disc pl-5 text-xs text-foreground/90">
                <li>Your refund request is submitted within <strong>7 calendar days</strong> of the original payment timestamp.</li>
                <li>You have watched <strong>less than 10%</strong> of the total video lecture lessons in the enrolled batch.</li>
                <li>You have attempted <strong>no more than 2 practice sessions</strong> or mock exams.</li>
              </ul>
            </div>
          </section>

          {/* Section 2: Non-Refundable Situations */}
          <section className="bg-card border border-border p-6 sm:p-8 rounded-3xl space-y-4">
            <div className="flex items-center gap-3 text-foreground font-black text-lg">
              <span className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center text-xs font-mono">2</span>
              <h2>Non-Refundable Circumstances</h2>
            </div>
            <p>To protect our academic authors and prevent material abuse, refunds will <strong>not</strong> be granted under the following conditions:</p>
            <ul className="space-y-2 list-disc pl-5">
              <li>
                <strong>Mock Exam Completion:</strong> Once a student submits an official full-length CEE/SEE Mock Exam or receives an AI Subjective evaluation report, the course fee is non-refundable.
              </li>
              <li>
                <strong>Full Digest PDF Access:</strong> Downloading or accessing comprehensive encrypted chapter digest summaries.
              </li>
              <li>
                <strong>Expired Guarantee Window:</strong> Requests submitted more than 7 days after the purchase date.
              </li>
              <li>
                <strong>Terms of Service Violations:</strong> Accounts suspended or banned for sharing login credentials, screen recording copyrighted lectures, or attempting anti-cheat bypasses.
              </li>
              <li>
                <strong>Crash Revision Bootcamps:</strong> Short-term bootcamps (e.g., 7-Day SEE Challenge at NPR 199) are non-refundable once started due to immediate full content unlock.
              </li>
            </ul>
          </section>

          {/* Section 3: Prebooking Token Policy */}
          <section className="bg-card border border-border p-6 sm:p-8 rounded-3xl space-y-3">
            <div className="flex items-center gap-3 text-foreground font-black text-lg">
              <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-mono">3</span>
              <h2>Prebooking Token Policy (NPR 300)</h2>
            </div>
            <p>
              The <strong>NPR 300 Prebooking Token</strong> is an early-bird reservation deposit that guarantees your seat in upcoming live cohorts and locks in exclusive launch discounts (up to 50% off).
            </p>
            <div className="p-4 rounded-2xl bg-card border border-border text-xs space-y-1.5">
              <p><strong>Credit Guarantee:</strong> 100% of your NPR 300 token is automatically deducted as an upfront credit from your final batch enrollment balance.</p>
              <p><strong>Non-Refundable in Cash:</strong> Because prebooking reserves a limited live cohort seat and locks maximum early-bird pricing, prebooking tokens are non-refundable in cash, but remain valid for enrollment across any batch for 12 months.</p>
            </div>
          </section>

          {/* Section 4: How to Request a Refund */}
          <section className="bg-card border border-border p-6 sm:p-8 rounded-3xl space-y-4">
            <div className="flex items-center gap-3 text-foreground font-black text-lg">
              <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-mono">4</span>
              <h2>How to Request a Refund (Step-by-Step)</h2>
            </div>
            <p>Initiating a refund is simple and handled directly by our dedicated student support desk:</p>
            <div className="grid sm:grid-cols-3 gap-3 text-xs">
              <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-1">
                <span className="font-mono font-bold text-primary">STEP 1</span>
                <p className="font-bold text-foreground">Send Request</p>
                <p className="text-muted-foreground">Email <strong className="text-foreground">refunds@samyakcee.com</strong> or WhatsApp our helpline.</p>
              </div>
              <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-1">
                <span className="font-mono font-bold text-primary">STEP 2</span>
                <p className="font-bold text-foreground">Provide Details</p>
                <p className="text-muted-foreground">Include your registered Phone Number, Email, and Order ID / Payment Screenshot.</p>
              </div>
              <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-1">
                <span className="font-mono font-bold text-primary">STEP 3</span>
                <p className="font-bold text-foreground">Receive Payout</p>
                <p className="text-muted-foreground">Once verified (&lt;10% accessed), your refund is transferred within 24–48 business hours.</p>
              </div>
            </div>
          </section>

          {/* Section 5: Payout Methods & Timelines */}
          <section className="bg-card border border-border p-6 sm:p-8 rounded-3xl space-y-3">
            <div className="flex items-center gap-3 text-foreground font-black text-lg">
              <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-mono">5</span>
              <h2>Payout Methods &amp; Processing Timelines</h2>
            </div>
            <p>
              Refunds are strictly dispatched to the original account used during checkout to prevent fraudulent claims:
            </p>
            <ul className="space-y-1.5 list-disc pl-5">
              <li><strong>eSewa / Khalti / IME Pay:</strong> Credited to your wallet ID within 24 business hours.</li>
              <li><strong>Fonepay / Direct Bank Transfer:</strong> Credited within 1 to 2 banking business days depending on interbank clearing.</li>
              <li><strong>Zero Hidden Fees:</strong> We do not charge arbitrary cancellation or penalty fees on eligible refund requests.</li>
            </ul>
          </section>

          {/* Section 6: Contact & Support */}
          <section className="bg-card border border-primary/20 p-6 sm:p-8 rounded-3xl space-y-4 bg-gradient-to-br from-card to-primary/5">
            <div className="flex items-center gap-3 text-foreground font-black text-lg">
              <Mail size={22} className="text-primary" />
              <h2>Need Help with Your Enrollment?</h2>
            </div>
            <p>
              Our support team is available 7 days a week (8:00 AM – 9:00 PM NPT) to resolve any payment or enrollment queries:
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <a
                href="mailto:refunds@samyakcee.com"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-all shadow-md"
              >
                <Mail size={14} />
                <span>Email refunds@samyakcee.com</span>
              </a>
              <Link
                href="/see/checkout"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-card border border-border text-xs font-bold text-foreground hover:bg-muted transition-all"
              >
                <span>Return to Checkout</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </section>

        </div>
      </main>

      <HomepageFooter />
    </div>
  );
}
