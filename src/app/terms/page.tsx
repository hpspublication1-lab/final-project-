'use client';

import React from 'react';
import PublicNav from '@/components/PublicNav';
import HomepageFooter from '@/app/components/HomepageFooter';

export default function TermsPage() {
  const [isDark, setIsDark] = React.useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <PublicNav isDark={isDark} onToggleDark={() => setIsDark(!isDark)} />

      <main className="flex-1 pt-28 pb-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
        <h1 className="text-3xl font-black mb-2">Terms of Service</h1>
        <p className="text-xs text-muted-foreground mb-8">Last Updated: July 2026</p>

        <div className="prose dark:prose-invert max-w-none space-y-6 text-sm text-muted-foreground leading-relaxed">
          <section className="bg-card border border-border p-6 rounded-2xl">
            <h2 className="text-base font-bold text-foreground mb-2">1. Acceptance of Terms</h2>
            <p>
              By accessing and using Samyak CEE Mastery (&quot;the Platform&quot;), you agree to comply with and be bound by these Terms of Service. If you do not agree, please discontinue use immediately.
            </p>
          </section>

          <section className="bg-card border border-border p-6 rounded-2xl">
            <h2 className="text-base font-bold text-foreground mb-2">2. Educational Content & Scope</h2>
            <p>
              All study materials, practice questions, mock tests, and AI tools on the Platform are for individual CEE medical entrance preparation. Video lectures and live streaming features are accessible via our official Samyak Guru App.
            </p>
          </section>

          <section className="bg-card border border-border p-6 rounded-2xl">
            <h2 className="text-base font-bold text-foreground mb-2">3. User Accounts & Integrity</h2>
            <p>
              You are responsible for maintaining the confidentiality of your account credentials. Sharing account access, automated scraping, or exploiting exam battle systems will result in immediate suspension.
            </p>
          </section>

          <section className="bg-card border border-border p-6 rounded-2xl">
            <h2 className="text-base font-bold text-foreground mb-2">4. Payments & Refunds</h2>
            <p>
              Subscription and prebooking payments are processed via Fonepay (dynamic QR). Prebooking token fees (Rs 300) are fully credited toward final course enrolment.
            </p>
          </section>
        </div>
      </main>

      <HomepageFooter />
    </div>
  );
}
