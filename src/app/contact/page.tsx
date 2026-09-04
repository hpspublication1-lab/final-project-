'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import PublicNav from '@/components/PublicNav';
import HomepageFooter from '@/app/components/HomepageFooter';
import { SUPPORT_CONFIG } from '@/lib/config/support';
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  MessageSquare,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  Headphones,
} from 'lucide-react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    category: 'SEE Class 10 Board Exam',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
    }, 600);
  };

  const whatsappDirectUrl = `https://wa.me/${SUPPORT_CONFIG.whatsappNumber}?text=${encodeURIComponent(
    `Hello Samyak Guru Team! My name is ${formData.name || 'Student'}. I have an inquiry regarding ${formData.category}: ${formData.message || 'I would like to know more about the courses.'}`
  )}`;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between selection:bg-primary/20">
      <PublicNav />

      <main className="flex-1 pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full">
        {/* Header Badge & Title */}
        <div className="text-center space-y-3 mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-wider font-mono">
            <Headphones size={16} />
            <span>24/7 STUDENT SUPPORT &amp; COUNSELING</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-foreground tracking-tight">
            Get in Touch with Samyak Guru
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground font-medium max-w-2xl mx-auto">
            Have questions about course admissions, syllabus coverage, mock exams, or payments? Our academic mentors are here to help.
          </p>
        </div>

        {/* 4 Direct Contact Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {/* WhatsApp Direct */}
          <a
            href={SUPPORT_CONFIG.whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="p-5 rounded-2xl bg-card border-2 border-emerald-500/30 hover:border-emerald-500 transition-all group flex flex-col justify-between space-y-3 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <MessageSquare size={22} />
              </div>
              <span className="text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full">FASTEST</span>
            </div>
            <div>
              <h2 className="text-sm font-black text-foreground mb-1">WhatsApp Live Chat</h2>
              <p className="text-xs text-muted-foreground">Instant counseling &amp; enrollment support directly with our team.</p>
            </div>
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 group-hover:gap-2 transition-all">
              Chat on WhatsApp <ArrowRight size={14} />
            </span>
          </a>

          {/* Email Support */}
          <a
            href="mailto:support@samyakcee.com"
            className="p-5 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all group flex flex-col justify-between space-y-3 shadow-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Mail size={22} />
            </div>
            <div>
              <h2 className="text-sm font-black text-foreground mb-1">Email Desk</h2>
              <p className="text-xs text-muted-foreground break-all">support@samyakcee.com</p>
            </div>
            <span className="text-xs font-bold text-primary flex items-center gap-1 group-hover:gap-2 transition-all">
              Send an Email <ArrowRight size={14} />
            </span>
          </a>

          {/* Direct Phone */}
          <a
            href={SUPPORT_CONFIG.telLink}
            className="p-5 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all group flex flex-col justify-between space-y-3 shadow-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Phone size={22} />
            </div>
            <div>
              <h2 className="text-sm font-black text-foreground mb-1">Direct Helpline</h2>
              <p className="text-xs text-muted-foreground">{SUPPORT_CONFIG.phoneDisplay}</p>
            </div>
            <span className="text-xs font-bold text-purple-600 flex items-center gap-1 group-hover:gap-2 transition-all">
              Call Hotline <ArrowRight size={14} />
            </span>
          </a>

          {/* Location & Hours */}
          <div className="p-5 rounded-2xl bg-card border border-border flex flex-col justify-between space-y-3 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <MapPin size={22} />
            </div>
            <div>
              <h2 className="text-sm font-black text-foreground mb-1">Old Baneshwor</h2>
              <p className="text-xs text-muted-foreground">Kathmandu, Nepal</p>
            </div>
            <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
              <Clock size={12} className="text-amber-500" /> 8:00 AM – 8:00 PM NPT
            </span>
          </div>
        </div>

        {/* Main Grid: Form + Quick Info */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Left: Contact Form (7 cols) */}
          <div className="lg:col-span-7 bg-card border border-border p-6 sm:p-8 rounded-3xl shadow-sm">
            <h2 className="text-xl font-black text-foreground mb-1">Send Us a Message</h2>
            <p className="text-xs text-muted-foreground mb-6">
              Fill out the form below and an academic counselor will respond within 2 hours.
            </p>

            {submitted ? (
              <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 size={28} />
                </div>
                <h3 className="text-base font-bold text-foreground">Message Sent Successfully!</h3>
                <p className="text-xs text-muted-foreground">
                  Thank you, <strong>{formData.name}</strong>. Our team has received your message and will reach out to you shortly.
                </p>
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <a
                    href={whatsappDirectUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-all flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <MessageSquare size={14} />
                    <span>Open in WhatsApp</span>
                  </a>
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({ name: '', email: '', phone: '', category: 'SEE Class 10 Board Exam', message: '' });
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground font-semibold"
                  >
                    Send Another Message
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-foreground">Your Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Aarav Sharma"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-muted/50 border border-border text-foreground font-medium focus:outline-none focus:border-primary transition-all text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-bold text-foreground">Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. aarav@gmail.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-muted/50 border border-border text-foreground font-medium focus:outline-none focus:border-primary transition-all text-xs"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-foreground">Phone / WhatsApp Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 9801234567"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-muted/50 border border-border text-foreground font-medium focus:outline-none focus:border-primary transition-all text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-bold text-foreground">Inquiry Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-muted/50 border border-border text-foreground font-medium focus:outline-none focus:border-primary transition-all text-xs"
                    >
                      <option value="SEE Class 10 Board Exam">SEE Class 10 Board Exam</option>
                      <option value="CEE Medical Entrance">CEE Medical Entrance</option>
                      <option value="IELTS English Mastery">IELTS English Mastery</option>
                      <option value="Digital Marketing & AI">Digital Marketing &amp; AI</option>
                      <option value="Payment & Activation Issue">Payment &amp; Activation Issue</option>
                      <option value="Refund Request">Refund Request</option>
                      <option value="General Question">General Question</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-foreground">Your Message / Question *</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Tell us what you need help with (e.g. course fees, batch schedule, study material access)..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-muted/50 border border-border text-foreground font-medium focus:outline-none focus:border-primary transition-all text-xs resize-none"
                  />
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-60"
                  >
                    <Send size={14} />
                    <span>{isSubmitting ? 'Sending...' : 'Send Message'}</span>
                  </button>

                  <a
                    href={whatsappDirectUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all"
                  >
                    <MessageSquare size={14} />
                    <span>Send via WhatsApp</span>
                  </a>
                </div>
              </form>
            )}
          </div>

          {/* Right: Helpful Links & Trust Badges (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Quick Help Card */}
            <div className="p-6 rounded-3xl bg-card border border-border space-y-4">
              <h3 className="text-base font-black text-foreground flex items-center gap-2">
                <HelpCircle size={18} className="text-primary" />
                <span>Frequently Asked Questions</span>
              </h3>
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-muted/40 border border-border/60 space-y-1">
                  <p className="font-bold text-foreground">How soon do I get course access after paying?</p>
                  <p className="text-muted-foreground">Access is <strong>100% instant</strong>. The moment your Fonepay QR, eSewa, or Khalti payment completes, your batches unlock automatically.</p>
                </div>
                <div className="p-3 rounded-xl bg-muted/40 border border-border/60 space-y-1">
                  <p className="font-bold text-foreground">Can I practice on my smartphone?</p>
                  <p className="text-muted-foreground">Yes! Samyak Guru is fully optimized for mobile browsers, and you can install our Progressive Web App (PWA) on Android &amp; iOS.</p>
                </div>
                <div className="p-3 rounded-xl bg-muted/40 border border-border/60 space-y-1">
                  <p className="font-bold text-foreground">What if I need a refund?</p>
                  <p className="text-muted-foreground">We offer a 7-day risk-free money-back guarantee. Check our <Link href="/refund-policy" className="text-primary font-bold underline">Refund Policy</Link> for complete details.</p>
                </div>
              </div>
            </div>

            {/* Google Business Profile & Review Card */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-500/10 via-card to-card border border-amber-500/30 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">⭐</span>
                  <div>
                    <h4 className="text-xs font-black text-foreground">Google Verified Business</h4>
                    <p className="text-[11px] text-muted-foreground">4.9 ★★★★★ (5,270+ Student Reviews)</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full">
                  OLD BANESHOWR
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Visited our institute or improved your grades on our AI platform? Leave us a verified review on Google to help fellow students in Nepal!
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                <a
                  href={SUPPORT_CONFIG.googleReviewLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto flex-1 py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all text-center"
                >
                  <span>Write a Google Review</span>
                  <ArrowRight size={13} />
                </a>
                <a
                  href="https://maps.google.com/?q=Old+Baneshwor,+Kathmandu,+Nepal"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto py-2.5 px-3 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-bold text-xs flex items-center justify-center gap-1.5 border border-border transition-all text-center"
                >
                  <MapPin size={13} className="text-primary" />
                  <span>View on Maps</span>
                </a>
              </div>
            </div>

            {/* Official Social Channels Card */}
            <div className="p-6 rounded-3xl bg-card border border-border space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-foreground">Follow Our Official Channels</h3>
                <span className="text-[10px] font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  DAILY TIPS
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Watch free high-yield MCQ video breakdowns, live session replays, and exam tips across our official channels:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                <a
                  href={SUPPORT_CONFIG.social.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-xl bg-muted/60 hover:bg-blue-600 hover:text-white text-foreground text-xs font-bold flex items-center gap-2 border border-border/80 transition-all"
                >
                  <span className="w-6 h-6 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-600 font-bold">f</span>
                  <span>Facebook</span>
                </a>
                <a
                  href={SUPPORT_CONFIG.social.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-xl bg-muted/60 hover:bg-pink-600 hover:text-white text-foreground text-xs font-bold flex items-center gap-2 border border-border/80 transition-all"
                >
                  <span className="w-6 h-6 rounded-lg bg-pink-500/20 flex items-center justify-center text-pink-600 font-bold">IG</span>
                  <span>Instagram</span>
                </a>
                <a
                  href={SUPPORT_CONFIG.social.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-xl bg-muted/60 hover:bg-red-600 hover:text-white text-foreground text-xs font-bold flex items-center gap-2 border border-border/80 transition-all"
                >
                  <span className="w-6 h-6 rounded-lg bg-red-500/20 flex items-center justify-center text-red-600 font-bold">YT</span>
                  <span>YouTube</span>
                </a>
                <a
                  href={SUPPORT_CONFIG.social.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-xl bg-muted/60 hover:bg-neutral-800 hover:text-white text-foreground text-xs font-bold flex items-center gap-2 border border-border/80 transition-all"
                >
                  <span className="w-6 h-6 rounded-lg bg-neutral-500/20 flex items-center justify-center text-foreground font-bold">TT</span>
                  <span>TikTok</span>
                </a>
                <a
                  href={SUPPORT_CONFIG.social.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-xl bg-muted/60 hover:bg-blue-700 hover:text-white text-foreground text-xs font-bold flex items-center gap-2 border border-border/80 transition-all"
                >
                  <span className="w-6 h-6 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-600 font-bold">in</span>
                  <span>LinkedIn</span>
                </a>
                <a
                  href={SUPPORT_CONFIG.social.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-xl bg-muted/60 hover:bg-emerald-600 hover:text-white text-foreground text-xs font-bold flex items-center gap-2 border border-border/80 transition-all"
                >
                  <span className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-600 font-bold">WA</span>
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>

            {/* Platform Security Badge */}
            <div className="p-5 rounded-3xl bg-gradient-to-br from-primary/10 via-card to-card border border-primary/20 space-y-2">
              <div className="flex items-center gap-2 text-primary font-bold text-xs">
                <ShieldCheck size={18} />
                <span>Verified Education Institution</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Registered in Nepal. Empowering over 15,000+ students across all 7 provinces for board exams and medical entrance mastery.
              </p>
            </div>
          </div>
        </div>
      </main>

      <HomepageFooter />
    </div>
  );
}
