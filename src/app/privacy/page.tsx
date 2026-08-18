'use client';

import React from 'react';
import PublicNav from '@/components/PublicNav';
import HomepageFooter from '@/app/components/HomepageFooter';

export default function PrivacyPage() {
  const [isDark, setIsDark] = React.useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <PublicNav isDark={isDark} onToggleDark={() => setIsDark(!isDark)} />

      <main className="flex-1 pt-28 pb-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
        <h1 className="text-3xl font-black mb-2">Privacy Policy</h1>
        <p className="text-xs text-muted-foreground mb-8">Last Updated: July 2026</p>

        <div className="prose dark:prose-invert max-w-none space-y-6 text-sm text-muted-foreground leading-relaxed">
          <section className="bg-card border border-border p-6 rounded-2xl">
            <h2 className="text-base font-bold text-foreground mb-2">1. Information We Collect</h2>
            <p>
              We collect information provided during registration (Full Name, Phone Number, Email Address, and College) to personalize your study plan and maintain your learning progress.
            </p>
          </section>

          <section className="bg-card border border-border p-6 rounded-2xl">
            <h2 className="text-base font-bold text-foreground mb-2">2. Data Security & Storage</h2>
            <p>
              All personal data and exam performance logs are secured using enterprise-grade encryption. We never share or sell your phone number or email address to third-party advertisers.
            </p>
          </section>

          <section className="bg-card border border-border p-6 rounded-2xl">
            <h2 className="text-base font-bold text-foreground mb-2">3. Payment Privacy</h2>
            <p>
              Payment transactions are processed directly by authorized payment gateways. Samyak CEE Mastery does not store your banking credentials or wallet PINs on our servers.
            </p>
          </section>
        </div>
      </main>

      <HomepageFooter />
    </div>
  );
}
