'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle2, X, Star, Zap, Gem, MessageCircle, Smartphone, Loader2 } from 'lucide-react';
import { SUPPORT_CONFIG } from '@/lib/config/support';
import { PAYMENT_METHODS, enabledMethodsLabel } from '@/lib/config/payments';
import { createClient } from '@/lib/supabase/client';

const WHATSAPP_NUMBER = SUPPORT_CONFIG.whatsappNumber;

const plans = [
  {
    key: 'plan-free',
    name: 'Free',
    icon: Zap,
    price: { monthly: 0, yearly: 0 },
    currency: 'NPR',
    tagline: 'Get started with CEE prep',
    badge: null,
    color: 'text-muted-foreground',
    bg: 'bg-muted',
    borderClass: 'border-border',
    features: [
      { key: 'f-notes', text: '20 free chapter notes', included: true },
      { key: 'f-mcq', text: '200 practice MCQs/month', included: true },
      { key: 'f-leaderboard', text: 'Public leaderboard access', included: true },
      { key: 'f-videos', text: 'Video Lectures (Samyak Guru App)', included: true },
      { key: 'f-mock', text: 'Full mock exams', included: false },
      { key: 'f-battle', text: 'Battle Arena access', included: false },
      { key: 'f-analytics', text: 'Advanced analytics', included: false },
      { key: 'f-ai', text: 'AI Tutor access', included: false },
      { key: 'f-live', text: 'Live Classes (Samyak Guru App)', included: false },
    ],
    cta: 'Start Free',
    isFree: true,
  },
  {
    key: 'plan-student',
    name: 'Student',
    icon: Star,
    price: { monthly: 799, yearly: 7190 },
    currency: 'NPR',
    tagline: 'Everything you need for CEE',
    badge: 'Most Popular',
    color: 'text-primary',
    bg: 'bg-secondary',
    borderClass: 'border-primary/40',
    features: [
      { key: 'f-notes', text: 'All 1,200+ premium notes', included: true },
      { key: 'f-mcq', text: 'Unlimited practice MCQs', included: true },
      { key: 'f-leaderboard', text: 'Full leaderboard + rank', included: true },
      { key: 'f-videos', text: 'Video Lectures (Samyak Guru App)', included: true },
      { key: 'f-mock', text: 'Chapter & subject tests', included: true },
      { key: 'f-battle', text: 'Battle Arena access', included: true },
      { key: 'f-analytics', text: 'Standard analytics', included: true },
      { key: 'f-ai', text: 'AI Tutor access', included: false },
      { key: 'f-live', text: 'Live Classes (Samyak Guru App)', included: true },
    ],
    isFree: false,
  },
  {
    key: 'plan-pro',
    name: 'Pro',
    icon: Gem,
    price: { monthly: 1299, yearly: 11690 },
    currency: 'NPR',
    tagline: 'Maximum edge for top rankers',
    badge: 'Best Value',
    color: 'text-ma',
    bg: 'bg-ma-light',
    borderClass: 'border-ma/30',
    features: [
      { key: 'f-notes', text: 'All 1,200+ sub-chapter notes', included: true },
      { key: 'f-mcq', text: 'Unlimited practice MCQs', included: true },
      { key: 'f-leaderboard', text: 'Full leaderboard + rank', included: true },
      { key: 'f-videos', text: 'Video Lectures (Samyak Guru App)', included: true },
      { key: 'f-mock', text: 'Full mock exams + analysis', included: true },
      { key: 'f-battle', text: 'Battle Arena + Tournaments', included: true },
      { key: 'f-analytics', text: 'Advanced analytics + weak topics', included: true },
      { key: 'f-ai', text: 'AI Tutor (unlimited)', included: true },
      { key: 'f-live', text: 'All Live Classes (Samyak Guru App)', included: true },
    ],
    isFree: false,
  },
];

function buildWhatsAppUrl(planName: string, price: number, yearly: boolean): string {
  const period = yearly ? 'yearly' : 'monthly';
  const priceStr = price > 0 ? `NPR ${price.toLocaleString()}/${period}` : 'Free';
  const message = `Hi! I want to activate the *${planName} Plan* (${priceStr}) on Samyak CEE Mastery. Please send me the activation code. Thank you!`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export default function PricingSection() {
  const [yearly, setYearly] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const router = useRouter();

  // Require login BEFORE checkout: if the visitor isn't signed in, send them to
  // the auth screen with a redirect back to this exact checkout.
  const startCheckout = async (sku: string) => {
    setCheckoutLoading(sku);
    const dest = `/checkout?plan=${sku}`;
    try {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        router.push(dest);
      } else {
        router.push(`/sign-up-login-screen?redirect=${encodeURIComponent(dest)}`);
      }
    } catch {
      // If the auth check fails, still gate through login to be safe.
      router.push(`/sign-up-login-screen?redirect=${encodeURIComponent(dest)}`);
    }
  };

  return (
    <section id="pricing" className="py-16 bg-muted/30">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="text-center mb-10">
          <p className="section-label mb-2">Pricing</p>
          <h2 className="text-hero-md text-foreground">Simple, Transparent Plans</h2>
          <p className="text-muted-foreground mt-2">
            {PAYMENT_METHODS.whatsappCode
              ? 'Choose a plan, contact us on WhatsApp, and get your activation code instantly.'
              : 'Choose a plan and pay securely with Fonepay — your access unlocks the moment payment is confirmed.'}
          </p>

          <div className="flex items-center justify-center gap-3 mt-6">
            <span className={`text-sm font-medium ${!yearly ? 'text-foreground' : 'text-muted-foreground'}`}>Monthly</span>
            <button
              onClick={() => setYearly(!yearly)}
              className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${yearly ? 'bg-primary' : 'bg-muted'}`}
              aria-label="Toggle billing period"
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${yearly ? 'translate-x-7' : 'translate-x-1'}`} />
            </button>
            <span className={`text-sm font-medium ${yearly ? 'text-foreground' : 'text-muted-foreground'}`}>
              Yearly
              <span className="ml-1.5 bg-success-light text-success text-xs font-bold px-1.5 py-0.5 rounded-full">Save 25%</span>
            </span>
          </div>
        </div>

        {/* 45-Day Crash Course Prebooking Highlight Banner */}
        <div className="max-w-5xl mx-auto mb-8 p-5 bg-gradient-to-r from-primary/10 via-secondary to-primary/5 border border-primary/30 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl shrink-0">
              🚀
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-primary/20 text-primary font-bold text-[11px] px-2 py-0.5 rounded-full uppercase tracking-wider">7-Week Launch Offer</span>
                <span className="text-xs font-semibold text-success">Save Rs 700</span>
              </div>
              <h3 className="font-bold text-base text-foreground mt-0.5">45-Day CEE Crash Course Prebooking</h3>
              <p className="text-xs text-muted-foreground">Reserve your seat for <strong>Rs 300</strong> today & get the course for <strong>Rs 2,299</strong> (instead of Rs 2,999).</p>
            </div>
          </div>
          <Link
            href="/prebook"
            className="btn-primary shrink-0 text-sm py-2.5 px-5 font-bold shadow-md hover:shadow-lg transition-all"
          >
            Prebook Seat (Rs 300) →
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans?.map((plan) => {
            const price = yearly ? Math.round(plan?.price?.yearly / 12) : plan?.price?.monthly;
            const whatsappUrl = buildWhatsAppUrl(plan.name, yearly ? plan.price.yearly : plan.price.monthly, yearly);

            return (
              <div
                key={plan?.key}
                className={`card-base border-2 ${plan?.borderClass} flex flex-col relative ${plan?.badge === 'Most Popular' ? 'shadow-primary' : 'shadow-card'}`}
              >
                {plan?.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${plan?.badge === 'Most Popular' ? 'bg-primary text-white' : 'bg-ma text-white'}`}>
                      {plan?.badge}
                    </span>
                  </div>
                )}

                <div className="mb-5">
                  <div className={`w-10 h-10 rounded-xl ${plan?.bg} flex items-center justify-center mb-3`}>
                    <plan.icon size={20} className={plan?.color} />
                  </div>
                  <h3 className="font-bold text-xl text-foreground">{plan?.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{plan?.tagline}</p>
                </div>

                <div className="mb-5">
                  {plan?.price?.monthly === 0 ? (
                    <p className="text-3xl font-bold text-foreground">Free</p>
                  ) : (
                    <div>
                      <span className="text-3xl font-bold text-foreground tabular-nums">
                        NPR {price?.toLocaleString()}
                      </span>
                      <span className="text-sm text-muted-foreground">/month</span>
                      {yearly && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Billed NPR {plan?.price?.yearly?.toLocaleString()} yearly
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <ul className="space-y-2 mb-6 flex-1">
                  {plan?.features?.map((f) => (
                    <li key={f?.key} className="flex items-center gap-2">
                      {f?.included ? (
                        <CheckCircle2 size={15} className="text-success shrink-0" />
                      ) : (
                        <X size={15} className="text-muted-foreground shrink-0" />
                      )}
                      <span className={`text-sm ${f?.included ? 'text-foreground' : 'text-muted-foreground line-through'}`}>
                        {f?.text}
                      </span>
                    </li>
                  ))}
                </ul>

                {plan?.isFree ? (
                  <Link href="/practice" className="btn-secondary w-full justify-center text-center">
                    Start Free
                  </Link>
                ) : (
                  <div className="flex flex-col gap-2">
                    {PAYMENT_METHODS.fonepay && (() => {
                      const sku = `${plan.name.toLowerCase()}-${yearly ? 'yearly' : 'monthly'}`;
                      const loading = checkoutLoading === sku;
                      return (
                        <button
                          type="button"
                          onClick={() => startCheckout(sku)}
                          disabled={loading}
                          className="btn-primary w-full justify-center flex items-center gap-2 text-center disabled:opacity-70"
                        >
                          {loading ? <Loader2 size={16} className="animate-spin" /> : <Smartphone size={16} />}
                          {loading ? 'Opening…' : 'Pay with Fonepay'}
                        </button>
                      );
                    })()}
                    {PAYMENT_METHODS.whatsappCode && (
                      <>
                        <a
                          href={whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`${PAYMENT_METHODS.fonepay ? 'btn-secondary' : 'btn-primary'} w-full justify-center flex items-center gap-2 text-center`}
                        >
                          <MessageCircle size={16} />
                          Get {plan?.name} Plan
                        </a>
                        <Link
                          href="/activate-plan"
                          className="text-xs text-center text-muted-foreground hover:text-primary transition-colors"
                        >
                          Already have a code? Activate →
                        </Link>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-8 max-w-xl mx-auto bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-sm font-medium text-foreground mb-1">How it works</p>
          {PAYMENT_METHODS.whatsappCode ? (
            <ol className="text-xs text-muted-foreground space-y-1 text-left list-decimal list-inside">
              <li>Click <strong>Get Plan</strong> — it opens WhatsApp with a pre-filled message</li>
              <li>Send the message to our team and complete your payment</li>
              <li>Receive your unique activation code over WhatsApp</li>
              <li>Enter the code on the <Link href="/activate-plan" className="text-primary hover:underline">Activate Plan</Link> page to unlock your plan</li>
            </ol>
          ) : (
            <ol className="text-xs text-muted-foreground space-y-1 text-left list-decimal list-inside">
              <li>Click <strong>Pay with Fonepay</strong> on your chosen plan</li>
              <li>Scan the QR with any mobile-banking or wallet app that supports Fonepay</li>
              <li>Your plan unlocks automatically the moment the payment is confirmed</li>
            </ol>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Payments via {enabledMethodsLabel()}. All prices in NPR. 7-day refund policy.
        </p>
      </div>
    </section>
  );
}