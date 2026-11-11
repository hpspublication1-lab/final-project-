'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import OfficialReceiptModal from '@/components/billing/OfficialReceiptModal';
import { COMPANY_BILLING_CONFIG } from '@/lib/billing/companyConfig';
import type { BillingInvoiceRecord } from '@/lib/billing/invoiceEngine';
import {
  Download,
  Search,
  ShieldCheck,
  Loader2,
  FileText,
  Database,
  CheckCircle2,
  Copy,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function BillingSectionClient() {
  const [isDark, setIsDark] = useState(false);
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<BillingInvoiceRecord[]>([]);
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

  // Live cryptographic record verifier state
  const [verifyInvNum, setVerifyInvNum] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [verifyingRecord, setVerifyingRecord] = useState(false);

  useEffect(() => {
    async function fetchRecords() {
      try {
        setLoading(true);
        const res = await fetch('/api/billing/invoices');
        const data = await res.json();
        if (res.ok) {
          setInvoices(data.invoices || []);
          if (data.fiscalYearBs) setFiscalYearBs(data.fiscalYearBs);
          if (data.summary) setSummary(data.summary);
        }
      } catch (err) {
        console.warn('[BillingSection] Failed to load records:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchRecords();
  }, []);

  const filteredRecords = invoices.filter((rec) => {
    if (statusFilter !== 'all' && rec.status !== statusFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      rec.invoiceNumber.toLowerCase().includes(q) ||
      (rec.receiptNumber && rec.receiptNumber.toLowerCase().includes(q)) ||
      rec.purchaseOrderId.toLowerCase().includes(q) ||
      rec.itemTitle.toLowerCase().includes(q) ||
      rec.verificationCode.toLowerCase().includes(q) ||
      rec.sourceId.toLowerCase().includes(q)
    );
  });

  const handleVerifyRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyInvNum.trim() || !verifyCode.trim()) {
      toast.error('Enter both Invoice Number and Verification Control Code');
      return;
    }
    setVerifyingRecord(true);
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
        toast.success('Record verified: HMAC-SHA256 signature matches ledger.');
      } else {
        toast.error(data.error || 'Record signature verification failed');
      }
    } catch {
      toast.error('Could not reach verification endpoint');
    } finally {
      setVerifyingRecord(false);
    }
  };

  const handleExportJsonLedger = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      fiscalYearBs,
      companyConfig: COMPANY_BILLING_CONFIG,
      summary,
      recordCount: filteredRecords.length,
      records: filteredRecords,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `billing_ledger_records_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported signed JSON billing ledger');
  };

  const handleExportCsvLedger = () => {
    const headers = [
      'Invoice Number',
      'Receipt Number',
      'Order / PRN',
      'Source Type',
      'Source ID',
      'Customer Name',
      'Customer Email',
      'Item Title',
      'SKU',
      'Gross Amount (NPR)',
      'Discount (NPR)',
      'Tax (NPR)',
      'Net Paid (NPR)',
      'Net Paid (Paisa)',
      'Gateway',
      'Gateway Ref',
      'Status',
      'Fiscal Year (BS)',
      'Verification Code',
      'HMAC-SHA256 Signature',
      'Issued At',
      'Paid At',
    ];

    const rows = filteredRecords.map((r) => [
      r.invoiceNumber,
      r.receiptNumber || '',
      r.purchaseOrderId,
      r.sourceType,
      r.sourceId,
      r.customerName,
      r.customerEmail || '',
      r.itemTitle,
      r.itemSku,
      r.grossAmountNpr,
      r.discountAmountNpr,
      r.taxAmountNpr,
      r.netAmountNpr,
      r.netAmountPaisa,
      r.gateway,
      r.gatewayRef || '',
      r.status,
      r.fiscalYearBs,
      r.verificationCode,
      r.signatureHash,
      r.issuedAt,
      r.paidAt || '',
    ]);

    const csv = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `billing_ledger_records_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported CSV billing ledger');
  };

  return (
    <DashboardLayout isDark={isDark} onToggleDark={() => setIsDark(!isDark)}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Top Header & Record Export Actions */}
        <div className="bg-card border border-border p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-muted-foreground">
              <Database size={14} />
              <span>IMMUTABLE BILLING LEDGER &bull; FY {fiscalYearBs} BS</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">
              Billing Records &amp; Secured Payment Ledger
            </h1>
            <p className="text-xs text-muted-foreground">
              All user payments and invoices are cryptographically signed (HMAC-SHA256) and stored with row-level immutability.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleExportCsvLedger}
              className="px-3.5 py-2 border border-border bg-background hover:bg-muted text-foreground text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Download size={13} />
              <span>Export CSV</span>
            </button>
            <button
              type="button"
              onClick={handleExportJsonLedger}
              className="px-3.5 py-2 bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Download size={13} />
              <span>Backup Signed JSON</span>
            </button>
          </div>
        </div>

        {/* Summary Ledger Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 bg-card border border-border">
            <span className="text-[11px] font-mono uppercase text-muted-foreground">
              Stored Records
            </span>
            <p className="text-lg font-bold font-mono text-foreground mt-1">
              {summary.totalInvoices}
            </p>
          </div>
          <div className="p-4 bg-card border border-border">
            <span className="text-[11px] font-mono uppercase text-muted-foreground">
              Settled / Paid
            </span>
            <p className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
              {summary.paidCount}
            </p>
          </div>
          <div className="p-4 bg-card border border-border">
            <span className="text-[11px] font-mono uppercase text-muted-foreground">
              Pending / Unverified
            </span>
            <p className="text-lg font-bold font-mono text-amber-600 dark:text-amber-400 mt-1">
              {summary.pendingCount}
            </p>
          </div>
          <div className="p-4 bg-card border border-border">
            <span className="text-[11px] font-mono uppercase text-muted-foreground">
              Total Settled (NPR)
            </span>
            <p className="text-lg font-bold font-mono text-foreground mt-1">
              NPR {summary.totalPaidNpr.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Cryptographic Record Integrity Verifier */}
        <form
          onSubmit={handleVerifyRecord}
          className="p-4 bg-card border border-border flex flex-col md:flex-row md:items-center justify-between gap-3"
        >
          <div>
            <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <ShieldCheck size={15} className="text-emerald-600" />
              <span>Verify Stored Record Signature (HMAC-SHA256)</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Validate any Invoice Number and Control Code against the server-side signing key.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
            <input
              type="text"
              placeholder="Invoice No (e.g. SAM-INV-...)"
              value={verifyInvNum}
              onChange={(e) => setVerifyInvNum(e.target.value)}
              className="px-3 py-1.5 bg-background border border-border text-xs font-mono text-foreground"
            />
            <input
              type="text"
              placeholder="Control Code (SAM-XXXX-XXXX)"
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value)}
              className="px-3 py-1.5 bg-background border border-border text-xs font-mono text-foreground"
            />
            <button
              type="submit"
              disabled={verifyingRecord}
              className="px-4 py-1.5 bg-foreground text-background text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {verifyingRecord && <Loader2 size={12} className="animate-spin" />}
              <span>Verify Record</span>
            </button>
          </div>
        </form>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              placeholder="Filter records by Invoice #, Receipt #, Order PRN, Source ID, or Control Code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-card border border-border text-xs font-mono text-foreground"
            />
          </div>

          <div className="flex items-center border border-border bg-card text-xs">
            {(['all', 'paid', 'pending', 'refunded'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-2 font-mono uppercase text-[11px] font-bold cursor-pointer border-r border-border last:border-r-0 ${
                  statusFilter === tab
                    ? 'bg-foreground text-background'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Stored Billing Records Table */}
        <div className="bg-card border border-border overflow-x-auto">
          {loading ? (
            <div className="py-14 text-center space-y-2">
              <Loader2 size={24} className="animate-spin text-primary mx-auto" />
              <p className="text-xs font-mono text-muted-foreground">
                Reading encrypted billing ledger...
              </p>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="p-10 text-center space-y-2">
              <p className="text-sm font-bold text-foreground">No stored billing records found</p>
              <p className="text-xs text-muted-foreground">
                Every completed or pending payment transaction is automatically recorded and signed here.
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-muted/60 border-b border-border font-mono text-[10.5px] uppercase text-muted-foreground">
                  <th className="py-3 px-3">Invoice / Receipt No.</th>
                  <th className="py-3 px-3">Order PRN / Source</th>
                  <th className="py-3 px-3">Course / Plan</th>
                  <th className="py-3 px-3 text-right">Amount (NPR)</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Control Code &amp; Hash</th>
                  <th className="py-3 px-3">Recorded Date</th>
                  <th className="py-3 px-3 text-right">Voucher</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-mono">
                {filteredRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-muted/30">
                    <td className="py-3 px-3 align-top">
                      <div className="font-bold text-foreground">{rec.invoiceNumber}</div>
                      {rec.receiptNumber && (
                        <div className="text-[10.5px] text-emerald-600 dark:text-emerald-400">
                          {rec.receiptNumber}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 align-top text-[11px]">
                      <div className="font-semibold text-foreground">{rec.purchaseOrderId}</div>
                      <div className="text-[10px] text-muted-foreground uppercase">
                        {rec.gateway} &bull; {rec.sourceType}
                      </div>
                    </td>
                    <td className="py-3 px-3 align-top font-sans">
                      <div className="font-semibold text-foreground">{rec.itemTitle}</div>
                      <div className="text-[10.5px] font-mono text-muted-foreground">
                        SKU: {rec.itemSku} ({rec.durationDays}d)
                      </div>
                    </td>
                    <td className="py-3 px-3 align-top text-right font-bold text-foreground">
                      NPR {rec.netAmountNpr.toLocaleString()}
                      <div className="text-[10px] font-normal text-muted-foreground">
                        {rec.netAmountPaisa} paisa
                      </div>
                    </td>
                    <td className="py-3 px-3 align-top">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase border ${
                          rec.status === 'paid'
                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                            : rec.status === 'refunded'
                            ? 'bg-rose-500/10 text-rose-600 border-rose-500/30'
                            : 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                        }`}
                      >
                        {rec.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 align-top">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 size={12} className="text-emerald-600 shrink-0" />
                        <span className="font-bold text-foreground">{rec.verificationCode}</span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(rec.verificationCode);
                            toast.success('Copied control code');
                          }}
                          className="text-muted-foreground hover:text-foreground cursor-pointer"
                          title="Copy Control Code"
                        >
                          <Copy size={11} />
                        </button>
                      </div>
                      <div className="text-[9.5px] text-muted-foreground truncate max-w-[150px]">
                        {rec.signatureHash}
                      </div>
                    </td>
                    <td className="py-3 px-3 align-top text-[11px] text-muted-foreground">
                      {new Date(rec.paidAt || rec.issuedAt).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3 px-3 align-top text-right font-sans">
                      <button
                        type="button"
                        onClick={() => setSelectedInvoice(rec)}
                        className="px-2.5 py-1 border border-border bg-background hover:bg-muted text-foreground text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <FileText size={12} />
                        <span>Open</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <OfficialReceiptModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
        />
      </div>
    </DashboardLayout>
  );
}
