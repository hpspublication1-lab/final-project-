'use client';

import React from 'react';
import PublicNav from '@/components/PublicNav';
import HomepageFooter from '@/app/components/HomepageFooter';
import { Target, Users, Trophy, BookOpen, Sparkles } from 'lucide-react';
import { SUPPORT_CONFIG } from '@/lib/config/support';

export default function AboutPage() {
  const [isDark, setIsDark] = React.useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <PublicNav isDark={isDark} onToggleDark={() => setIsDark(!isDark)} />

      <main className="flex-1 pt-28 pb-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles size={14} /> About Samyak CEE Mastery
          </span>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight mb-4">
            Empowering Nepal's Medical Aspirants
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Samyak CEE Mastery is Nepal&apos;s #1 medical entrance exam preparation platform designed specifically for the Common Entrance Examination (CEE) conducted by the Medical Education Commission.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6 mb-12">
          <div className="card-base p-6 border border-border rounded-2xl">
            <div className="w-10 h-10 rounded-xl bg-bio-light text-bio flex items-center justify-center mb-4">
              <Target size={20} />
            </div>
            <h3 className="font-bold text-lg mb-2">Our Mission</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              To democratize high-quality CEE preparation across all provinces of Nepal by delivering high-yield MCQs, structured chapter notes, AI doubt solving, and competitive practice tools.
            </p>
          </div>

          <div className="card-base p-6 border border-border rounded-2xl">
            <div className="w-10 h-10 rounded-xl bg-chem-light text-chem flex items-center justify-center mb-4">
              <Trophy size={20} />
            </div>
            <h3 className="font-bold text-lg mb-2">Evidence-Based Platform</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Powered by 15,000+ verified practice MCQs, 1,200+ sub-chapter notes, 8 specialized AI agents, and 100% curriculum alignment with NEB &amp; MEC syllabi.
            </p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-3xl p-8 text-center">
          <h2 className="text-xl font-bold mb-3">Need Support or Have Questions?</h2>
          <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto">
            Our student assistance desk is ready to help you on WhatsApp or via direct phone call.
          </p>
          <a
            href={SUPPORT_CONFIG.whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary inline-flex items-center gap-2 py-3 px-6 text-sm font-bold shadow-md"
          >
            Chat with Support (+977 9709066151)
          </a>
        </div>
      </main>

      <HomepageFooter />
    </div>
  );
}
