'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  ShieldCheck,
  CheckCircle2,
  Clock,
  RotateCcw,
  CreditCard,
  Zap,
  Smartphone,
  MessageCircle,
  AlertCircle,
  FileText,
  Calendar,
  Lock,
  Loader2,
  Sparkles,
  ExternalLink,
  Eye,
} from 'lucide-react';
import OfficialReceiptModal from '@/components/billing/OfficialReceiptModal';
import type { BillingInvoiceRecord } from '@/lib/billing/invoiceEngine';
import toast from 'react-hot-toast';

export interface StudentProfileData {
  id: string;
  email?: string | null;
  full_name?: string | null;
  phone?: string | null;
  college?: string | null;
  cee_year?: number | null;
  plan?: string | null;
  plan_expires_at?: string | null;
  is_subscriber?: boolean | null;
  battle_rating?: number | null;
  total_points?: number | null;
  last_sign_in_at?: string | null;
  created_at?: string | null;
}

interface Student360DrawerProps {
  student: StudentProfileData | null;
  onClose: () => void;
  onMutated?: () => void;
}

export default function Student360Drawer({
  student,
  onClose,
  onMutated,
}: Student360DrawerProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'financial' | 'security'>('overview');
  const [actionLoading, setActionLoading] = useState(false);
  const [studentInvoices, setStudentInvoices] = useState<BillingInvoiceRecord[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<BillingInvoiceRecord | null>(null);

  // Live state overrides if admin grants extension or revokes
  const [currentPlan, setCurrentPlan] = useState<string>(student?.plan || 'free');
  const [currentExpiry, setCurrentExpiry] = useState<string | null>(student?.plan_expires_at || null);

  useEffect(() => {
    if (student) {
      const studentId = student.id;
      setCurrentPlan(student.plan || 'free');
      setCurrentExpiry(student.plan_expires_at || null);

      // Load student invoices
      async function loadStudentBilling() {
        setInvoicesLoading(true);
        try {
          const res = await fetch(`/api/billing/invoices?userId=${studentId}`);
          const data = await res.json();
          if (res.ok) {
            setStudentInvoices(data.invoices || []);
          }
        } catch {
          // ignore
        } finally {
          setInvoicesLoading(false);
        }
      }
      loadStudentBilling();
    }
  }, [student]);

  if (!student) return null;

  const isExpired = currentExpiry ? new Date(currentExpiry) < new Date() : false;
  const isPaidSubscriber = ['pro', 'student', 'institution'].includes(currentPlan) && !isExpired;

  const handleExecuteAction = async (action: string, payload?: Record<string, any>) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${student.id}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Action failed');

      toast.success(data.message || 'Action executed successfully!');
      if (data.newExpiry) setCurrentExpiry(data.newExpiry);
      if (data.plan) setCurrentPlan(data.plan);
      if (onMutated) onMutated();
    } catch (err: any) {
      toast.error(err.message || 'Operation failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleWhatsAppNudge = () => {
    const rawPhone = (student.phone || '').replace(/[^0-9]/g, '');
    const cleanPhone = rawPhone.startsWith('977') ? rawPhone : `977${rawPhone}`;
    const message = encodeURIComponent(
      `Namaste ${student.full_name}, this is Samyak Education Academic Support. We noticed your preparation portal status. How can our mentor team assist you today?`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
  };

  const [ghostLoading, setGhostLoading] = useState(false);

  const handleEnterGhostView = async () => {
    if (!student) return;
    setGhostLoading(true);
    try {
      const res = await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: student.id,
          studentName: student.full_name || 'Student',
          studentEmail: student.email || '',
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Entering Ghost View mode as ${student.full_name || student.email}...`);
        window.location.href = data.redirectUrl || '/student-dashboard';
      } else {
        toast.error(data.error || 'Failed to enter Ghost View');
      }
    } catch {
      toast.error('Network error starting Ghost View');
    } finally {
      setGhostLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-2xs flex justify-end animate-fade-in">
      <div className="bg-card border-l border-border w-full max-w-xl h-full flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Top Header */}
        <div className="bg-slate-950 text-white p-5 border-b border-slate-800 flex items-start justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg">
              {student.full_name ? student.full_name.charAt(0).toUpperCase() : 'S'}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-white tracking-tight">
                  {student.full_name || 'Student Account'}
                </h2>
                <span
                  className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border ${
                    isPaidSubscriber
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  {isPaidSubscriber ? `${currentPlan.toUpperCase()} ACTIVE` : 'FREE / EXPIRED'}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">{student.email}</p>
              {student.phone && (
                <p className="text-xs text-slate-400 font-mono">Phone: {student.phone}</p>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Close drawer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-border bg-muted/40 px-4 text-xs font-semibold shrink-0">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'overview'
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Overview &amp; Control Hub
          </button>
          <button
            onClick={() => setActiveTab('financial')}
            className={`py-3 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'financial'
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <span>Invoices &amp; Receipts</span>
            {studentInvoices.length > 0 && (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-primary/10 text-primary">
                {studentInvoices.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`py-3 px-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'security'
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Security &amp; Devices
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Sovereign Command Switches */}
              <div className="p-4 rounded-2xl bg-slate-950 text-slate-100 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={16} className="text-emerald-400" />
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                      Sovereign Administrator Switches
                    </span>
                  </div>
                  {actionLoading && <Loader2 size={14} className="animate-spin text-emerald-400" />}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    disabled={actionLoading}
                    onClick={() => handleExecuteAction('grant_extension', { days: 7, planTier: 'pro' })}
                    className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles size={13} className="text-amber-400" />
                    <span>+7 Days Pro Grant</span>
                  </button>

                  <button
                    disabled={actionLoading}
                    onClick={() => handleExecuteAction('grant_extension', { days: 30, planTier: 'pro' })}
                    className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Calendar size={13} className="text-emerald-400" />
                    <span>+30 Days Pro Grant</span>
                  </button>

                  <button
                    disabled={actionLoading}
                    onClick={() => handleExecuteAction('reset_devices')}
                    className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Smartphone size={13} className="text-indigo-400" />
                    <span>Reset Device Binding</span>
                  </button>

                  <button
                    disabled={actionLoading}
                    onClick={() => handleExecuteAction('revoke_access')}
                    className="p-2.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/40 border border-rose-800 text-rose-300 font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <RotateCcw size={13} />
                    <span>Revoke / Downgrade</span>
                  </button>
                </div>

                {student.phone && (
                  <button
                    onClick={handleWhatsAppNudge}
                    className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <MessageCircle size={14} />
                    <span>Open Direct WhatsApp Counseling Chat</span>
                  </button>
                )}
              </div>

              {/* Status & Validity Card */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-4 rounded-2xl bg-card border border-border">
                  <span className="text-[10px] font-mono uppercase text-muted-foreground">Current Plan</span>
                  <p className="text-base font-black uppercase text-foreground mt-0.5">{currentPlan}</p>
                  <p className="text-[10.5px] text-muted-foreground mt-1">
                    {currentExpiry
                      ? `Active until ${new Date(currentExpiry).toLocaleDateString('en-GB')}`
                      : 'Lifetime / No Expiry set'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-card border border-border">
                  <span className="text-[10px] font-mono uppercase text-muted-foreground">Academic College</span>
                  <p className="text-sm font-bold text-foreground mt-0.5 truncate">
                    {student.college || 'Unspecified'}
                  </p>
                  <p className="text-[10.5px] text-muted-foreground mt-1">
                    CEE Target: {student.cee_year ? `Year ${student.cee_year}` : 'Standard'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-card border border-border">
                  <span className="text-[10px] font-mono uppercase text-muted-foreground">Battle Rating (1v1)</span>
                  <p className="text-lg font-black font-mono text-primary mt-0.5">
                    {student.battle_rating || 1000}
                  </p>
                  <p className="text-[10.5px] text-muted-foreground mt-1">Arena Matchmaking Elo</p>
                </div>

                <div className="p-4 rounded-2xl bg-card border border-border">
                  <span className="text-[10px] font-mono uppercase text-muted-foreground">Total XP Earned</span>
                  <p className="text-lg font-black font-mono text-emerald-600 mt-0.5">
                    {student.total_points || 0}
                  </p>
                  <p className="text-[10.5px] text-muted-foreground mt-1">From drills &amp; mock tests</p>
                </div>
              </div>

              {/* Metadata */}
              <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Database UID:</span>
                  <span className="text-foreground">{student.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Account Created:</span>
                  <span className="text-foreground">
                    {student.created_at ? new Date(student.created_at).toLocaleDateString('en-GB') : 'Unknown'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Active Session:</span>
                  <span className="text-foreground">
                    {student.last_sign_in_at ? new Date(student.last_sign_in_at).toLocaleString() : 'Never'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'financial' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Official Invoices &amp; Payment History
                </h3>
                <span className="text-[11px] font-mono font-bold text-foreground">
                  {studentInvoices.length} Records
                </span>
              </div>

              {invoicesLoading ? (
                <div className="py-12 text-center space-y-2">
                  <Loader2 size={24} className="animate-spin text-primary mx-auto" />
                  <p className="text-xs font-mono text-muted-foreground">Loading student invoices...</p>
                </div>
              ) : studentInvoices.length === 0 ? (
                <div className="p-8 text-center bg-card border border-border rounded-2xl space-y-2">
                  <p className="text-xs font-bold text-foreground">No settled invoices recorded</p>
                  <p className="text-[11px] text-muted-foreground">
                    Invoices are automatically issued whenever the student pays via Fonepay, eSewa, or Khalti.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {studentInvoices.map((inv) => (
                    <div
                      key={inv.id}
                      className="p-4 rounded-2xl bg-card border border-border flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-foreground">{inv.invoiceNumber}</span>
                          <span
                            className={`px-2 py-0.2 rounded-full text-[10px] font-black uppercase ${
                              inv.status === 'paid'
                                ? 'bg-emerald-500/10 text-emerald-600'
                                : 'bg-amber-500/10 text-amber-600'
                            }`}
                          >
                            {inv.status}
                          </span>
                        </div>
                        <p className="font-semibold text-foreground">{inv.itemTitle}</p>
                        <p className="text-[10.5px] font-mono text-muted-foreground">
                          {inv.gateway.toUpperCase()} &bull; {inv.purchaseOrderId} &bull; FY {inv.fiscalYearBs}
                        </p>
                      </div>

                      <div className="text-right shrink-0 space-y-1.5">
                        <div className="font-black text-sm font-mono text-foreground">
                          NPR {inv.netAmountNpr.toLocaleString()}
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedReceipt(inv)}
                          className="px-2.5 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer"
                        >
                          <FileText size={11} />
                          <span>View Receipt</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-card border border-border space-y-2">
                <div className="flex items-center gap-2 font-bold text-foreground">
                  <Smartphone size={16} className="text-primary" />
                  <span>1-Student = 1-Device Binding Status</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Titan Content Defense locks each student account to their primary device. Account password sharing is prevented by terminating stale sessions upon new device sign-in.
                </p>
                <div className="pt-2">
                  <button
                    disabled={actionLoading}
                    onClick={() => handleExecuteAction('reset_devices')}
                    className="px-3.5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Lock size={12} />
                    <span>Reset Authorized Device Binding</span>
                  </button>
                </div>
              </div>

              {/* Ghost View Impersonation */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-700 dark:text-amber-400">
                  <Eye size={16} />
                  <span>Ghost View / Student Impersonation Mode</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Preview the exact student portal layout, enrolled courses, and exam screens as this student without asking for their credentials. All diagnostic interactions are recorded in the immutable audit log.
                </p>
                <div className="pt-1">
                  <button
                    type="button"
                    disabled={ghostLoading}
                    onClick={handleEnterGhostView}
                    className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
                  >
                    {ghostLoading ? <Loader2 size={13} className="animate-spin" /> : <Eye size={13} />}
                    <span>Enter Ghost View (Student View)</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal for viewing student official receipt */}
        <OfficialReceiptModal
          invoice={selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
        />
      </div>
    </div>
  );
}
