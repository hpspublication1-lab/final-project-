import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import PublicNav from '@/components/PublicNav';
import HomepageFooter from '@/app/components/HomepageFooter';
import {
  ShieldCheck,
  Lock,
  Eye,
  CreditCard,
  Mail,
  CheckCircle2,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy — Samyak Guru & Samyak CEE Mastery',
  description:
    'Learn how Samyak Guru collects, uses, encrypts, and protects your personal and academic data. Compliant with international data standards and student privacy best practices.',
  alternates: {
    canonical: '/privacy-policy',
  },
};

export default function PrivacyPolicyPage() {
  const lastUpdated = 'August 30, 2026';

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between selection:bg-primary/20">
      <PublicNav />

      <main className="flex-1 pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
        {/* Header Badge & Title */}
        <div className="text-center space-y-3 mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-wider font-mono">
            <ShieldCheck size={16} />
            <span>STUDENT PRIVACY &amp; DATA PROTECTION</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-foreground tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground font-medium max-w-2xl mx-auto">
            Your trust is our top priority. Here is how Samyak Guru protects your identity, learning progress, and personal information.
          </p>
          <p className="text-xs text-muted-foreground/80 font-mono">
            Effective Date: {lastUpdated}
          </p>
        </div>

        {/* Quick Highlights Box */}
        <div className="grid sm:grid-cols-3 gap-4 mb-12">
          <div className="p-4 rounded-2xl bg-card border border-border flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
              <Lock size={18} />
            </div>
            <div>
              <h2 className="text-xs font-bold text-foreground">256-Bit SSL Encrypted</h2>
              <p className="text-[11px] text-muted-foreground">All learning data and credentials are encrypted in transit and at rest.</p>
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-card border border-border flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
              <Eye size={18} />
            </div>
            <div>
              <h2 className="text-xs font-bold text-foreground">Zero Ad Selling</h2>
              <p className="text-[11px] text-muted-foreground">We never sell or rent your personal details or phone numbers to advertisers.</p>
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-card border border-border flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
              <CreditCard size={18} />
            </div>
            <div>
              <h2 className="text-xs font-bold text-foreground">Safe Nepal Gateways</h2>
              <p className="text-[11px] text-muted-foreground">Payments handled via tokenized Fonepay, eSewa, &amp; Khalti gateways.</p>
            </div>
          </div>
        </div>

        {/* Detailed Policy Sections */}
        <div className="space-y-8 text-sm leading-relaxed text-muted-foreground">
          
          {/* Section 1: Overview */}
          <section className="bg-card border border-border p-6 sm:p-8 rounded-3xl space-y-3">
            <div className="flex items-center gap-3 text-foreground font-black text-lg">
              <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-mono">1</span>
              <h2>Overview &amp; Scope</h2>
            </div>
            <p>
              This Privacy Policy applies to the <strong>Samyak Guru</strong> platform, including <strong>Samyak CEE Mastery</strong>, <strong>SEE Class 10 Board Master</strong>, <strong>IELTS English Mastery</strong>, and related mobile and web applications (collectively, the &quot;Platform&quot; or &quot;Services&quot;).
            </p>
            <p>
              By accessing or using our platform, you agree to the collection and use of information in accordance with this policy. If you are under the age of 18, please review this policy with your parent or legal guardian.
            </p>
          </section>

          {/* Section 2: Information We Collect */}
          <section className="bg-card border border-border p-6 sm:p-8 rounded-3xl space-y-4">
            <div className="flex items-center gap-3 text-foreground font-black text-lg">
              <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-mono">2</span>
              <h2>Information We Collect</h2>
            </div>
            <div className="space-y-3">
              <div>
                <h3 className="font-bold text-foreground mb-1">A. Personal Account Information</h3>
                <p>
                  When you register or enroll in a course, we collect your <strong>Full Name</strong>, <strong>Email Address</strong>, <strong>Mobile Phone Number</strong>, <strong>School / College name</strong>, and target examination category (e.g., SEE 2082, CEE 2026).
                </p>
              </div>
              <div>
                <h3 className="font-bold text-foreground mb-1">B. Academic &amp; Learning Performance Data</h3>
                <p>
                  To personalize your study recommendations and compute mistake analytics, we log your practice question attempts, mock test scores, time spent per problem, chapter completion rates, and video lesson watch progress.
                </p>
              </div>
              <div>
                <h3 className="font-bold text-foreground mb-1">C. AI Tutor &amp; Voice Interaction Logs</h3>
                <p>
                  When you use the 24/7 AI Doubt Solver, submit subjective exam answers for grading, or practice IELTS speaking drills, transcripts and audio recordings are processed securely to provide instant constructive feedback.
                </p>
              </div>
              <div>
                <h3 className="font-bold text-foreground mb-1">D. Technical &amp; Device Information</h3>
                <p>
                  We automatically collect diagnostic telemetry including IP address, browser type, device operating system, and anonymous interaction timestamps to maintain platform performance and detect anti-cheat violations during mock exams.
                </p>
              </div>
            </div>
          </section>

          {/* Section 3: How We Store & Secure Data */}
          <section className="bg-card border border-border p-6 sm:p-8 rounded-3xl space-y-4">
            <div className="flex items-center gap-3 text-foreground font-black text-lg">
              <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-mono">3</span>
              <h2>Data Security &amp; Storage Architecture</h2>
            </div>
            <p>
              We implement industry-standard administrative, physical, and technical security safeguards to keep your personal data confidential and protected:
            </p>
            <ul className="space-y-2 list-disc pl-5">
              <li>
                <strong className="text-foreground">Encryption in Transit:</strong> All HTTP traffic between your browser and our servers is strictly secured using <strong>256-Bit SSL/TLS encryption</strong>.
              </li>
              <li>
                <strong className="text-foreground">Database Row-Level Security (RLS):</strong> Our database utilizes PostgreSQL with Row-Level Security policies on Supabase, ensuring students can only access their own private progress, test scores, and profile data.
              </li>
              <li>
                <strong className="text-foreground">Encrypted Storage:</strong> Lecture videos, digest PDFs, and student submissions are hosted in access-controlled, encrypted cloud storage buckets.
              </li>
            </ul>
          </section>

          {/* Section 4: Payments & Financial Privacy */}
          <section className="bg-card border border-border p-6 sm:p-8 rounded-3xl space-y-3">
            <div className="flex items-center gap-3 text-foreground font-black text-lg">
              <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-mono">4</span>
              <h2>Payment Privacy &amp; Nepal Gateways</h2>
            </div>
            <p>
              All course purchases and enrollments on Samyak Guru are processed via authorized Nepal payment aggregators including <strong>Fonepay Dynamic QR</strong>, <strong>eSewa</strong>, <strong>Khalti</strong>, and <strong>IME Pay</strong>.
            </p>
            <div className="p-4 rounded-2xl bg-muted/50 border border-border text-xs text-foreground font-medium flex items-center gap-2.5">
              <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
              <span>Samyak Guru <strong>NEVER</strong> collects, stores, or sees your bank account numbers, ATM card numbers, or mobile wallet PINs.</span>
            </div>
          </section>

          {/* Section 5: Third-Party Integrations */}
          <section className="bg-card border border-border p-6 sm:p-8 rounded-3xl space-y-3">
            <div className="flex items-center gap-3 text-foreground font-black text-lg">
              <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-mono">5</span>
              <h2>Third-Party Services &amp; Subprocessors</h2>
            </div>
            <p>We work with trusted third-party technology providers to deliver core platform services:</p>
            <ul className="space-y-2 list-disc pl-5">
              <li><strong>Google OAuth:</strong> For secure 1-click user authentication.</li>
              <li><strong>Bunny.net Stream:</strong> For ultra-fast, multi-bitrate HLS video lecture streaming.</li>
              <li><strong>Google Gemini AI &amp; OpenAI:</strong> For doubt resolution and marking rubric evaluations.</li>
              <li><strong>ElevenLabs:</strong> For high-fidelity natural audio speech in IELTS listening and pronunciation exercises.</li>
              <li><strong>Mixpanel &amp; Google Analytics:</strong> For aggregate, privacy-preserving usage metrics.</li>
            </ul>
          </section>

          {/* Section 6: Cookies & Local Storage */}
          <section className="bg-card border border-border p-6 sm:p-8 rounded-3xl space-y-3">
            <div className="flex items-center gap-3 text-foreground font-black text-lg">
              <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-mono">6</span>
              <h2>Cookies &amp; Local Storage</h2>
            </div>
            <p>
              We use essential cookies and browser local storage to:
            </p>
            <ul className="space-y-1.5 list-disc pl-5">
              <li>Keep you securely signed in to your student dashboard across browser tabs.</li>
              <li>Remember your Dark Mode / Light Mode theme preference.</li>
              <li>Temporarily cache active exam answers locally so your progress is never lost if your internet connection drops.</li>
            </ul>
          </section>

          {/* Section 7: Student & Parental Rights */}
          <section className="bg-card border border-border p-6 sm:p-8 rounded-3xl space-y-3">
            <div className="flex items-center gap-3 text-foreground font-black text-lg">
              <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-mono">7</span>
              <h2>Your Rights (Access, Correction &amp; Deletion)</h2>
            </div>
            <p>As a student or parent, you have the right to:</p>
            <ul className="space-y-1.5 list-disc pl-5">
              <li><strong>Access:</strong> Request a complete summary of your stored personal profile and study records.</li>
              <li><strong>Rectification:</strong> Update or correct any inaccurate personal details in your account settings.</li>
              <li><strong>Data Erasure:</strong> Request the permanent deletion of your account, quiz attempts, and AI chat histories.</li>
            </ul>
          </section>

          {/* Section 8: Contact */}
          <section className="bg-card border border-primary/20 p-6 sm:p-8 rounded-3xl space-y-3 bg-gradient-to-br from-card to-primary/5">
            <div className="flex items-center gap-3 text-foreground font-black text-lg">
              <Mail size={22} className="text-primary" />
              <h2>Contact Our Privacy Team</h2>
            </div>
            <p>
              If you have any questions, concerns, or requests regarding this Privacy Policy or your data privacy, please contact our Data Protection Officer:
            </p>
            <div className="p-4 rounded-2xl bg-card border border-border space-y-1 text-xs">
              <p><strong>Platform:</strong> Samyak Guru &amp; Samyak CEE Mastery</p>
              <p><strong>Email:</strong> <a href="mailto:privacy@samyakcee.com" className="text-primary hover:underline font-bold">privacy@samyakcee.com</a> / <a href="mailto:support@samyakcee.com" className="text-primary hover:underline font-bold">support@samyakcee.com</a></p>
              <p><strong>Helpline:</strong> +977-9800000000 / Kathmandu, Nepal</p>
            </div>
          </section>

        </div>
      </main>

      <HomepageFooter />
    </div>
  );
}
