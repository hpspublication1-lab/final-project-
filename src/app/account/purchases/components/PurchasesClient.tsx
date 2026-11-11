'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import OfficialReceiptModal from '@/components/billing/OfficialReceiptModal';
import type { BillingInvoiceRecord } from '@/lib/billing/invoiceEngine';
import {
  ShoppingBag,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  Loader2,
  GraduationCap,
  Stethoscope,
  Languages,
  TrendingUp,
  Cpu,
  Receipt,
  FileCheck2,
  Search,
  Lock,
  RotateCcw,
  Printer,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function PurchasesClient() {
  const [isDark, setIsDark] = useState(false);
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<BillingInvoiceRecord[]>([]);
  const [sampleInvoice, setSampleInvoice] = useState<BillingInvoiceRecord | null>(null);
  const [fiscalYearBs, setFiscalYearBs] = useState('2082/83');
  const [summary, setSummary] = useState({
    totalInvoices: 0,
    paidCount: 0,
    pendingCount: 0,
    refundedCount: 0,
    totalPaidNpr: 0,
    totalDiscountNpr: 0,
    totalRefundedNpr: 0,
  });

  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending' | 'refunded'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<BillingInvoiceRecord | null>(null);

  // Live Receipt Verifier Widget state
  const [verifyInvNum, setVerifyInvNum] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [verifyingReceipt, setVerifyingReceipt] = useState(false);

  useEffect(() => {
    async function loadInvoices() {
      try {
        setLoading(true);
        const res = await fetch('/api/billing/invoices');
        const data = await res.json();
        if (res.ok) {
          setInvoices(data.invoices || []);
          if (data.sampleInvoice) setSampleInvoice(data.sampleInvoice);
          if (data.fiscalYearBs) setFiscalYearBs(data.fiscalYearBs);
          if (data.summary) setSummary(data.summary);
        }
      } catch (err) {
        console.warn('Failed to load billing invoices:', err);
      } finally {
        setLoading(false);
      }
    }
    if (user) loadInvoices();
  }, [user]);

  const handleVerifyLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyInvNum.trim() || !verifyCode.trim()) {
      toast.error('Enter both Invoice/Receipt Number and Verification Code');
      return;
    }
    setVerifyingReceipt(true);
    try {
      const res = await fetch('/api/billing/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceNumber: verifyInvNum.trim(),
          verificationCode: verifyCode.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        toast.success('Authentic Samyak Receipt Verified (HMAC-SHA256)!', { icon: '🛡️' });
        const allItems = sampleInvoice ? [...invoices, sampleInvoice] : invoices;
        const found = allItems.find(
          (inv) =>
            inv.invoiceNumber.toUpperCase() === verifyInvNum.trim().toUpperCase() ||
            inv.receiptNumber?.toUpperCase() === verifyInvNum.trim().toUpperCase()
        );
        if (found) setSelectedInvoice(found);
      } else {
        toast.error(data.error || 'Invalid invoice number or verification code');
      }
    } catch {
      toast.error('Verification request failed');
    } finally {
      setVerifyingReceipt(false);
    }
  };

  const getCourseIcon = (courseSlug: string | null) => {
    switch (courseSlug) {
      case 'see_class_10':
        return <GraduationCap size={18} className="text-emerald-500" />;
      case 'cee_medical':
        return <Stethoscope size={18} className="text-indigo-500" />;
      case 'ielts':
        return <Languages size={18} className="text-amber-500" />;
      case 'digital_marketing':
        return <TrendingUp size={18} className="text-rose-500" />;
      case 'artificial_intelligence':
        return <Cpu size={18} className="text-purple-500" />;
      default:
        return <ShoppingBag size={18} className="text-primary" />;
    }
  };

  const filteredInvoices = invoices.filter((inv) => {
    if (statusFilter !== 'all' && inv.status !== statusFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      inv.invoiceNumber.toLowerCase().includes(q) ||
      (inv.receiptNumber && inv.receiptNumber.toLowerCase().includes(q)) ||
      inv.purchaseOrderId.toLowerCase().includes(q) ||
      inv.itemTitle.toLowerCase().includes(q) ||
      inv.verificationCode.toLowerCase().includes(q)
    );
  });

  return (
    <DashboardLayout isDark={isDark} onToggleDark={() => setIsDark(!isDark)}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Header */}
        <div className="p-6 rounded-3xl bg-card border border-border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider border border-emerald-500/20">
              <Lock size={11} />
              <span>HMAC-SHA256 Secured Billing Ledger • FY {fiscalYearBs} BS</span>
            </div>
            <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
              <Receipt size={22} className="text-primary" /> Invoices, Receipts &amp; Billing Vault
            </h1>
            <p className="text-xs text-muted-foreground">
              Every payment is recorded with a tamper-proof cryptographic signature and official downloadable tax receipt.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {sampleInvoice && (
              <button
                type="button"
                onClick={() => {
                  setVerifyInvNum(sampleInvoice.invoiceNumber);
                  setVerifyCode(sampleInvoice.verificationCode);
                  setSelectedInvoice(sampleInvoice);
                }}
                className="px-3.5 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Printer size={13} />
                <span>Preview Sample Receipt</span>
              </button>
            )}
            <Link
              href="/courses"
              className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs"
            >
              <span>Explore Courses</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>

        {/* Summary Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="p-4 rounded-2xl bg-card border border-border shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Total Paid
            </span>
            <p className="text-lg font-black text-foreground mt-1">
              NPR {summary.totalPaidNpr.toLocaleString()}
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-card border border-border shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Verified Receipts
            </span>
            <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {summary.paidCount} Issued
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-card border border-border shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Pending Orders
            </span>
            <p className="text-lg font-black text-amber-600 dark:text-amber-400 mt-1">
              {summary.pendingCount}
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-card border border-border shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Total Invoices
            </span>
            <p className="text-lg font-black text-foreground mt-1">
              {summary.totalInvoices}
            </p>
          </div>
        </div>

        {/* Cryptographic Receipt Authenticity Verifier */}
        <form
          onSubmit={handleVerifyLookup}
          className="p-4 sm:p-5 rounded-2xl bg-slate-950 text-slate-100 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3"
        >
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-400">
              <ShieldCheck size={15} />
              <span>Instant Receipt Authenticity Verifier</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Enter any Samyak Invoice/Receipt Number and Verification Code to verify its cryptographic HMAC-SHA256 seal.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
            <input
              type="text"
              placeholder="SAM-INV-2083-..."
              value={verifyInvNum}
              onChange={(e) => setVerifyInvNum(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-white placeholder:text-slate-500"
            />
            <input
              type="text"
              placeholder="Code: SAM-XXXX-XXXX"
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-white placeholder:text-slate-500"
            />
            <button
              type="submit"
              disabled={verifyingReceipt}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
            >
              {verifyingReceipt ? <Loader2 size={13} className="animate-spin" /> : <FileCheck2 size={14} />}
              <span>Verify Seal</span>
            </button>
          </div>
        </form>

        {/* Search & Status Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by Invoice #, Receipt #, Order ID, or Course..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-card border border-border text-xs text-foreground"
            />
          </div>

          <div className="flex items-center bg-muted/60 p-1 rounded-xl border border-border/60 text-xs self-start sm:self-auto">
            {(['all', 'paid', 'pending', 'refunded'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1 rounded-lg font-bold capitalize transition-all cursor-pointer ${
                  statusFilter === tab
                    ? 'bg-card text-foreground shadow-2xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Invoice List */}
        {loading ? (
          <div className="py-16 text-center space-y-3">
            <Loader2 size={32} className="animate-spin text-primary mx-auto" />
            <p className="text-xs text-muted-foreground">Loading your encrypted invoice ledger...</p>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="p-12 rounded-3xl bg-card border border-border text-center space-y-4 shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto text-muted-foreground">
              <Receipt size={28} />
            </div>
            <h3 className="text-base font-bold text-foreground">No Matching Invoices Found</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Every course enrollment or plan upgrade automatically generates a signed tax invoice and official payment receipt here.
            </p>
            <Link
              href="/courses"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs"
            >
              <span>Browse Courses &amp; Batches</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredInvoices.map((inv) => {
              const isPaid = inv.status === 'paid';
              const isRefunded = inv.status === 'refunded';

              return (
                <div
                  key={inv.id}
                  className="p-5 rounded-3xl bg-card border border-border hover:border-primary/40 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-all"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-muted/60 flex items-center justify-center shrink-0 mt-0.5">
                      {getCourseIcon(inv.courseSlug)}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-extrabold text-foreground">{inv.itemTitle}</h4>
                        <span
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1 ${
                            isPaid
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              : isRefunded
                              ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                              : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                          }`}
                        >
                          {isPaid ? <CheckCircle2 size={11} /> : isRefunded ? <RotateCcw size={11} /> : <Clock size={11} />}
                          <span>{inv.status}</span>
                        </span>
                        {inv.signatureValid && (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center gap-1">
                            <ShieldCheck size={11} />
                            <span>{inv.verificationCode}</span>
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-muted-foreground flex items-center gap-2 flex-wrap font-mono">
                        <span>Invoice: <strong className="text-foreground">{inv.invoiceNumber}</strong></span>
                        {inv.receiptNumber && (
                          <>
                            <span>·</span>
                            <span>Receipt: <strong className="text-emerald-600 dark:text-emerald-400">{inv.receiptNumber}</strong></span>
                          </>
                        )}
                        <span>·</span>
                        <span>Order: {inv.purchaseOrderId}</span>
                        <span>·</span>
                        <span className="uppercase">{inv.gateway}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between lg:justify-end gap-4 pt-3 lg:pt-0 border-t lg:border-t-0 border-border/60">
                    <div className="text-left lg:text-right">
                      <p className="text-sm font-black text-foreground">
                        NPR {inv.netAmountNpr.toLocaleString()}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {inv.paidAt
                          ? `Paid ${new Date(inv.paidAt).toLocaleDateString()}`
                          : `Issued ${new Date(inv.issuedAt).toLocaleDateString()}`}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedInvoice(inv)}
                        className="px-3.5 py-2 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                      >
                        <Printer size={13} />
                        <span>Official Receipt</span>
                      </button>

                      {isPaid && (
                        <Link
                          href="/student-dashboard"
                          className="px-3.5 py-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-bold text-xs flex items-center gap-1 transition-colors shrink-0"
                        >
                          <span>Portal</span>
                          <ArrowRight size={12} />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Official Printable Receipt Modal */}
        <OfficialReceiptModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
        />
      </div>
    </DashboardLayout>
  );
}
