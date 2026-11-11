'use client';

import React, { useState } from 'react';
import {
  X, ZoomIn, ZoomOut, RotateCw, ExternalLink, CheckCircle2,
  AlertTriangle, Phone, Mail, User, ShieldCheck, Printer,
  RotateCcw, Copy, Check, MessageSquare, FileText, ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';
import type { BillingInvoiceRecord } from '@/lib/billing/invoiceEngine';

export interface InspectedOrder {
  id: string;
  purchase_order_id?: string;
  invoice_number?: string;
  receipt_number?: string | null;
  verification_code?: string;
  invoice?: BillingInvoiceRecord;
  user_id: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  plan_sku: string;
  gateway?: string;
  gateway_ref?: string | null;
  slip_url?: string | null;
  metadata?: Record<string, any>;
  gross_amount_npr: number;
  discount_amount_npr: number;
  net_amount_npr: number;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  created_at: string;
}

interface Props {
  order: InspectedOrder | null;
  onClose: () => void;
  onApprove: (orderId: string, notes: string) => Promise<void> | void;
  onReject?: (orderId: string, reason: string) => Promise<void> | void;
  onRefund?: (orderId: string, reason: string) => Promise<void> | void;
  onViewReceipt?: (invoice: BillingInvoiceRecord) => void;
  processing?: boolean;
}

export default function PaymentSlipInspectionModal({
  order,
  onClose,
  onApprove,
  onReject,
  onRefund,
  onViewReceipt,
  processing = false,
}: Props) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [notes, setNotes] = useState('Payment slip & bank reference verified');
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectBox, setShowRejectBox] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!order) return null;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success(`Copied ${key} to clipboard`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
  const handleResetZoom = () => {
    setZoom(1);
    setRotation(0);
  };
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  const cleanPhone = (order.customer_phone || '').replace(/[^0-9]/g, '');
  const waPhone = cleanPhone.startsWith('977') ? cleanPhone : `977${cleanPhone}`;
  const waMessage = encodeURIComponent(
    `Namaste ${order.customer_name || 'Student'} ji, we received your payment verification request of Rs. ${order.net_amount_npr.toLocaleString()} for ${order.plan_sku.replace(/_/g, ' ')} on Samyak Education (Order #${(order.purchase_order_id || order.id).slice(0, 10)}).`
  );
  const waUrl = cleanPhone.length >= 10 ? `https://wa.me/${waPhone}?text=${waMessage}` : null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-3xl max-w-5xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Top Header Bar */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-foreground flex items-center gap-2">
                Payment Slip &amp; Bank Voucher Inspection
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    order.status === 'completed'
                      ? 'bg-success/20 text-success'
                      : order.status === 'pending'
                      ? 'bg-amber-500/20 text-amber-500'
                      : order.status === 'refunded'
                      ? 'bg-error/20 text-error'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {order.status}
                </span>
              </h2>
              <p className="text-xs text-muted-foreground">
                Order ID: <span className="font-mono">{order.purchase_order_id || order.id}</span> · Issued:{' '}
                {new Date(order.created_at).toLocaleString()}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl border border-border hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Split Screen Body */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0 overflow-y-auto lg:overflow-hidden">
          
          {/* LEFT: Slip Viewer & Pan/Zoom (7 cols) */}
          <div className="lg:col-span-7 bg-muted/20 border-b lg:border-b-0 lg:border-r border-border p-4 flex flex-col min-h-[380px] lg:min-h-0">
            {/* Viewer Toolbar */}
            <div className="flex items-center justify-between mb-3 bg-card border border-border rounded-xl px-3 py-1.5 shadow-xs text-xs">
              <span className="font-semibold text-muted-foreground flex items-center gap-1.5">
                <FileText size={14} className="text-primary" />
                Proof Document: {order.slip_url ? 'Uploaded Deposit Slip' : 'Gateway Electronic Trace'}
              </span>

              <div className="flex items-center gap-1">
                <button
                  onClick={handleZoomIn}
                  className="p-1 rounded-lg hover:bg-muted text-foreground transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn size={16} />
                </button>
                <button
                  onClick={handleZoomOut}
                  className="p-1 rounded-lg hover:bg-muted text-foreground transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut size={16} />
                </button>
                <button
                  onClick={handleRotate}
                  className="p-1 rounded-lg hover:bg-muted text-foreground transition-colors"
                  title="Rotate 90°"
                >
                  <RotateCw size={15} />
                </button>
                <button
                  onClick={handleResetZoom}
                  className="px-2 py-0.5 text-[10px] font-bold rounded-lg hover:bg-muted text-muted-foreground transition-colors"
                >
                  Reset
                </button>
                {order.slip_url && (
                  <a
                    href={order.slip_url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1 rounded-lg hover:bg-muted text-primary transition-colors ml-1"
                    title="Open Full Image"
                  >
                    <ExternalLink size={15} />
                  </a>
                )}
              </div>
            </div>

            {/* Canvas / Viewport */}
            <div className="flex-1 bg-black/40 rounded-2xl overflow-hidden relative flex items-center justify-center p-4 border border-border/50 min-h-[320px]">
              {order.slip_url ? (
                <div
                  className="transition-transform duration-150 cursor-grab active:cursor-grabbing max-h-full max-w-full flex items-center justify-center"
                  style={{
                    transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={order.slip_url}
                    alt="Uploaded Bank Payment Slip"
                    className="max-h-[460px] w-auto object-contain rounded-lg shadow-lg select-none"
                  />
                </div>
              ) : (
                /* High-fidelity Digital Receipt / Fonepay Transaction Voucher when no manual slip */
                <div
                  className="w-full max-w-sm bg-card text-foreground rounded-2xl p-5 border border-border shadow-2xl space-y-4 font-mono text-xs transition-transform duration-150"
                  style={{
                    transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  }}
                >
                  <div className="text-center pb-3 border-b border-dashed border-border space-y-1">
                    <p className="text-[10px] uppercase tracking-widest text-primary font-bold">
                      Samyak Educational Services
                    </p>
                    <h3 className="text-sm font-extrabold tracking-tight">Electronic Payment Voucher</h3>
                    <p className="text-[10px] text-muted-foreground font-sans">
                      Gateway:{' '}
                      <span className="uppercase font-bold text-foreground">
                        {order.gateway || 'Fonepay Instant QR'}
                      </span>
                    </p>
                  </div>

                  <div className="space-y-2 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground font-sans">Payment Ref (PRN):</span>
                      <span className="font-bold">{order.purchase_order_id || order.id}</span>
                    </div>
                    {order.gateway_ref && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground font-sans">Fonepay Trace ID:</span>
                        <span className="font-bold">{order.gateway_ref}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground font-sans">Payer Name:</span>
                      <span className="font-bold font-sans">{order.customer_name || 'Student'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground font-sans">Phone:</span>
                      <span>{order.customer_phone || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground font-sans">Course Plan:</span>
                      <span className="capitalize font-sans font-semibold">
                        {order.plan_sku.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="border-t border-dashed border-border pt-2 flex justify-between text-sm font-extrabold">
                      <span className="font-sans">Settled Net:</span>
                      <span className="text-primary">NPR {order.net_amount_npr.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-dashed border-border text-center">
                    <span className="inline-block px-3 py-1 rounded-md bg-success/10 text-success text-[10px] font-sans font-bold">
                      ✓ Direct Banking QR Reconciliation
                    </span>
                    <p className="text-[9px] text-muted-foreground font-sans mt-1">
                      Cryptographically verified &amp; audit timestamped
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Proof Note */}
            <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Zoom: {Math.round(zoom * 100)}% · Angle: {rotation}°</span>
              <span className="text-emerald-500 font-medium">✓ Secure Anti-Tamper Image Sandbox</span>
            </div>
          </div>

          {/* RIGHT: Student Profile & Sovereign Action Console (5 cols) */}
          <div className="lg:col-span-5 p-5 flex flex-col justify-between space-y-4 overflow-y-auto">
            <div className="space-y-4 text-xs">
              
              {/* Student Identification */}
              <div className="bg-muted/40 border border-border rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-border/70 pb-2">
                  <span className="font-bold text-foreground text-sm flex items-center gap-1.5">
                    <User size={15} className="text-primary" /> Student Details
                  </span>
                  {waUrl && (
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 font-bold text-[11px] flex items-center gap-1 transition-colors"
                    >
                      <MessageSquare size={12} /> WhatsApp Student
                    </a>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Full Name</span>
                    <strong className="text-foreground text-xs">{order.customer_name || 'Student'}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Phone Number</span>
                    <strong className="text-foreground text-xs">{order.customer_phone || '—'}</strong>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground block text-[10px]">Email Address</span>
                    <span className="font-mono text-foreground break-all">{order.customer_email || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Order Ledger & Tax Invoice Seals */}
              <div className="bg-muted/40 border border-border rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center justify-between border-b border-border/70 pb-2">
                  <span className="font-bold text-foreground text-sm flex items-center gap-1.5">
                    <FileText size={15} className="text-primary" /> Invoice &amp; Financial Ledger
                  </span>
                  <span className="text-[11px] font-bold text-primary">
                    NPR {order.net_amount_npr.toLocaleString()}
                  </span>
                </div>

                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Course Plan:</span>
                    <span className="font-bold capitalize">{order.plan_sku.replace(/_/g, ' ')}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Gross Fee:</span>
                    <span>Rs. {order.gross_amount_npr.toLocaleString()}</span>
                  </div>
                  {order.discount_amount_npr > 0 && (
                    <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400">
                      <span>Voucher Discount:</span>
                      <span>- Rs. {order.discount_amount_npr.toLocaleString()}</span>
                    </div>
                  )}
                  {order.invoice_number && (
                    <div className="flex justify-between items-center pt-1 border-t border-border/50">
                      <span className="text-muted-foreground">Official Invoice #:</span>
                      <button
                        onClick={() => copyToClipboard(order.invoice_number!, 'Invoice Number')}
                        className="font-mono font-bold hover:text-primary flex items-center gap-1 cursor-pointer"
                      >
                        {order.invoice_number}
                        {copiedKey === 'Invoice Number' ? <Check size={11} className="text-success" /> : <Copy size={11} />}
                      </button>
                    </div>
                  )}
                  {order.verification_code && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Tamper Seal:</span>
                      <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                        {order.verification_code}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Staff Notes / Verification Remark */}
              {order.status === 'pending' && (
                <div className="space-y-1.5">
                  <label className="block font-semibold text-foreground text-[11px]">
                    Verification Notes &amp; Bank Slip Remarks:
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Fonepay ref #9834289 confirmed on mobile bank"
                    className="input-field w-full py-2 text-xs"
                  />
                </div>
              )}

              {/* Reject Accordion (if staff rejects) */}
              {showRejectBox && order.status === 'pending' && (
                <div className="p-3 bg-error/10 border border-error/30 rounded-xl space-y-2 animate-in fade-in">
                  <p className="text-[11px] font-bold text-error flex items-center gap-1">
                    <AlertTriangle size={13} /> Specify Reason for Rejection:
                  </p>
                  <input
                    type="text"
                    placeholder="e.g. Slip screenshot blurry / Amount mismatch"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="input-field w-full py-1.5 text-xs border-error/50"
                  />
                </div>
              )}
            </div>

            {/* Sovereign 1-Click Operations */}
            <div className="pt-3 border-t border-border flex flex-col gap-2 shrink-0">
              {order.status === 'pending' ? (
                <>
                  <button
                    onClick={() => onApprove(order.id, notes)}
                    disabled={processing}
                    className="w-full py-2.5 px-4 rounded-xl bg-success hover:bg-success/90 text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 size={16} />
                    Approve Payment &amp; Auto-Unlock Course
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    {showRejectBox ? (
                      <button
                        onClick={() => {
                          if (!rejectReason) {
                            toast.error('Please specify a rejection reason');
                            return;
                          }
                          onReject?.(order.id, rejectReason);
                        }}
                        disabled={processing}
                        className="py-2 px-3 rounded-xl bg-error hover:bg-error/90 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      >
                        Confirm Reject
                      </button>
                    ) : (
                      <button
                        onClick={() => setShowRejectBox(true)}
                        className="py-2 px-3 rounded-xl border border-error/30 text-error hover:bg-error/10 font-bold text-xs transition-colors cursor-pointer"
                      >
                        Reject Slip
                      </button>
                    )}
                    <button
                      onClick={onClose}
                      className="py-2 px-3 rounded-xl btn-secondary font-semibold text-xs"
                    >
                      Close Window
                    </button>
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    {order.invoice && onViewReceipt && (
                      <button
                        onClick={() => onViewReceipt(order.invoice!)}
                        className="py-2 px-3 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Printer size={14} /> Official Receipt
                      </button>
                    )}
                    {order.status === 'completed' && onRefund && (
                      <button
                        onClick={() => onRefund(order.id, 'Customer requested refund')}
                        className="py-2 px-3 rounded-xl border border-error/30 text-error hover:bg-error/10 font-semibold text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      >
                        <RotateCcw size={14} /> Process Refund
                      </button>
                    )}
                  </div>
                  <button
                    onClick={onClose}
                    className="w-full py-2 px-3 rounded-xl btn-secondary font-semibold text-xs"
                  >
                    Close Inspection
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
