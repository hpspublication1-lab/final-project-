'use client';

import React, { useState, useEffect } from 'react';
import PublicNav from '@/components/PublicNav';
import SamyakClassroomWorkspace from '@/components/neural/SamyakClassroomWorkspace';
import { Brain, Sparkles, Award, Video, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function LiveTeacherClassroomPage() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (isDark) {
      document.documentElement?.classList?.add('dark');
    } else {
      document.documentElement?.classList?.remove('dark');
    }
  }, [isDark]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <PublicNav isDark={isDark} onToggleDark={() => setIsDark(!isDark)} />

      {/* Hero Section */}
      <section className="pt-28 pb-8 bg-gradient-to-b from-amber-500/10 via-card to-background border-b border-border">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 text-amber-600 text-xs font-black border border-amber-500/20">
            <Video size={14} /> Samyak Custom Branded AI Avatar Classroom
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-foreground tracking-tight leading-tight">
            1-on-1 Interactive AI <span className="text-amber-600">Avatar Teacher Stage</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-xl mx-auto">
            Experience Coach Aria with animated lip-sync, procedural eye blinking, expression controls, live synced subtitles, and an interactive digital whiteboard.
          </p>
        </div>
      </section>

      {/* Main Workspace */}
      <section className="py-8 max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-1 space-y-8">
        <SamyakClassroomWorkspace />
      </section>
    </div>
  );
}
