'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import PublicNav from '@/components/PublicNav';
import HomepageFooter from '@/app/components/HomepageFooter';
import PageTransitionWrapper from '@/components/PageTransitionWrapper';
import {
  Sparkles,
  Download,
  BookOpen,
  CheckCircle2,
  ShieldCheck,
  Brain,
  Award,
  Loader2,
  ArrowRight,
  FileText,
} from 'lucide-react';
import { captureUtmParams, trackEvent } from '@/lib/tracking/tracker';
import { BIOLOGY_POWER_PACK_SUMMARY } from '@/lib/crm/biologyQuestionsData';

export default function LeadMagnetLandingClient() {
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [academicLevel, setAcademicLevel] = useState('Class 12 / Passed');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !email.trim()) {
      setErrorMsg('Please provide your name and email address.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const utms = captureUtmParams();
      const res = await fetch('/api/lead-magnet/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: firstName,
          email,
          phone,
          academic_level: academicLevel,
          landing_page: '/free-cee-biology-mcqs',
          referrer: typeof document !== 'undefined' ? document.referrer : null,
          ...utms,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit form');
      }

      try {
        localStorage.setItem('sc_lead_email', email.toLowerCase().trim());
      } catch (_) {}

      trackEvent('lead_form_submit', {
        leadMagnet: '500_cee_biology_mcqs',
        sourceContext: 'dedicated_landing_page',
      });

      setDownloadUrl(data.downloadUrl || '/api/lead-magnet/download');
      setSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransitionWrapper>
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <PublicNav />

        <main className="flex-1 pt-12 pb-24">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-12 gap-12 items-center">
              {/* Left Column: Value Proposition & Breakdown */}
              <div className="lg:col-span-7 space-y-6">
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-black border border-primary/20">
                  <Sparkles size={14} /> FREE LEAD MAGNET RESOURCE
                </div>

                <h1 className="text-3xl sm:text-5xl font-black text-foreground tracking-tight leading-tight">
                  FREE CEE BIOLOGY <span className="text-primary">POWER PACK</span>
                </h1>

                <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                  <strong>500 High-Yield CEE Biology MCQs + Detailed Explanations.</strong> Test yourself before you spend
                  a single rupee on your preparation.
                </p>

                <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
                  <div className="text-xs font-black uppercase text-primary tracking-wider">
                    Chapter-Wise High-Yield Marks Weightage (80 Marks Total)
                  </div>
                  <div className="grid sm:grid-cols-2 gap-2 text-xs">
                    {BIOLOGY_POWER_PACK_SUMMARY.breakdown.map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-muted/40 border border-border/50">
                        <span className="font-semibold text-foreground">{item.unit}</span>
                        <span className="text-primary font-mono font-bold">{item.weight}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 text-xs sm:text-sm text-foreground">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                    <span>250 Botany &amp; 250 Zoology questions with trap option analysis</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                    <span>Aligned 100% with the latest Medical Education Commission (MEC) 2026 syllabus</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                    <span>Includes 5-day automated revision challenge delivered to your inbox</span>
                  </div>
                </div>
              </div>

              {/* Right Column: High-Converting Lead Capture Box */}
              <div className="lg:col-span-5">
                <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-primary via-indigo-500 to-emerald-500" />

                  {!success ? (
                    <div>
                      <h2 className="text-xl font-black text-foreground mb-1">Get Your Free 500 MCQs</h2>
                      <p className="text-xs text-muted-foreground mb-6">
                        Enter your details below to unlock instant PDF access.
                      </p>

                      {errorMsg && (
                        <div className="p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold">
                          {errorMsg}
                        </div>
                      )}

                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-foreground mb-1">First Name *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Samyak"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-background border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-foreground mb-1">Email Address *</label>
                          <input
                            type="email"
                            required
                            placeholder="samyak@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-background border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-foreground mb-1">WhatsApp / Phone Number</label>
                          <input
                            type="tel"
                            placeholder="98XXXXXXXX (optional)"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-background border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-foreground mb-1">Academic Status</label>
                          <select
                            value={academicLevel}
                            onChange={(e) => setAcademicLevel(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-background border border-border text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                          >
                            <option value="Class 12 / Passed">Class 12 Passed (CEE Aspirant)</option>
                            <option value="Class 12">Currently in Class 12</option>
                            <option value="Class 11">Currently in Class 11</option>
                            <option value="SEE Passed">SEE Passed / Bridge Course</option>
                          </select>
                        </div>

                        <button
                          type="submit"
                          disabled={loading}
                          className="btn-primary w-full justify-center py-4 text-xs font-black shadow-xl shadow-primary/30 mt-2"
                        >
                          {loading ? (
                            <>
                              <Loader2 size={16} className="animate-spin" /> Preparing Free MCQs...
                            </>
                          ) : (
                            <>
                              <Download size={16} /> SEND ME THE FREE MCQs →
                            </>
                          )}
                        </button>

                        <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground pt-1">
                          <ShieldCheck size={14} className="text-emerald-500" />
                          <span>100% Free • No Spam • Unsubscribe with 1 click</span>
                        </div>
                      </form>
                    </div>
                  ) : (
                    <div className="text-center py-6 space-y-4 animate-scale-in">
                      <div className="w-16 h-16 rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center mx-auto">
                        <CheckCircle2 size={36} />
                      </div>

                      <div>
                        <h3 className="text-2xl font-black text-foreground">Your 500 MCQs Are Ready! 🎯</h3>
                        <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                          We have sent a copy to <strong className="text-foreground">{email}</strong>. You can also
                          view and print your study pack immediately below:
                        </p>
                      </div>

                      <div className="pt-3 space-y-3">
                        <a
                          href={downloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => trackEvent('pdf_download_click', { leadMagnet: '500_cee_biology_mcqs' })}
                          className="btn-primary w-full justify-center py-4 text-xs font-black shadow-xl shadow-primary/30"
                        >
                          <Download size={16} /> DOWNLOAD / PRINT PDF NOW →
                        </a>

                        <Link
                          href="/courses?sector=cee_medical"
                          className="block text-center text-xs font-bold text-primary hover:underline pt-2"
                        >
                          Explore Full Samyak CEE 2026 Preparation Course →
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>

        <HomepageFooter />
      </div>
    </PageTransitionWrapper>
  );
}
