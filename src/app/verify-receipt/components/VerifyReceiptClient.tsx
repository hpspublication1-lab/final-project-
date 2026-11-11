'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileCheck2,
  Printer,
  Search,
  Lock,
  ArrowRight,
  ExternalLink,
  Loader2,
  Building2,
  Copy,
} from 'lucide-react';
import { COMPANY_BILLING_CONFIG } from '@/lib/billing/companyConfig';
import toast from 'react-hot-toast';

interface VerifiedPayload {
  valid: boolean;
  verifiedAt: string;
  algorithm: string;
  issuer: {
    legalName: string;
    tradeName: string;
    panNumber: string;
    registrationNumber: string;
    address: string;
    phone: string;
    email: string;
    website: string;
  };
  invoice: {
    invoiceNumber: string;
    receiptNumber: string | null;
    verificationCode: string;
    signatureHash: string;
    customerName: string;
    itemTitle: string;
    itemSku: string;
    grossAmountNpr: number;
    discountAmountNpr: number;
    taxAmountNpr: number;
    netAmountNpr: number;
    amountInWords: string;
    gateway: string;
    purchaseOrderId: string;
    status: string;
    fiscalYearBs: string;
    issuedAt: string;
    paidAt: string | null;
  };
}

export default function VerifyReceiptClient({
  initialInvoice = '',
  initialCode = '',
}: {
  initialInvoice?: string;
  initialCode?: string;
}) {
  const [invoiceNumber, setInvoiceNumber] = useState(initialInvoice);
  const [verificationCode, setVerificationCode] = useState(initialCode);
  const [loading, setLoading] = useState(false);
  const [verifiedData, setVerifiedData] = useState<VerifiedPayload | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const performVerification = async (invNum: string, code: string) => {
    const cleanInv = invNum.trim();
    const cleanCode = code.trim();

    if (!cleanInv || !cleanCode) {
      toast.error('Please enter both the Invoice Number and Verification Control Code');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setVerifiedData(null);

    try {
      const res = await fetch('/api/billing/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceNumber: cleanInv,
          verificationCode: cleanCode,
        }),
      });

      const data = await res.json();
      if (res.ok && data.valid) {
        setVerifiedData(data);
        toast.success('Authentic Electronic Record Verified (HMAC-SHA256)!');
      } else {
        setErrorMessage(data.error || 'Verification failed. Please verify the code on your receipt.');
        toast.error('Record verification failed');
      }
    } catch {
      setErrorMessage('Verification server is unreachable. Please check your internet connection.');
      toast.error('Network connection error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialInvoice && initialCode) {
      performVerification(initialInvoice, initialCode);
    }
  }, [initialInvoice, initialCode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performVerification(invoiceNumber, verificationCode);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 selection:bg-slate-300">
      {/* Top Corporate Nav Header */}
      <header className="bg-slate-950 text-white border-b border-slate-800 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 text-slate-950 font-black flex items-center justify-center text-sm">
            S
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight">{COMPANY_BILLING_CONFIG.tradeName}</div>
            <div className="text-[10px] text-slate-400 font-mono">Official E-Billing &amp; Tax Verification</div>
          </div>
        </Link>

        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="hidden sm:inline text-slate-400">PAN: {COMPANY_BILLING_CONFIG.panNumber}</span>
          <Link
            href="/billing"
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold"
          >
            Portal Login
          </Link>
        </div>
      </header>

      {/* Main Verification Container */}
      <main className="max-w-3xl mx-auto px-4 py-8 sm:py-12 space-y-6">
        {/* Verification Form Card */}
        <div className="bg-white border-2 border-slate-900 p-6 sm:p-8 shadow-sm">
          <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4 mb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider border border-emerald-300 mb-2">
                <Lock size={11} />
                <span>Nepal Electronic Transactions Act, 2063 Compliant</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-950">
                Official Receipt &amp; Tax Invoice Verifier
              </h1>
              <p className="text-xs text-slate-600 mt-1">
                Scan the QR code on your printed receipt or enter the Voucher Number and Control Code below to verify its cryptographic authenticity.
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-800 shrink-0">
              <ShieldCheck size={28} className="text-emerald-600" />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Invoice / Receipt Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. SAM-INV-2083-994821"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 text-xs font-mono text-slate-950 focus:bg-white focus:border-slate-900 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Verification Control Code
                </label>
                <input
                  type="text"
                  placeholder="e.g. SAM-8F4A-92C1"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 text-xs font-mono text-slate-950 focus:bg-white focus:border-slate-900 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
              <p className="text-[11px] text-slate-500">
                Tip: The 12-character control code is printed directly under the CBMS/QR seal of your receipt.
              </p>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shrink-0 transition-colors"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                <span>Verify Authenticity</span>
              </button>
            </div>
          </form>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="bg-rose-50 border-2 border-rose-300 p-5 text-rose-950 flex items-start gap-3">
            <AlertTriangle size={20} className="text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <p className="font-bold text-rose-900">Verification Alert: Invalid or Unregistered Voucher</p>
              <p className="text-rose-800">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Verified Result Certificate */}
        {verifiedData && verifiedData.valid && (
          <div className="bg-white border-2 border-emerald-600 p-6 sm:p-8 space-y-6 shadow-md animate-fade-in">
            {/* Certificate Header Banner */}
            <div className="bg-emerald-50 border border-emerald-300 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <div className="text-xs font-black uppercase tracking-wider text-emerald-900">
                    OFFICIAL AUTHENTIC RECORD CONFIRMED
                  </div>
                  <div className="text-[11px] text-emerald-700">
                    Cryptographic signature is valid and permanently recorded in the billing ledger.
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="text-[10px] font-mono text-emerald-800">
                  Algorithm: {verifiedData.algorithm}
                </div>
                <div className="text-[10px] font-mono text-emerald-700">
                  Verified: {new Date(verifiedData.verifiedAt).toLocaleTimeString()} NPT
                </div>
              </div>
            </div>

            {/* Issuer & Voucher Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 border border-slate-300 bg-slate-50 space-y-1.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                  Issuing Organization
                </div>
                <div className="font-bold text-slate-950 text-sm">
                  {verifiedData.issuer.legalName}
                </div>
                <div className="text-slate-700">{verifiedData.issuer.address}</div>
                <div className="font-mono text-[11px] text-slate-700">
                  PAN / VAT: <strong>{verifiedData.issuer.panNumber}</strong>
                </div>
                <div className="font-mono text-[11px] text-slate-700">
                  Regd. No: {verifiedData.issuer.registrationNumber}
                </div>
              </div>

              <div className="p-4 border border-slate-300 bg-slate-50 space-y-1.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                  Payment &amp; Settlement Telemetry
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Invoice Number:</span>
                  <strong className="font-mono text-slate-950">{verifiedData.invoice.invoiceNumber}</strong>
                </div>
                {verifiedData.invoice.receiptNumber && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">Money Receipt:</span>
                    <strong className="font-mono text-emerald-700">{verifiedData.invoice.receiptNumber}</strong>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-600">Fiscal Year (B.S.):</span>
                  <span className="font-mono">{verifiedData.invoice.fiscalYearBs}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Payment Gateway:</span>
                  <span className="font-bold uppercase text-slate-950">{verifiedData.invoice.gateway}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Order PRN / Ref:</span>
                  <span className="font-mono">{verifiedData.invoice.purchaseOrderId}</span>
                </div>
              </div>
            </div>

            {/* Student & Course Entitlement Box */}
            <div className="p-4 border border-slate-300 bg-white space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                Academic Service &amp; Enrolled Student
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
                <div>
                  <div className="text-sm font-bold text-slate-950">{verifiedData.invoice.itemTitle}</div>
                  <div className="text-[11px] font-mono text-slate-600">SKU: {verifiedData.invoice.itemSku}</div>
                </div>
                <div className="sm:text-right">
                  <div className="text-base font-bold font-mono text-slate-950">
                    NPR {verifiedData.invoice.netAmountNpr.toLocaleString()}
                  </div>
                  <div className="text-[10px] font-bold text-emerald-700 uppercase">
                    Status: {verifiedData.invoice.status}
                  </div>
                </div>
              </div>
              <div className="text-xs text-slate-700 pt-1">
                Enrolled Student / Payee: <strong>{verifiedData.invoice.customerName}</strong>
              </div>
              {verifiedData.invoice.amountInWords && (
                <div className="text-[11px] text-slate-600 italic">
                  Amount in Words: &ldquo;{verifiedData.invoice.amountInWords}&rdquo;
                </div>
              )}
            </div>

            {/* Cryptographic Hash Digest */}
            <div className="p-3 bg-slate-950 text-slate-200 font-mono text-[10.5px] space-y-1">
              <div className="text-emerald-400 font-bold uppercase tracking-wider text-[10px]">
                Cryptographic Control Fingerprint
              </div>
              <div className="flex items-center justify-between gap-2">
                <span>Verification Code: <strong className="text-white">{verifiedData.invoice.verificationCode}</strong></span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(verifiedData.invoice.verificationCode);
                    toast.success('Control code copied!');
                  }}
                  className="text-slate-400 hover:text-white inline-flex items-center gap-1 cursor-pointer"
                >
                  <Copy size={11} />
                  <span>Copy</span>
                </button>
              </div>
              <div className="text-slate-400 break-all text-[9.5px]">
                SHA-256 Digest: {verifiedData.invoice.signatureHash}
              </div>
            </div>

            {/* Action Buttons: View Full Voucher & Print */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-200">
              <Link
                href={`/receipt/${verifiedData.invoice.invoiceNumber}`}
                className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <FileCheck2 size={14} />
                <span>View Full Tax Invoice Sheet</span>
                <ArrowRight size={13} />
              </Link>

              <button
                type="button"
                onClick={() => window.print()}
                className="w-full sm:w-auto px-4 py-2.5 border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Printer size={14} />
                <span>Print Certificate</span>
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
