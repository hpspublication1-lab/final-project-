'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  RefreshCw,
  Loader2,
  Search,
  CheckCircle2,
  Download,
  ShieldCheck,
  FileText,
  CreditCard,
  Building2,
  ExternalLink,
  RotateCcw,
  Clock,
  Copy,
} from 'lucide-react';
import { toast } from 'sonner';
import OfficialReceiptModal from '@/components/billing/OfficialReceiptModal';
import { COMPANY_BILLING_CONFIG } from '@/lib/billing/companyConfig';
import type { BillingInvoiceRecord } from '@/lib/billing/invoiceEngine';

export default function AdminBillingClient() {
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<BillingInvoiceRecord[]>([]);
  const [fiscalYearBs, setFiscalYearBs] = useState('2082/83');
  const [selectedFy, setSelectedFy] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [gatewayFilter, setGatewayFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<BillingInvoiceRecord | null>(null);

  const fetchLedger = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/billing/invoices?all=true');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load billing ledger');
      setInvoices(data.invoices || []);
      if (data.fiscalYearBs) setFiscalYearBs(data.fiscalYearBs);
    } catch (err: any) {
      toast.error(err.message || 'Error fetching billing ledger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, []);

  const filteredInvoices = invoices.filter((inv) => {
    if (selectedFy !== 'all' && inv.fiscalYearBs !== selectedFy) return false;
    if (statusFilter !== 'all' && inv.status !== statusFilter) return false;
    if (gatewayFilter !== 'all' && inv.gateway.toLowerCase() !== gatewayFilter.toLowerCase())
      return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      inv.invoiceNumber.toLowerCase().includes(q) ||
      (inv.receiptNumber && inv.receiptNumber.toLowerCase().includes(q)) ||
      inv.customerName.toLowerCase().includes(q) ||
      inv.customerEmail.toLowerCase().includes(q) ||
      inv.purchaseOrderId.toLowerCase().includes(q) ||
      inv.verificationCode.toLowerCase().includes(q) ||
      inv.itemTitle.toLowerCase().includes(q)
    );
  });

  // Financial aggregates
  const paidInvoices = filteredInvoices.filter((i) => i.status === 'paid');
  const pendingInvoices = filteredInvoices.filter((i) => i.status === 'pending');
  const refundedInvoices = filteredInvoices.filter((i) => i.status === 'refunded');

  const grossTuitionNpr = filteredInvoices.reduce((sum, i) => sum + i.grossAmountNpr, 0);
  const totalDiscountNpr = filteredInvoices.reduce((sum, i) => sum + i.discountAmountNpr, 0);
  const netSettledNpr = paidInvoices.reduce((sum, i) => sum + i.netAmountNpr, 0);
  const totalRefundedNpr = refundedInvoices.reduce((sum, i) => sum + i.netAmountNpr, 0);

  // Gateway breakdown
  const gatewayBreakdown = paidInvoices.reduce<Record<string, { count: number; totalNpr: number }>>(
    (acc, inv) => {
      const g = inv.gateway.toLowerCase();
      if (!acc[g]) acc[g] = { count: 0, totalNpr: 0 };
      acc[g].count += 1;
      acc[g].totalNpr += inv.netAmountNpr;
      return acc;
    },
    {}
  );

  const exportCaTaxLedgerCsv = () => {
    const headers = [
      'Fiscal Year (BS)',
      'Invoice Number',
      'Money Receipt Number',
      'Transaction Date (AD)',
      'Buyer / Student Name',
      'Customer Email',
      'Customer Phone',
      'Course SKU',
      'Particulars',
      'Gross Tuition (NPR)',
      'Scholarship / Rebate (NPR)',
      'Taxable Amount (NPR)',
      'Education Tax / VAT (0%)',
      'Net Settled (NPR)',
      'Payment Gateway',
      'Order PRN / Ref',
      'Status',
      'Verification Control Code',
      'HMAC-SHA256 Digest',
    ];

    const rows = filteredInvoices.map((inv) => {
      const gross = inv.grossAmountNpr;
      const discount = inv.discountAmountNpr;
      const taxable = Math.max(0, gross - discount);
      const tax = inv.taxAmountNpr;
      const net = inv.netAmountNpr;

      return [
        inv.fiscalYearBs,
        inv.invoiceNumber,
        inv.receiptNumber || '',
        inv.paidAt || inv.issuedAt,
        inv.customerName,
        inv.customerEmail,
        inv.customerPhone,
        inv.itemSku,
        inv.itemTitle,
        gross,
        discount,
        taxable,
        tax,
        net,
        inv.gateway,
        inv.purchaseOrderId,
        inv.status,
        inv.verificationCode,
        inv.signatureHash,
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((val) => `"${String(val ?? '').replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Samyak_Tax_VAT_Ledger_FY${fiscalYearBs.replace('/', '_')}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Chartered Accountant Tax & VAT Ledger exported');
  };

  const exportSignedJsonBackup = () => {
    const backupPayload = {
      exportedAt: new Date().toISOString(),
      companyProfile: COMPANY_BILLING_CONFIG,
      fiscalYearBs,
      summary: {
        totalRecords: filteredInvoices.length,
        paidCount: paidInvoices.length,
        pendingCount: pendingInvoices.length,
        refundedCount: refundedInvoices.length,
        grossTuitionNpr,
        totalDiscountNpr,
        netSettledNpr,
        totalRefundedNpr,
      },
      records: filteredInvoices,
    };

    const blob = new Blob([JSON.stringify(backupPayload, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `billing_immutable_ledger_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Immutable JSON Ledger exported');
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="w-9 h-9 flex items-center justify-center rounded-xl border border-border bg-card text-foreground hover:bg-muted transition-colors"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-foreground flex items-center gap-2">
                  <Building2 size={22} className="text-primary" /> Billing, Tax &amp; Financial Ledger
                </h1>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  FY {fiscalYearBs} BS
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Centralized financial reconciliation, official IRD-compliant tax vouchers, and append-only cryptographic audit records.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/admin/orders"
              className="px-3 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-bold text-foreground flex items-center gap-1.5 transition-colors"
            >
              <CreditCard size={14} />
              <span>Orders Console</span>
            </Link>

            <button
              onClick={exportCaTaxLedgerCsv}
              disabled={filteredInvoices.length === 0}
              className="px-3.5 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Download size={14} />
              <span>Export CA Tax Ledger (CSV)</span>
            </button>

            <button
              onClick={exportSignedJsonBackup}
              disabled={filteredInvoices.length === 0}
              className="px-3 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-bold text-foreground flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Download size={14} />
              <span>JSON Backup</span>
            </button>

            <button
              onClick={fetchLedger}
              className="p-2 rounded-xl border border-border bg-card hover:bg-muted text-foreground transition-colors cursor-pointer"
              title="Refresh ledger"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Financial KPI Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          <div className="p-4 rounded-2xl bg-card border border-border shadow-xs">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
              Gross Tuition Volume
            </span>
            <p className="text-lg sm:text-xl font-black font-mono text-foreground mt-1">
              NPR {grossTuitionNpr.toLocaleString()}
            </p>
            <span className="text-[10px] text-muted-foreground mt-0.5 block">
              Before scholarships &amp; rebates
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-card border border-border shadow-xs">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Net Settled Revenue
            </span>
            <p className="text-lg sm:text-xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1">
              NPR {netSettledNpr.toLocaleString()}
            </p>
            <span className="text-[10px] text-emerald-700/80 mt-0.5 block">
              {paidInvoices.length} Verified Collections
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-card border border-border shadow-xs">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Scholarships Granted
            </span>
            <p className="text-lg sm:text-xl font-black font-mono text-indigo-600 dark:text-indigo-400 mt-1">
              - NPR {totalDiscountNpr.toLocaleString()}
            </p>
            <span className="text-[10px] text-muted-foreground mt-0.5 block">
              Coupons &amp; merit concessions
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-card border border-border shadow-xs">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Pending / Refunded
            </span>
            <p className="text-lg sm:text-xl font-black font-mono text-foreground mt-1">
              {pendingInvoices.length} P / {refundedInvoices.length} R
            </p>
            <span className="text-[10px] text-muted-foreground mt-0.5 block">
              Refunds: NPR {totalRefundedNpr.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Payment Gateway Breakdown Bar */}
        <div className="p-4 rounded-2xl bg-card border border-border flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
          <div className="flex items-center gap-2">
            <CreditCard size={16} className="text-primary" />
            <span className="font-bold uppercase tracking-wider text-foreground">
              Gateway Settlement Breakdown:
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {Object.entries(gatewayBreakdown).map(([gw, stats]) => (
              <div
                key={gw}
                className="px-3 py-1.5 rounded-xl bg-muted/60 border border-border/80 flex items-center gap-2"
              >
                <span className="font-bold uppercase text-foreground">{gw}:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                  NPR {stats.totalNpr.toLocaleString()}
                </span>
                <span className="text-[10px] text-muted-foreground">({stats.count} txns)</span>
              </div>
            ))}
            {Object.keys(gatewayBreakdown).length === 0 && (
              <span className="text-muted-foreground">No settled transactions yet.</span>
            )}
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search
              size={14}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              placeholder="Search by Invoice #, Receipt #, Student Name, Email, or PRN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-card border border-border text-xs text-foreground focus:outline-none focus:border-primary"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Fiscal Year Filter */}
            <select
              value={selectedFy}
              onChange={(e) => setSelectedFy(e.target.value)}
              className="px-3 py-2 rounded-xl bg-card border border-border text-xs font-mono text-foreground focus:outline-none"
            >
              <option value="all">All Fiscal Years</option>
              <option value="2082/83">FY 2082/83 BS</option>
              <option value="2083/84">FY 2083/84 BS</option>
            </select>

            {/* Gateway Filter */}
            <select
              value={gatewayFilter}
              onChange={(e) => setGatewayFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-card border border-border text-xs font-mono text-foreground focus:outline-none"
            >
              <option value="all">All Gateways</option>
              <option value="fonepay">Fonepay</option>
              <option value="esewa">eSewa</option>
              <option value="khalti">Khalti</option>
            </select>

            {/* Status Filter */}
            <div className="flex items-center bg-muted/60 p-1 rounded-xl border border-border/80 text-xs">
              {(['all', 'paid', 'pending', 'refunded'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setStatusFilter(tab)}
                  className={`px-3 py-1 rounded-lg font-mono uppercase text-[11px] font-bold capitalize transition-all cursor-pointer ${
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
        </div>

        {/* Invoices Table */}
        <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-xs">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <Loader2 size={32} className="animate-spin text-primary mx-auto" />
              <p className="text-xs font-mono text-muted-foreground">Reading financial ledger...</p>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <p className="text-sm font-bold text-foreground">No financial records found</p>
              <p className="text-xs text-muted-foreground">
                Records appear automatically as students pay via Fonepay, eSewa, or Khalti.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-muted/60 border-b border-border font-mono text-[10.5px] uppercase text-muted-foreground font-bold">
                    <th className="py-3 px-4">Invoice / Receipt</th>
                    <th className="py-3 px-4">Student / Buyer</th>
                    <th className="py-3 px-4">Particulars</th>
                    <th className="py-3 px-4 text-right">Net Paid (NPR)</th>
                    <th className="py-3 px-4">Gateway &amp; PRN</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Control Seal</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border font-mono">
                  {filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3.5 px-4 align-top">
                        <div className="font-bold text-foreground">{inv.invoiceNumber}</div>
                        {inv.receiptNumber && (
                          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                            {inv.receiptNumber}
                          </div>
                        )}
                        <div className="text-[10px] text-muted-foreground">FY {inv.fiscalYearBs}</div>
                      </td>

                      <td className="py-3.5 px-4 align-top font-sans">
                        <div className="font-bold text-foreground">{inv.customerName}</div>
                        <div className="text-[10.5px] text-muted-foreground font-mono">{inv.customerEmail}</div>
                        {inv.customerPhone && (
                          <div className="text-[10px] text-muted-foreground font-mono">{inv.customerPhone}</div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 align-top font-sans max-w-[200px]">
                        <div className="font-bold text-foreground line-clamp-1">{inv.itemTitle}</div>
                        <div className="text-[10.5px] text-muted-foreground font-mono">
                          SKU: {inv.itemSku} ({inv.durationDays}d)
                        </div>
                      </td>

                      <td className="py-3.5 px-4 align-top text-right">
                        <div className="font-black text-foreground">NPR {inv.netAmountNpr.toLocaleString()}</div>
                        {inv.discountAmountNpr > 0 && (
                          <div className="text-[10px] text-emerald-600 dark:text-emerald-400">
                            Disc: -NPR {inv.discountAmountNpr.toLocaleString()}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 align-top">
                        <span className="font-bold uppercase text-foreground">{inv.gateway}</span>
                        <div className="text-[10.5px] text-muted-foreground truncate max-w-[140px]">
                          {inv.purchaseOrderId}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 align-top">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                            inv.status === 'paid'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                              : inv.status === 'refunded'
                              ? 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                              : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                          }`}
                        >
                          {inv.status === 'paid' ? (
                            <CheckCircle2 size={10} />
                          ) : inv.status === 'refunded' ? (
                            <RotateCcw size={10} />
                          ) : (
                            <Clock size={10} />
                          )}
                          <span>{inv.status}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4 align-top">
                        <div className="flex items-center gap-1.5">
                          <ShieldCheck size={13} className="text-emerald-500 shrink-0" />
                          <span className="font-bold text-foreground">{inv.verificationCode}</span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(inv.verificationCode);
                              toast.success('Copied control seal');
                            }}
                            className="text-muted-foreground hover:text-foreground cursor-pointer"
                            title="Copy code"
                          >
                            <Copy size={11} />
                          </button>
                        </div>
                        <div className="text-[9.5px] text-muted-foreground truncate max-w-[130px]">
                          {inv.signatureHash}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 align-top text-right font-sans">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedReceipt(inv)}
                            className="px-2.5 py-1 rounded-lg border border-border bg-card hover:bg-muted text-foreground text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <FileText size={12} />
                            <span>Receipt</span>
                          </button>

                          <Link
                            href={`/verify-receipt?inv=${encodeURIComponent(inv.invoiceNumber)}&code=${encodeURIComponent(inv.verificationCode)}`}
                            target="_blank"
                            className="p-1 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                            title="Verify in Public Portal"
                          >
                            <ExternalLink size={13} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Official Receipt Modal */}
        <OfficialReceiptModal
          invoice={selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
        />
      </div>
    </div>
  );
}
