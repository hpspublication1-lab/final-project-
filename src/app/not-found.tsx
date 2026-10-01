import React from 'react';
import Link from 'next/link';
import PageTransitionWrapper from '@/components/PageTransitionWrapper';
import { Home, BookOpen, Zap, ClipboardList, AlertTriangle, HelpCircle, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <PageTransitionWrapper>
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-16 text-foreground">
        <div className="text-center max-w-xl mx-auto space-y-6">
          <div className="relative">
            <h1 className="text-8xl sm:text-9xl font-black text-primary/15 select-none">404</h1>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-mono font-black uppercase px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                Route Not Found
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              Lost in the Curriculum?
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
              The page or resource you are looking for does not exist or may have been moved. Choose an academic hub below to continue:
            </p>
          </div>

          {/* Quick Hub Navigation Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-left pt-2">
            <Link
              href="/courses"
              className="p-3.5 rounded-2xl bg-card border border-border/80 hover:border-primary/60 transition-all group"
            >
              <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <BookOpen size={16} />
              </div>
              <p className="text-xs font-bold text-foreground">Courses &amp; Batches</p>
              <p className="text-[10px] text-muted-foreground">CEE &amp; SEE Curricula</p>
            </Link>

            <Link
              href="/practice"
              className="p-3.5 rounded-2xl bg-card border border-border/80 hover:border-amber-500/60 transition-all group"
            >
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Zap size={16} />
              </div>
              <p className="text-xs font-bold text-foreground">Practice MCQs</p>
              <p className="text-[10px] text-muted-foreground">15,000+ Question Bank</p>
            </Link>

            <Link
              href="/mock-tests"
              className="p-3.5 rounded-2xl bg-card border border-border/80 hover:border-indigo-500/60 transition-all group"
            >
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <ClipboardList size={16} />
              </div>
              <p className="text-xs font-bold text-foreground">Mock Exams</p>
              <p className="text-[10px] text-muted-foreground">Timed -0.25 Marking</p>
            </Link>

            <Link
              href="/mistake-analyser"
              className="p-3.5 rounded-2xl bg-card border border-border/80 hover:border-rose-500/60 transition-all group"
            >
              <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <AlertTriangle size={16} />
              </div>
              <p className="text-xs font-bold text-foreground">Mistakes Log</p>
              <p className="text-[10px] text-muted-foreground">Personalized Revision</p>
            </Link>

            <Link
              href="/student-dashboard"
              className="p-3.5 rounded-2xl bg-card border border-border/80 hover:border-emerald-500/60 transition-all group"
            >
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Home size={16} />
              </div>
              <p className="text-xs font-bold text-foreground">Student Home</p>
              <p className="text-[10px] text-muted-foreground">Dashboard &amp; Progress</p>
            </Link>

            <Link
              href="/contact"
              className="p-3.5 rounded-2xl bg-card border border-border/80 hover:border-sky-500/60 transition-all group"
            >
              <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <HelpCircle size={16} />
              </div>
              <p className="text-xs font-bold text-foreground">Help &amp; Support</p>
              <p className="text-[10px] text-muted-foreground">WhatsApp &amp; FAQs</p>
            </Link>
          </div>

          <div className="pt-4 flex justify-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 btn-primary text-xs font-bold py-3 px-6 rounded-2xl shadow-sm"
            >
              <ArrowLeft size={14} />
              <span>Back to Homepage</span>
            </Link>
          </div>
        </div>
      </div>
    </PageTransitionWrapper>
  );
}