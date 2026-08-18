'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { PAYMENT_METHODS as PAY_FLAGS } from '@/lib/config/payments';
import {
  User, Lock, Shield, Download, KeyRound, CreditCard,
  Loader2, CheckCircle2, AlertCircle, Eye, EyeOff,
  Crown, Zap, Star, Calendar, Clock, FileText, BookOpen,
  ChevronRight, Edit3, Save, X, ExternalLink, MessageCircle,
  ArrowUpCircle, ArrowDownCircle, Receipt, Wallet, CheckCheck,
  TrendingUp, Package, RefreshCw, Info, Smartphone
} from 'lucide-react';


const WHATSAPP_NUMBER = '9779800000000';

interface ActivationCodeRecord {
  id: string;
  code: string;
  plan: string;
  duration_days: number;
  used_at: string;
  expires_at: string | null;
}

interface BillingRecord {
  id: string;
  plan: string;
  amount_npr: number;
  billing_period: string;
  payment_method: string;
  transaction_ref: string | null;
  status: string;
  notes: string | null;
  created_at: string;
}

interface StudyMaterial {
  id: string;
  title: string;
  description: string;
  category: string;
  size: string;
  icon: React.ElementType;
  color: string;
  locked: boolean;
}

const STUDY_MATERIALS: StudyMaterial[] = [
  { id: 'sm-1', title: 'CEE 2025 Full Syllabus PDF', description: 'Complete syllabus breakdown for all subjects', category: 'Syllabus', size: '2.4 MB', icon: BookOpen, color: 'text-primary bg-primary/10', locked: false },
  { id: 'sm-2', title: 'Biology Formula Sheet', description: 'Key formulas, diagrams & mnemonics', category: 'Biology', size: '1.8 MB', icon: FileText, color: 'text-bio bg-bio-light', locked: false },
  { id: 'sm-3', title: 'Chemistry Reaction Handbook', description: 'All important reactions with mechanisms', category: 'Chemistry', size: '3.1 MB', icon: FileText, color: 'text-chem bg-chem-light', locked: true },
  { id: 'sm-4', title: 'Physics Problem Sets (Vol. 1)', description: '500+ solved problems with step-by-step solutions', category: 'Physics', size: '5.2 MB', icon: FileText, color: 'text-phy bg-phy-light', locked: true },
  { id: 'sm-5', title: 'Previous Year Papers (2018–2024)', description: '7 years of CEE papers with answer keys', category: 'Past Papers', size: '12.6 MB', icon: FileText, color: 'text-ma bg-ma-light', locked: true },
  { id: 'sm-6', title: 'Quick Revision Notes', description: 'Last-minute revision notes for all chapters', category: 'Notes', size: '4.0 MB', icon: BookOpen, color: 'text-warning bg-warning-light', locked: false },
];

const PLAN_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType; bg: string }> = {
  free: { label: 'Free Plan', color: 'text-muted-foreground', icon: Zap, bg: 'bg-muted' },
  student: { label: 'Student Plan', color: 'text-primary', icon: Star, bg: 'bg-primary/10' },
  pro: { label: 'Pro Plan', color: 'text-ma', icon: Crown, bg: 'bg-ma-light' },
  institution: { label: 'Institution Plan', color: 'text-chem', icon: Crown, bg: 'bg-chem-light' },
};

const UPGRADE_PLANS = [
  {
    key: 'free',
    name: 'Free',
    icon: Zap,
    price: { monthly: 0, yearly: 0 },
    color: 'text-muted-foreground',
    bg: 'bg-muted',
    border: 'border-border',
    features: ['200 practice MCQs/month', 'Samyak Guru App video access', 'Public leaderboard'],
  },
  {
    key: 'student',
    name: 'Student',
    icon: Star,
    price: { monthly: 799, yearly: 7190 },
    color: 'text-primary',
    bg: 'bg-primary/10',
    border: 'border-primary/40',
    badge: 'Popular',
    features: ['Unlimited MCQs', 'Samyak Guru App videos', 'Battle Arena', 'Mock Tests', 'Standard analytics'],
  },
  {
    key: 'pro',
    name: 'Pro',
    icon: Crown,
    price: { monthly: 1299, yearly: 11690 },
    color: 'text-ma',
    bg: 'bg-ma-light',
    border: 'border-ma/30',
    badge: 'Best Value',
    features: ['Everything in Student', 'AI Tutor (unlimited)', 'Samyak Guru App live classes', 'Advanced analytics', 'Priority support'],
  },
];

// Fonepay Dynamic QR is the only payment method site-wide.
const PAYMENT_METHODS = [
  { key: 'fonepay', label: 'Fonepay Dynamic QR', color: 'text-primary', bg: 'bg-primary/10', icon: '📱' },
];

type TabKey = 'subscription' | 'billing' | 'codes' | 'profile' | 'password' | 'privacy' | 'downloads';

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: 'subscription', label: 'Subscription', icon: CreditCard },
  { key: 'billing', label: 'Billing History', icon: Receipt },
  { key: 'codes', label: 'Activation Codes', icon: KeyRound },
  { key: 'profile', label: 'Edit Profile', icon: User },
  { key: 'password', label: 'Password', icon: Lock },
  { key: 'privacy', label: 'Privacy', icon: Shield },
  { key: 'downloads', label: 'Study Materials', icon: Download },
];

function buildWhatsAppUrl(action: string, planName: string, price: number, period: string): string {
  const priceStr = price > 0 ? `NPR ${price.toLocaleString()}/${period}` : 'Free';
  const message = `Hi! I want to ${action} to the *${planName} Plan* (${priceStr}) on Samyak CEE Mastery. Please assist me. Thank you!`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export default function AccountManagementClient() {
  const [isDark, setIsDark] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('subscription');

  // Crash-course prebooking (if the user has a confirmed one).
  const [prebook, setPrebook] = useState<{ reference: string; daysLeft: number; deadline: string; windowDays: number } | null>(null);
  useEffect(() => {
    let active = true;
    fetch('/api/prebook/mine')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (active && d?.prebooked) setPrebook(d); })
      .catch(() => {});
    return () => { active = false; };
  }, []);
  const { user, profile, loading, signOut, refreshProfile } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  // Profile edit state
  const [editLoading, setEditLoading] = useState(false);
  const [editSuccess, setEditSuccess] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [college, setCollege] = useState('');
  const [ceeYear, setCeeYear] = useState('');

  // Password state
  const [pwLoading, setPwLoading] = useState(false);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Activation codes state
  const [codes, setCodes] = useState<ActivationCodeRecord[]>([]);
  const [codesLoading, setCodesLoading] = useState(false);

  // Billing history state
  const [billingHistory, setBillingHistory] = useState<BillingRecord[]>([]);
  const [billingLoading, setBillingLoading] = useState(false);

  // Subscription plan toggle
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

  // Privacy state
  const [analyticsConsent, setAnalyticsConsent] = useState(true);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [profileVisible, setProfileVisible] = useState(true);
  const [privacySaved, setPrivacySaved] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router?.replace('/sign-up-login-screen');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (isDark) {
      document.documentElement?.classList?.add('dark');
    } else {
      document.documentElement?.classList?.remove('dark');
    }
  }, [isDark]);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
      setCollege(profile.college || '');
      setCeeYear(profile.cee_year ? String(profile.cee_year) : '');
    }
  }, [profile]);

  useEffect(() => {
    if (activeTab === 'codes' && user) {
      fetchCodes();
    }
    if (activeTab === 'billing' && user) {
      fetchBillingHistory();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, user]);

  const fetchCodes = async () => {
    if (!user) return;
    setCodesLoading(true);
    try {
      const { data } = await supabase
        .from('activation_codes')
        .select('id, code, plan, duration_days, used_at, expires_at')
        .eq('used_by', user.id)
        .order('used_at', { ascending: false });
      setCodes((data as ActivationCodeRecord[]) || []);
    } catch {
      // silent
    } finally {
      setCodesLoading(false);
    }
  };

  const fetchBillingHistory = async () => {
    if (!user) return;
    setBillingLoading(true);
    try {
      const { data } = await supabase
        .from('billing_history')
        .select('id, plan, amount_npr, billing_period, payment_method, transaction_ref, status, notes, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setBillingHistory((data as BillingRecord[]) || []);
    } catch {
      // silent
    } finally {
      setBillingLoading(false);
    }
  };

  const handleProfileSave = async () => {
    if (!user) return;
    setEditLoading(true);
    setEditError(null);
    setEditSuccess(false);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          full_name: fullName.trim(),
          phone: phone.trim() || null,
          college: college.trim() || null,
          cee_year: ceeYear ? parseInt(ceeYear) : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);
      if (error) throw error;
      await refreshProfile();
      setEditSuccess(true);
      setTimeout(() => setEditSuccess(false), 3000);
    } catch (err: unknown) {
      setEditError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setEditLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    setPwError(null);
    setPwSuccess(false);
    if (!currentPw) {
      setPwError('Enter your current password');
      return;
    }
    if (!newPw || newPw.length < 8) {
      setPwError('New password must be at least 8 characters');
      return;
    }
    if (newPw !== confirmPw) {
      setPwError('Passwords do not match');
      return;
    }
    setPwLoading(true);
    try {
      if (!user?.email) throw new Error('Could not verify your account. Please sign in again.');

      // Confirm the current password before rotating it — updateUser() alone
      // only requires an active session, so without this check anyone who
      // rides an existing session (e.g. a stolen/idle browser tab) could
      // change the password without knowing it.
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPw,
      });
      if (verifyError) {
        setPwError('Current password is incorrect');
        setPwLoading(false);
        return;
      }

      const { error } = await supabase.auth.updateUser({ password: newPw });
      if (error) throw error;
      setPwSuccess(true);
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
      setTimeout(() => setPwSuccess(false), 3000);
    } catch (err: unknown) {
      setPwError(err instanceof Error ? err.message : 'Failed to update password');
    } finally {
      setPwLoading(false);
    }
  };

  const handlePrivacySave = () => {
    setPrivacySaved(true);
    setTimeout(() => setPrivacySaved(false), 2500);
  };

  const handleSignOut = async () => {
    await signOut();
    router?.replace('/sign-up-login-screen');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading account...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const plan = profile?.subscription_plan || 'free';
  const planCfg = PLAN_CONFIG[plan] || PLAN_CONFIG.free;
  const PlanIcon = planCfg.icon;
  const isPaid = plan !== 'free';
  const expiresAt = profile?.subscription_expires_at
    ? new Date(profile.subscription_expires_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  const isExpired = profile?.subscription_expires_at
    ? new Date(profile.subscription_expires_at) < new Date()
    : false;

  const daysRemaining = profile?.subscription_expires_at
    ? Math.max(0, Math.ceil((new Date(profile.subscription_expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  return (
    <DashboardLayout isDark={isDark} onToggleDark={() => setIsDark(!isDark)}>
      <div className="p-4 sm:p-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-foreground">Account Management</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage your profile, subscription, and preferences</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar tabs */}
          <aside className="lg:w-52 shrink-0">
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              {/* User card */}
              <div className="p-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-base shrink-0">
                    {(profile?.full_name || user?.email || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{profile?.full_name || 'Student'}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  </div>
                </div>
                <div className={`mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${planCfg.bg} ${planCfg.color}`}>
                  <PlanIcon size={12} />
                  {planCfg.label}
                </div>
              </div>
              {/* Nav */}
              <nav className="p-2">
                {TABS.map((tab) => {
                  const TabIcon = tab.icon;
                  const active = activeTab === tab.key;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm mb-0.5 transition-all ${
                        active
                          ? 'bg-secondary text-primary font-semibold' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      }`}
                    >
                      <TabIcon size={16} className="shrink-0" />
                      <span className="flex-1 text-left truncate">{tab.label}</span>
                      {active && <ChevronRight size={14} className="shrink-0" />}
                    </button>
                  );
                })}
              </nav>
              {/* Sign out */}
              <div className="p-2 border-t border-border">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-error hover:bg-error-light transition-colors"
                >
                  <X size={16} className="shrink-0" />
                  Sign Out
                </button>
              </div>
            </div>
          </aside>

          {/* Main panel */}
          <div className="flex-1 min-w-0">

            {/* ── SUBSCRIPTION ── */}
            {activeTab === 'subscription' && (
              <div className="space-y-4">
                {/* Prebooking status — pay the remaining balance within the window */}
                {prebook && (
                  <div className="rounded-xl border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-card to-ma/5 p-5">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex items-start gap-3">
                        <span className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                          <Star size={20} className="text-primary" />
                        </span>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-bold text-foreground">You&apos;re prebooked for the 45-Day Crash Course 🚀</p>
                            <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-primary text-white">PREBOOKED</span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                            Your Rs 300 deposit is confirmed and Pro is unlocked. Pay the remaining course fee within{' '}
                            <span className="font-bold text-foreground">
                              {prebook.daysLeft > 0 ? `${prebook.daysLeft} day${prebook.daysLeft === 1 ? '' : 's'}` : 'the deadline'}
                            </span>{' '}
                            to lock your seat.
                          </p>
                          <p className="text-xs text-muted-foreground mt-1.5">
                            Reference <span className="font-mono font-semibold text-primary">{prebook.reference}</span>
                            {' · '}Due by {new Date(prebook.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                      <a
                        href="/checkout?plan=crash-course"
                        className="shrink-0 flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-bold hover:bg-primary-dark transition-colors"
                      >
                        <Smartphone size={15} /> Pay Remaining
                      </a>
                    </div>
                    {prebook.daysLeft <= 3 && prebook.daysLeft > 0 && (
                      <p className="mt-3 text-xs font-semibold text-warning flex items-center gap-1.5">
                        <Info size={12} /> Only {prebook.daysLeft} day{prebook.daysLeft === 1 ? '' : 's'} left — pay soon to keep your reserved price.
                      </p>
                    )}
                  </div>
                )}

                {/* Active Subscription Details */}
                <div className="bg-card border border-border rounded-xl p-5">
                  <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Package size={18} className="text-primary" /> Active Subscription
                  </h2>
                  <div className={`flex items-start gap-4 p-4 rounded-xl border ${isPaid ? 'border-primary/30 bg-primary/5' : 'border-border bg-muted/40'}`}>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${planCfg.bg}`}>
                      <PlanIcon size={22} className={planCfg.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={`text-lg font-bold ${planCfg.color}`}>{planCfg.label}</p>
                        {isPaid && !isExpired && (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-success-light text-success">Active</span>
                        )}
                        {isExpired && (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-error-light text-error">Expired</span>
                        )}
                      </div>
                      {expiresAt ? (
                        <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
                          <Calendar size={13} />
                          {isExpired ? 'Expired on' : 'Renews on'} {expiresAt}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground mt-1">No expiry date set</p>
                      )}
                      {daysRemaining !== null && daysRemaining > 0 && daysRemaining <= 14 && (
                        <p className="text-xs text-warning mt-1 flex items-center gap-1">
                          <Info size={11} /> {daysRemaining} days remaining — renew soon
                        </p>
                      )}
                      {!isPaid && (
                        <p className="text-xs text-muted-foreground mt-1">Upgrade to unlock all features and study materials</p>
                      )}
                    </div>
                  </div>

                  {/* Plan features grid */}
                  <div className="mt-4">
                    <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Your Plan Includes</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {[
                        { label: 'Practice MCQs', available: true },
                        { label: 'AI Tutor', available: isPaid },
                        { label: 'Mock Tests', available: isPaid },
                        { label: 'Battle Arena', available: isPaid },
                        { label: 'MCQ Generator', available: isPaid },
                        { label: 'Study Materials Download', available: isPaid },
                        { label: 'Mistake Analyser', available: plan === 'pro' || plan === 'institution' },
                        { label: 'Priority Support', available: plan === 'pro' || plan === 'institution' },
                      ].map((f) => (
                        <div key={f.label} className="flex items-center gap-2.5 text-sm">
                          {f.available ? (
                            <CheckCircle2 size={15} className="text-success shrink-0" />
                          ) : (
                            <div className="w-[15px] h-[15px] rounded-full border-2 border-border shrink-0" />
                          )}
                          <span className={f.available ? 'text-foreground' : 'text-muted-foreground'}>{f.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Upgrade / Downgrade Plans */}
                <div className="bg-card border border-border rounded-xl p-5">
                  <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                    <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                      <TrendingUp size={18} className="text-primary" /> Change Plan
                    </h2>
                    {/* Billing period toggle */}
                    <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
                      <button
                        onClick={() => setBillingPeriod('monthly')}
                        className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${billingPeriod === 'monthly' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}
                      >
                        Monthly
                      </button>
                      <button
                        onClick={() => setBillingPeriod('yearly')}
                        className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${billingPeriod === 'yearly' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}
                      >
                        Yearly
                        <span className="ml-1 text-success text-[10px] font-bold">-25%</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {UPGRADE_PLANS.map((p) => {
                      const PIcon = p.icon;
                      const isCurrent = plan === p.key;
                      const price = billingPeriod === 'yearly'
                        ? Math.round(p.price.yearly / 12)
                        : p.price.monthly;
                      const isUpgrade = UPGRADE_PLANS.findIndex(x => x.key === plan) < UPGRADE_PLANS.findIndex(x => x.key === p.key);

                      return (
                        <div
                          key={p.key}
                          className={`relative flex flex-col p-4 rounded-xl border-2 transition-all ${
                            isCurrent
                              ? `${p.border} bg-primary/5`
                              : 'border-border bg-background hover:border-primary/30'
                          }`}
                        >
                          {p.badge && !isCurrent && (
                            <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary text-white whitespace-nowrap">
                              {p.badge}
                            </span>
                          )}
                          {isCurrent && (
                            <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-success text-white whitespace-nowrap">
                              Current
                            </span>
                          )}
                          <div className="flex items-center gap-2 mb-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${p.bg}`}>
                              <PIcon size={16} className={p.color} />
                            </div>
                            <p className={`font-bold text-sm ${p.color}`}>{p.name}</p>
                          </div>
                          <div className="mb-3">
                            {price === 0 ? (
                              <p className="text-xl font-bold text-foreground">Free</p>
                            ) : (
                              <div>
                                <span className="text-xl font-bold text-foreground">NPR {price.toLocaleString()}</span>
                                <span className="text-xs text-muted-foreground">/mo</span>
                              </div>
                            )}
                          </div>
                          <ul className="space-y-1.5 mb-4 flex-1">
                            {p.features.map((f) => (
                              <li key={f} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                                <CheckCheck size={12} className="text-success shrink-0 mt-0.5" />
                                {f}
                              </li>
                            ))}
                          </ul>
                          {isCurrent ? (
                            <div className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-success-light text-success text-xs font-semibold">
                              <CheckCircle2 size={13} /> Current Plan
                            </div>
                          ) : p.key === 'free' ? (
                            <a
                              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hi! I want to downgrade to the Free Plan on Samyak CEE Mastery. Please assist me.')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-center gap-1.5 py-2 rounded-lg border border-border text-muted-foreground text-xs font-semibold hover:bg-muted transition-colors"
                            >
                              <ArrowDownCircle size={13} /> Downgrade
                            </a>
                          ) : (
                            <a
                              href={`/checkout?plan=${p.key}-${billingPeriod}`}
                              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
                                isUpgrade
                                  ? 'bg-primary text-primary-foreground hover:bg-primary-dark'
                                  : 'border border-border text-muted-foreground hover:bg-muted'
                              }`}
                            >
                              <Smartphone size={13} />
                              Pay with Fonepay
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-4 p-3 rounded-xl bg-muted/40 border border-border flex items-start gap-2.5">
                    <Info size={14} className="text-muted-foreground shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Pick a plan and pay securely with Fonepay — scan the dynamic QR with any mobile-banking or wallet app and your access unlocks instantly.
                    </p>
                  </div>
                </div>

                {/* Payment Methods */}
                <div className="bg-card border border-border rounded-xl p-5">
                  <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Wallet size={18} className="text-primary" /> Accepted Payment Methods
                  </h2>
                  <div className="grid grid-cols-1 gap-3">
                    {PAYMENT_METHODS.map((pm) => (
                      <div
                        key={pm.key}
                        className={`flex items-center gap-3 p-3.5 rounded-xl border border-border ${pm.bg} transition-all`}
                      >
                        <span className="text-2xl">{pm.icon}</span>
                        <div>
                          <p className={`text-sm font-semibold ${pm.color}`}>{pm.label}</p>
                          <p className="text-xs text-muted-foreground">Scan &amp; pay from any mobile-banking or wallet app — access unlocks instantly.</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-4 p-3 rounded-xl bg-muted/40 border border-border">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Need help with payment?</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Our team is available on WhatsApp for payment assistance</p>
                    </div>
                    <a
                      href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hi! I need help with payment for Samyak CEE Mastery.')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 flex items-center gap-1.5 px-3 py-2 bg-success text-white rounded-lg text-xs font-semibold hover:bg-success/90 transition-colors"
                    >
                      <MessageCircle size={13} /> WhatsApp
                    </a>
                  </div>
                </div>

                {/* Upgrade / activate CTA */}
                {PAY_FLAGS.whatsappCode ? (
                  <div className="bg-card border border-border rounded-xl p-5 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Have an activation code?</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Enter your WhatsApp-received code to activate your plan</p>
                    </div>
                    <a
                      href="/activate-plan"
                      className="shrink-0 flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary-dark transition-colors"
                    >
                      <KeyRound size={15} /> Activate
                    </a>
                  </div>
                ) : (
                  <div className="bg-card border border-border rounded-xl p-5 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{isPaid ? 'Renew or change your plan' : 'Upgrade your plan'}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Pay securely with Fonepay — access unlocks instantly</p>
                    </div>
                    <a
                      href="/checkout?plan=pro-monthly"
                      className="shrink-0 flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary-dark transition-colors"
                    >
                      <Smartphone size={15} /> {isPaid ? 'Renew with Fonepay' : 'Pay with Fonepay'}
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* ── BILLING HISTORY ── */}
            {activeTab === 'billing' && (
              <div className="space-y-4">
                <div className="bg-card border border-border rounded-xl p-5">
                  <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
                    <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                      <Receipt size={18} className="text-primary" /> Billing History
                    </h2>
                    <button
                      onClick={fetchBillingHistory}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:bg-muted transition-colors"
                    >
                      <RefreshCw size={13} /> Refresh
                    </button>
                  </div>

                  {billingLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 size={24} className="animate-spin text-primary" />
                    </div>
                  ) : billingHistory.length === 0 ? (
                    <div className="text-center py-12">
                      <Receipt size={36} className="text-muted-foreground mx-auto mb-3 opacity-40" />
                      <p className="text-sm font-medium text-foreground">No billing records yet</p>
                      <p className="text-xs text-muted-foreground mt-1">Your payment history will appear here after your first purchase</p>
                      <a
                        href="/#pricing"
                        className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary-dark transition-colors"
                      >
                        <ArrowUpCircle size={14} /> View Plans
                      </a>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {billingHistory.map((record) => {
                        const cfg = PLAN_CONFIG[record.plan] || PLAN_CONFIG.free;
                        const RecordIcon = cfg.icon;
                        const statusColors: Record<string, string> = {
                          completed: 'bg-success-light text-success',
                          pending: 'bg-warning-light text-warning',
                          failed: 'bg-error-light text-error',
                          refunded: 'bg-muted text-muted-foreground',
                        };
                        const pmLabel = PAYMENT_METHODS.find(p => p.key === record.payment_method)?.label || record.payment_method;
                        return (
                          <div key={record.id} className="flex items-center gap-4 p-4 rounded-xl border border-border bg-background">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg}`}>
                              <RecordIcon size={18} className={cfg.color} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-sm font-semibold text-foreground">{cfg.label}</p>
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${statusColors[record.status] || 'bg-muted text-muted-foreground'}`}>
                                  {record.status}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2 flex-wrap">
                                <span className="flex items-center gap-1"><Clock size={11} />{new Date(record.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                                <span>·</span>
                                <span>{pmLabel}</span>
                                {record.billing_period && <span>· {record.billing_period}</span>}
                              </p>
                              {record.transaction_ref && (
                                <p className="text-xs text-muted-foreground mt-0.5 font-mono">Ref: {record.transaction_ref}</p>
                              )}
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-sm font-bold text-foreground">
                                {record.amount_npr === 0 ? 'Free' : `NPR ${record.amount_npr.toLocaleString()}`}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Billing support */}
                <div className="bg-card border border-border rounded-xl p-5 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Billing issue or refund request?</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Contact us on WhatsApp — 7-day refund policy applies</p>
                  </div>
                  <a
                    href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hi! I have a billing issue or refund request for Samyak CEE Mastery.')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 flex items-center gap-1.5 px-4 py-2 bg-success text-white rounded-lg text-sm font-semibold hover:bg-success/90 transition-colors"
                  >
                    <MessageCircle size={15} /> Contact Support
                  </a>
                </div>
              </div>
            )}

            {/* ── ACTIVATION CODES ── */}
            {activeTab === 'codes' && (
              <div className="bg-card border border-border rounded-xl p-5">
                <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                  <KeyRound size={18} className="text-primary" /> Activation Code History
                </h2>
                {codesLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 size={24} className="animate-spin text-primary" />
                  </div>
                ) : codes.length === 0 ? (
                  <div className="text-center py-12">
                    <KeyRound size={36} className="text-muted-foreground mx-auto mb-3 opacity-40" />
                    <p className="text-sm font-medium text-foreground">No activation codes used yet</p>
                    <p className="text-xs text-muted-foreground mt-1">Codes you activate will appear here</p>
                    <a href="/activate-plan" className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary-dark transition-colors">
                      <KeyRound size={14} /> Activate a Code
                    </a>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {codes.map((c) => {
                      const cfg = PLAN_CONFIG[c.plan] || PLAN_CONFIG.free;
                      const CodeIcon = cfg.icon;
                      return (
                        <div key={c.id} className="flex items-center gap-4 p-4 rounded-xl border border-border bg-muted/30">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${cfg.bg}`}>
                            <CodeIcon size={16} className={cfg.color} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-mono font-semibold text-foreground">{c.code}</p>
                            <p className={`text-xs font-medium mt-0.5 ${cfg.color}`}>{cfg.label} · {c.duration_days} days</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                              <Clock size={11} />
                              {c.used_at ? new Date(c.used_at).toLocaleDateString() : '—'}
                            </p>
                            {c.expires_at && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Exp: {new Date(c.expires_at).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── PROFILE EDIT ── */}
            {activeTab === 'profile' && (
              <div className="bg-card border border-border rounded-xl p-5">
                <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Edit3 size={18} className="text-primary" /> Edit Profile
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Full Name</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Your full name"
                      className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Email Address</label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full px-3 py-2.5 bg-muted border border-border rounded-lg text-sm text-muted-foreground cursor-not-allowed"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Email cannot be changed here</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Phone Number</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+977 98XXXXXXXX"
                      className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">College / School</label>
                    <input
                      type="text"
                      value={college}
                      onChange={(e) => setCollege(e.target.value)}
                      placeholder="e.g. Kathmandu Model College"
                      className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Target Exam Year</label>

                    <select
                      value={ceeYear}
                      onChange={(e) => setCeeYear(e.target.value)}
                      className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                    >
                      <option value="">Select year</option>
                      <option value="2026">2026</option>
                      <option value="2027">2027</option>
                      <option value="2028">2028</option>
                    </select>
                  </div>

                  {editError && (
                    <div className="flex items-center gap-2 p-3 bg-error-light rounded-lg text-error text-sm">
                      <AlertCircle size={15} className="shrink-0" />
                      {editError}
                    </div>
                  )}
                  {editSuccess && (
                    <div className="flex items-center gap-2 p-3 bg-success-light rounded-lg text-success text-sm">
                      <CheckCircle2 size={15} className="shrink-0" />
                      Profile updated successfully!
                    </div>
                  )}

                  <button
                    onClick={handleProfileSave}
                    disabled={editLoading}
                    className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary-dark transition-colors disabled:opacity-60"
                  >
                    {editLoading ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                    {editLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            )}

            {/* ── PASSWORD ── */}
            {activeTab === 'password' && (
              <div className="bg-card border border-border rounded-xl p-5">
                <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Lock size={18} className="text-primary" /> Change Password
                </h2>
                <div className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Current Password</label>
                    <div className="relative">
                      <input
                        type={showCurrent ? 'text' : 'password'}
                        value={currentPw}
                        onChange={(e) => setCurrentPw(e.target.value)}
                        placeholder="Enter current password"
                        className="w-full px-3 py-2.5 pr-10 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrent(!showCurrent)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">New Password</label>
                    <div className="relative">
                      <input
                        type={showNew ? 'text' : 'password'}
                        value={newPw}
                        onChange={(e) => setNewPw(e.target.value)}
                        placeholder="At least 8 characters"
                        className="w-full px-3 py-2.5 pr-10 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNew(!showNew)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    {newPw && (
                      <div className="mt-1.5 flex gap-1">
                        {[1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className={`h-1 flex-1 rounded-full transition-colors ${
                              newPw.length >= i * 3
                                ? newPw.length >= 12 ? 'bg-success' : newPw.length >= 8 ? 'bg-warning' : 'bg-error' : 'bg-border'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Confirm New Password</label>
                    <div className="relative">
                      <input
                        type={showConfirm ? 'text' : 'password'}
                        value={confirmPw}
                        onChange={(e) => setConfirmPw(e.target.value)}
                        placeholder="Re-enter new password"
                        className="w-full px-3 py-2.5 pr-10 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    {confirmPw && newPw && (
                      <p className={`text-xs mt-1 ${confirmPw === newPw ? 'text-success' : 'text-error'}`}>
                        {confirmPw === newPw ? '✓ Passwords match' : '✗ Passwords do not match'}
                      </p>
                    )}
                  </div>

                  {pwError && (
                    <div className="flex items-center gap-2 p-3 bg-error-light rounded-lg text-error text-sm">
                      <AlertCircle size={15} className="shrink-0" />
                      {pwError}
                    </div>
                  )}
                  {pwSuccess && (
                    <div className="flex items-center gap-2 p-3 bg-success-light rounded-lg text-success text-sm">
                      <CheckCircle2 size={15} className="shrink-0" />
                      Password updated successfully!
                    </div>
                  )}

                  <button
                    onClick={handlePasswordChange}
                    disabled={pwLoading}
                    className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary-dark transition-colors disabled:opacity-60"
                  >
                    {pwLoading ? <Loader2 size={15} className="animate-spin" /> : <Lock size={15} />}
                    {pwLoading ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </div>
            )}

            {/* ── PRIVACY ── */}
            {activeTab === 'privacy' && (
              <div className="bg-card border border-border rounded-xl p-5">
                <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Shield size={18} className="text-primary" /> Privacy Settings
                </h2>
                <div className="space-y-5">
                  {[
                    {
                      key: 'analytics',
                      label: 'Usage Analytics',
                      description: 'Allow us to collect anonymous usage data to improve the platform',
                      value: analyticsConsent,
                      onChange: setAnalyticsConsent,
                    },
                    {
                      key: 'marketing',
                      label: 'Marketing Communications',
                      description: 'Receive updates about new features, study tips, and promotions via email',
                      value: marketingConsent,
                      onChange: setMarketingConsent,
                    },
                    {
                      key: 'profile',
                      label: 'Public Profile Visibility',
                      description: 'Show your name and rank on the leaderboard and battle arena',
                      value: profileVisible,
                      onChange: setProfileVisible,
                    },
                  ].map((setting) => (
                    <div key={setting.key} className="flex items-start justify-between gap-4 pb-5 border-b border-border last:border-0 last:pb-0">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{setting.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{setting.description}</p>
                      </div>
                      <button
                        onClick={() => setting.onChange(!setting.value)}
                        className={`relative shrink-0 w-11 h-6 rounded-full transition-colors duration-200 ${
                          setting.value ? 'bg-primary' : 'bg-border'
                        }`}
                        aria-label={`Toggle ${setting.label}`}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                            setting.value ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  ))}

                  {privacySaved && (
                    <div className="flex items-center gap-2 p-3 bg-success-light rounded-lg text-success text-sm">
                      <CheckCircle2 size={15} className="shrink-0" />
                      Privacy settings saved!
                    </div>
                  )}

                  <button
                    onClick={handlePrivacySave}
                    className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary-dark transition-colors"
                  >
                    <Save size={15} /> Save Preferences
                  </button>

                  <div className="mt-2 p-4 bg-muted/40 rounded-xl border border-border">
                    <p className="text-xs font-semibold text-foreground mb-1">Data & Account</p>
                    <p className="text-xs text-muted-foreground mb-3">
                      You can request a copy of your data or permanently delete your account. Contact support via WhatsApp for these requests.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button className="px-3 py-1.5 text-xs font-medium border border-border rounded-lg text-foreground hover:bg-muted transition-colors">
                        Request Data Export
                      </button>
                      <button className="px-3 py-1.5 text-xs font-medium border border-error/40 rounded-lg text-error hover:bg-error-light transition-colors">
                        Delete Account
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── DOWNLOADS ── */}
            {activeTab === 'downloads' && (
              <div className="bg-card border border-border rounded-xl p-5">
                <h2 className="text-base font-semibold text-foreground mb-1 flex items-center gap-2">
                  <Download size={18} className="text-primary" /> Study Materials
                </h2>
                <p className="text-xs text-muted-foreground mb-4">
                  {isPaid ? 'Download your study materials below.' : 'Upgrade your plan to unlock premium study materials.'}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {STUDY_MATERIALS.map((mat) => {
                    const MatIcon = mat.icon;
                    const canDownload = !mat.locked || isPaid;
                    return (
                      <div
                        key={mat.id}
                        className={`relative flex items-start gap-3 p-4 rounded-xl border transition-all ${
                          canDownload
                            ? 'border-border bg-background hover:border-primary/40 hover:shadow-sm cursor-pointer'
                            : 'border-border bg-muted/30 opacity-70'
                        }`}
                      >
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${mat.color}`}>
                          <MatIcon size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground leading-snug">{mat.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{mat.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{mat.category}</span>
                            <span className="text-xs text-muted-foreground">{mat.size}</span>
                          </div>
                        </div>
                        <div className="shrink-0">
                          {canDownload ? (
                            <button className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-colors">
                              <Download size={14} />
                            </button>
                          ) : (
                            <div className="p-1.5 rounded-lg bg-muted text-muted-foreground">
                              <Lock size={14} />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {!isPaid && (
                  <div className="mt-4 p-4 rounded-xl bg-primary/5 border border-primary/20 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Unlock all materials</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Upgrade to Student or Pro plan to download all resources</p>
                    </div>
                    <a
                      href="/#pricing"
                      className="shrink-0 flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary-dark transition-colors"
                    >
                      Upgrade <ExternalLink size={12} />
                    </a>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
