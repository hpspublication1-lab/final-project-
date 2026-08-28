'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import PublicNav from '@/components/PublicNav';
import HomepageFooter from '@/app/components/HomepageFooter';
import { useAuth } from '@/contexts/AuthContext';
import { useProgram } from '@/contexts/ProgramContext';
import {
  GraduationCap, ShieldCheck, QrCode, CheckCircle2, AlertCircle,
  ArrowRight, Loader2, Tag, Phone, Zap, Lock, CreditCard, Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';

interface PlanConfig {
  id: string;
  name: string;
  price: number;
  priceFormatted: string;
  badge: string;
  desc: string;
}

const PLANS: Record<string, PlanConfig> = {
  '7day': {
    id: '7day',
    name: 'SEE 7-Day Challenge',
    price: 199,
    priceFormatted: 'NPR 199',
    badge: 'REVISION BOOTCAMP',
    desc: '7 days of intensive formula drills & core Science/Math problem solving.',
  },
  mission_a: {
    id: 'mission_a',
    name: 'SEE Mission A+ Complete',
    price: 2490,
    priceFormatted: 'NPR 2,490',
    badge: 'MOST POPULAR',
    desc: 'Full 147 video chapters, 10-year model paper bank & 24/7 AI Doubt Solver.',
  },
  mission_pro: {
    id: 'mission_pro',
    name: 'SEE Mission A+ Pro',
    price: 4990,
    priceFormatted: 'NPR 4,990',
    badge: '1-ON-1 TUTOR + GUARANTEE',
    desc: 'Includes everything in Mission A+ plus 1-on-1 AI Teacher sessions & board guarantee.',
  },
};

export default function SeeCheckoutClient() {
  const { user, profile } = useAuth();
  const { setProgram } = useProgram();
  const router = useRouter();
  const searchParams = useSearchParams();

  // 1. SELECT PLAN
  const planQuery = searchParams.get('plan') || 'mission_a';
  const [selectedPlanId, setSelectedPlanId] = useState<string>(PLANS[planQuery] ? planQuery : 'mission_a');
  const selectedPlan = PLANS[selectedPlanId] || PLANS.mission_a;

  // 2. PHONE NUMBER & DETAILS
  const [studentPhone, setStudentPhone] = useState<string>('+977 9801234567');
  const [studentName, setStudentName] = useState<string>(profile?.full_name || 'Suraj Sharma');

  // 3. PAYMENT METHOD (eSewa / Khalti / IME Pay / Fonepay)
  const [paymentMethod, setPaymentMethod] = useState<'esewa' | 'khalti' | 'imepay' | 'fonepay'>('esewa');

  // 4. COUPON
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponDiscount, setCouponDiscount] = useState(0);

  // States
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const finalPrice = Math.max(99, selectedPlan.price - couponDiscount);

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) return;
    if (couponCode.trim().toUpperCase() === 'SEE2082' || couponCode.trim().toUpperCase() === 'TOPPER') {
      setCouponDiscount(500);
      setCouponApplied(true);
      setErrorMessage(null);
      toast.success('Coupon Applied! Extra NPR 500 Discount');
    } else {
      setErrorMessage('Invalid or expired coupon code');
    }
  };

  // 60-SECOND INSTANT PAY & AUTOMATIC ACTIVATION FLOW
  const handleInstantPay = async () => {
    if (!studentPhone.trim() || studentPhone.length < 8) {
      toast.error('Please enter a valid mobile phone number!');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    // Explicitly lock active program context to see_class_10
    setProgram('see_class_10');

    // Simulate instant Nepal gateway payment verification (eSewa / Khalti / Fonepay)
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
      toast.success('Payment Verified! SEE Master Batch Activated.');

      // Redirect to SEE Dashboard after 1.5 seconds
      setTimeout(() => {
        router.push('/see');
      }, 1500);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      <PublicNav />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 w-full">
        
        {/* Step Indicator Header */}
        <div className="text-center space-y-2 mb-8">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-mono">
            ⚡ 60-SECOND INSTANT NEPAL CHECKOUT &amp; ACTIVATION
          </span>
          <h1 className="text-2xl sm:text-4xl font-black text-foreground">
            Complete Your SEE Course Enrollment
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-medium">
            Instant automatic course activation right after payment — zero waiting required!
          </p>
        </div>

        {isSuccess ? (
          /* AUTOMATIC COURSE ACTIVATION SUCCESS VIEW */
          <div className="p-8 sm:p-12 rounded-3xl bg-card border-2 border-emerald-500 text-center space-y-6 shadow-2xl animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center mx-auto border-2 border-emerald-500/40">
              <CheckCircle2 size={44} />
            </div>
            <div className="space-y-2">
              <span className="text-xs font-black uppercase text-emerald-600 font-mono">AUTOMATIC ACTIVATION COMPLETE</span>
              <h2 className="text-2xl sm:text-3xl font-black text-foreground">Payment Verified! 🎉</h2>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Your enrollment in <strong>{selectedPlan.name}</strong> is active. Redirecting you to your Student Dashboard...
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-mono font-bold text-emerald-600 max-w-sm mx-auto">
              Status: ACTIVE ENROLLED · Gateway: {paymentMethod.toUpperCase()}
            </div>

            <Link
              href="/student-dashboard"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-xl transition-all"
            >
              <span>ENTER STUDENT DASHBOARD NOW</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          /* 5-STEP CHECKOUT FORM */
          <div className="grid md:grid-cols-12 gap-8 items-start">
            
            {/* Left Col: Step Form */}
            <div className="md:col-span-7 space-y-6">
              
              {/* STEP 1: SELECT PLAN */}
              <div className="p-6 rounded-3xl bg-card border border-border space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <span className="text-xs font-black uppercase text-foreground font-mono">STEP 1: SELECT PLAN</span>
                  <span className="text-[10px] text-emerald-600 font-bold font-mono">Select One</span>
                </div>

                <div className="space-y-2.5">
                  {Object.values(PLANS).map((p) => {
                    const isSelected = selectedPlanId === p.id;
                    return (
                      <div
                        key={p.id}
                        onClick={() => setSelectedPlanId(p.id)}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-emerald-500/10 border-emerald-500 text-foreground ring-2 ring-emerald-500/30'
                            : 'bg-muted/40 border-border hover:border-emerald-500/40 text-muted-foreground'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-foreground">{p.name}</span>
                            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-600 text-white font-mono">
                              {p.badge}
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5">{p.desc}</p>
                        </div>
                        <span className="text-sm font-black text-emerald-600 font-mono shrink-0 ml-2">{p.priceFormatted}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* STEP 2: STUDENT DETAILS & PHONE */}
              <div className="p-6 rounded-3xl bg-card border border-border space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <span className="text-xs font-black uppercase text-foreground font-mono">STEP 2: STUDENT DETAILS</span>
                  <span className="text-[10px] text-emerald-600 font-bold font-mono">Mobile Number</span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase block mb-1 font-mono">Student Name</label>
                    <input
                      type="text"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl bg-muted/40 border border-border text-xs font-bold text-foreground focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase block mb-1 font-mono">Mobile Phone Number (For SMS Credentials)</label>
                    <input
                      type="text"
                      value={studentPhone}
                      onChange={(e) => setStudentPhone(e.target.value)}
                      placeholder="+977 98xxxxxxxx"
                      className="w-full px-4 py-3 rounded-2xl bg-muted/40 border border-border text-xs font-bold text-foreground focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* STEP 3: SELECT NEPAL PAYMENT METHOD */}
              <div className="p-6 rounded-3xl bg-card border border-border space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <span className="text-xs font-black uppercase text-foreground font-mono">STEP 3: PAYMENT METHOD</span>
                  <span className="text-[10px] text-emerald-600 font-bold font-mono">Nepal Payment Methods</span>
                </div>

                <div className="grid grid-cols-2 gap-3 font-mono">
                  
                  {/* eSewa */}
                  <button
                    onClick={() => setPaymentMethod('esewa')}
                    className={`p-4 rounded-2xl border text-center transition-all ${
                      paymentMethod === 'esewa'
                        ? 'bg-emerald-500/10 border-emerald-500 text-foreground ring-2 ring-emerald-500/30'
                        : 'bg-muted/40 border-border hover:border-emerald-500/40 text-muted-foreground'
                    }`}
                  >
                    <span className="text-lg block">💚 eSewa</span>
                    <span className="text-[10px] font-bold text-emerald-600 block mt-0.5">Direct eSewa Wallet</span>
                  </button>

                  {/* Khalti */}
                  <button
                    onClick={() => setPaymentMethod('khalti')}
                    className={`p-4 rounded-2xl border text-center transition-all ${
                      paymentMethod === 'khalti'
                        ? 'bg-purple-500/10 border-purple-500 text-foreground ring-2 ring-purple-500/30'
                        : 'bg-muted/40 border-border hover:border-purple-500/40 text-muted-foreground'
                    }`}
                  >
                    <span className="text-lg block">💜 Khalti</span>
                    <span className="text-[10px] font-bold text-purple-600 block mt-0.5">Khalti ePayment V2</span>
                  </button>

                  {/* IME Pay */}
                  <button
                    onClick={() => setPaymentMethod('imepay')}
                    className={`p-4 rounded-2xl border text-center transition-all ${
                      paymentMethod === 'imepay'
                        ? 'bg-red-500/10 border-red-500 text-foreground ring-2 ring-red-500/30'
                        : 'bg-muted/40 border-border hover:border-red-500/40 text-muted-foreground'
                    }`}
                  >
                    <span className="text-lg block">🔴 IME Pay</span>
                    <span className="text-[10px] font-bold text-red-600 block mt-0.5">IME Pay Wallet</span>
                  </button>

                  {/* Fonepay QR */}
                  <button
                    onClick={() => setPaymentMethod('fonepay')}
                    className={`p-4 rounded-2xl border text-center transition-all ${
                      paymentMethod === 'fonepay'
                        ? 'bg-blue-500/10 border-blue-500 text-foreground ring-2 ring-blue-500/30'
                        : 'bg-muted/40 border-border hover:border-blue-500/40 text-muted-foreground'
                    }`}
                  >
                    <span className="text-lg block">🏦 Fonepay QR</span>
                    <span className="text-[10px] font-bold text-blue-600 block mt-0.5">50+ Nepal Mobile Banks</span>
                  </button>

                </div>
              </div>

            </div>

            {/* Right Col: Summary & Pay Button */}
            <div className="md:col-span-5 p-6 rounded-3xl bg-card border border-emerald-500/30 space-y-6 shadow-xl sticky top-28">
              
              <div className="flex items-center justify-between border-b border-border pb-3">
                <span className="text-xs font-black uppercase text-foreground font-mono">ORDER SUMMARY</span>
                <span className="text-[10px] text-emerald-600 font-bold font-mono">60s Checkout</span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center font-bold">
                  <span className="text-foreground">{selectedPlan.name}</span>
                  <span className="text-foreground font-mono">NPR {selectedPlan.price.toLocaleString()}</span>
                </div>

                {couponDiscount > 0 && (
                  <div className="flex justify-between items-center text-emerald-600 font-bold">
                    <span>Coupon Discount</span>
                    <span className="font-mono">- NPR {couponDiscount.toLocaleString()}</span>
                  </div>
                )}

                <div className="pt-3 border-t border-border flex justify-between items-center text-base font-black text-foreground">
                  <span>Total Payable</span>
                  <span className="text-emerald-600 font-mono">NPR {finalPrice.toLocaleString()}</span>
                </div>
              </div>

              {/* Coupon Box */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Coupon Code (e.g. SEE2082)"
                    disabled={couponApplied}
                    className="flex-1 px-3 py-2 rounded-xl bg-muted/60 border border-border text-xs uppercase font-bold focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    onClick={handleApplyCoupon}
                    disabled={couponApplied || !couponCode.trim()}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-colors disabled:opacity-50"
                  >
                    Apply
                  </button>
                </div>
              </div>

              {/* Instant Pay Action Button */}
              <button
                onClick={handleInstantPay}
                disabled={isProcessing}
                className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl transition-all disabled:opacity-60"
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Verifying {paymentMethod.toUpperCase()} Payment...</span>
                  </>
                ) : (
                  <>
                    <Zap size={18} />
                    <span>PAY NPR {finalPrice.toLocaleString()} &amp; ACTIVATE INSTANTLY</span>
                  </>
                )}
              </button>

              <div className="text-[10px] text-center text-muted-foreground font-semibold flex items-center justify-center gap-1">
                <Lock size={12} className="text-emerald-500" />
                256-Bit Encrypted Instant Gateway Payment · Automatic Activation
              </div>

            </div>

          </div>
        )}

      </main>

      <HomepageFooter />
    </div>
  );
}
