'use client';

import React, { useState } from 'react';
import { X, Sparkles, Download, CheckCircle2, Loader2, BookOpen, ShieldCheck } from 'lucide-react';
import { captureUtmParams, trackEvent } from '@/lib/tracking/tracker';

interface LeadCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  sourceContext?: string;
}

export default function LeadCaptureModal({
  isOpen,
  onClose,
  title = 'FREE CEE BIOLOGY POWER PACK',
  subtitle = '500 High-Yield CEE Biology MCQs + Detailed Explanations',
  sourceContext = 'modal_popup',
}: LeadCaptureModalProps) {
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [academicLevel, setAcademicLevel] = useState('Class 12 / Passed');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

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
          landing_page: window.location.pathname,
          referrer: document.referrer || null,
          ...utms,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit form');
      }

      // Store in localStorage for anonymous to lead resolution
      try {
        localStorage.setItem('sc_lead_email', email.toLowerCase().trim());
      } catch (_) {}

      trackEvent('lead_form_submit', {
        leadMagnet: '500_cee_biology_mcqs',
        sourceContext,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-lg bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors"
          aria-label="Close modal"
        >
          <X size={18} />
        </button>

        {!success ? (
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-black mb-3 border border-primary/20">
              <Sparkles size={13} /> 100% Free CEE Study Pack
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight mb-1">{title}</h2>
            <p className="text-xs sm:text-sm text-muted-foreground mb-4">{subtitle}</p>

            <div className="bg-muted/40 border border-border/60 rounded-2xl p-3.5 mb-5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <BookOpen size={20} />
              </div>
              <p className="text-xs text-muted-foreground leading-snug">
                <strong className="text-foreground">Test yourself</strong> before you spend a single rupee on your
                preparation. Chapter-wise Botany &amp; Zoology with trap option warnings.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">First Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Samyak"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
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
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">WhatsApp / Phone</label>
                  <input
                    type="tel"
                    placeholder="98XXXXXXXX (optional)"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">Current Class</label>
                  <select
                    value={academicLevel}
                    onChange={(e) => setAcademicLevel(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    <option value="Class 11">Class 11</option>
                    <option value="Class 12">Class 12</option>
                    <option value="Class 12 / Passed">Class 12 Passed (CEE Dropper)</option>
                    <option value="SEE Passed">SEE Passed</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full justify-center py-3 text-xs font-black shadow-lg shadow-primary/25 mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Preparing Free MCQs...
                  </>
                ) : (
                  <>
                    <Download size={16} /> SEND ME THE FREE MCQs (PDF)
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground pt-1">
                <ShieldCheck size={13} className="text-emerald-500" />
                <span>Zero spam. Instant access. Unsubscribe anytime with 1 click.</span>
              </div>
            </form>
          </div>
        ) : (
          <div className="text-center py-4 space-y-4 animate-scale-in">
            <div className="w-14 h-14 rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center mx-auto">
              <CheckCircle2 size={32} />
            </div>

            <div>
              <h3 className="text-xl font-black text-foreground">Your 500 MCQs Are Ready! 🎯</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                We have also sent a copy to <strong className="text-foreground">{email}</strong> with your CEE Biology
                diagnostic challenge.
              </p>
            </div>

            <div className="pt-2">
              <a
                href={downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackEvent('pdf_download_click', { leadMagnet: '500_cee_biology_mcqs' })}
                className="btn-primary w-full justify-center py-3.5 text-xs font-black shadow-lg shadow-primary/25"
              >
                <Download size={16} /> DOWNLOAD THE FREE PDF NOW →
              </a>
            </div>

            <button onClick={onClose} className="text-xs font-bold text-muted-foreground hover:text-foreground pt-2">
              Done / Return to website
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
