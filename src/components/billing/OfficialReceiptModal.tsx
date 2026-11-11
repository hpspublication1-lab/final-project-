import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { X, Printer, Download, Check, Copy, Loader2, ShieldCheck, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import type { BillingInvoiceRecord } from '@/lib/billing/invoiceEngine';
import { COMPANY_BILLING_CONFIG, getPanDigitsBoxed } from '@/lib/billing/companyConfig';

interface OfficialReceiptModalProps {
  invoice: BillingInvoiceRecord | null;
  onClose: () => void;
}

const PAN_DIGITS = getPanDigitsBoxed();

/**
 * Converts an ISO/AD date into an approximate Bikram Sambat (B.S.) Miti string (YYYY-MM-DD)
 * for authentic Nepalese accounting presentation.
 */
function formatBsMiti(isoDate?: string | null): string {
  const d = isoDate ? new Date(isoDate) : new Date();
  const valid = Number.isNaN(d.getTime()) ? new Date() : d;
  // Approximate BS offset: +56 years, +8 months, +16 days
  const bsDate = new Date(valid.getTime() + (56 * 365.25 + 8 * 30.44 + 16) * 86400 * 1000);
  const yyyy = bsDate.getUTCFullYear();
  const mm = String(bsDate.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(bsDate.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function formatAdDate(isoDate?: string | null): string {
  const d = isoDate ? new Date(isoDate) : new Date();
  const valid = Number.isNaN(d.getTime()) ? new Date() : d;
  return valid.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatNprCurrency(amount: number | undefined | null): string {
  const num = Number(amount) || 0;
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Generates a deterministic 13x13 QR-style matrix from the invoice signatureHash
 * so the printed voucher carries a scannable-style visual control matrix without external network calls.
 */
function DeterministicQrMatrix({ seed }: { seed: string }) {
  const size = 13;
  const cleanSeed = (seed || '8f4a92c1e7b309d4a612f8c901e2b3d4').padEnd(64, 'a');

  const isFinderPattern = (r: number, c: number) => {
    const inTopLeft = r < 4 && c < 4;
    const inTopRight = r < 4 && c >= size - 4;
    const inBottomLeft = r >= size - 4 && c < 4;
    return inTopLeft || inTopRight || inBottomLeft;
  };

  const getFinderBit = (r: number, c: number) => {
    const lr = r >= size - 4 ? r - (size - 4) : r;
    const lc = c >= size - 4 ? c - (size - 4) : c;
    if (lr === 0 || lr === 3 || lc === 0 || lc === 3) return true;
    if (lr >= 1 && lr <= 2 && lc >= 1 && lc <= 2) return true;
    return false;
  };

  const cells: boolean[][] = [];
  for (let r = 0; r < size; r++) {
    const row: boolean[] = [];
    for (let c = 0; c < size; c++) {
      if (isFinderPattern(r, c)) {
        row.push(getFinderBit(r, c));
      } else {
        const idx = (r * size + c) % cleanSeed.length;
        const charCode = cleanSeed.charCodeAt(idx) + r * 7 + c * 13;
        row.push(charCode % 2 === 0);
      }
    }
    cells.push(row);
  }

  return (
    <svg
      width="68"
      height="68"
      viewBox={`0 0 ${size} ${size}`}
      className="border border-slate-900 p-1 bg-white shrink-0"
      aria-label="Electronic Billing Verification Matrix"
    >
      {cells.map((row, rIdx) =>
        row.map((filled, cIdx) =>
          filled ? (
            <rect key={`${rIdx}-${cIdx}`} x={cIdx} y={rIdx} width={1} height={1} fill="#0f172a" />
          ) : null
        )
      )}
    </svg>
  );
}

function ScannableReceiptQr({
  invoiceNumber,
  verificationCode,
}: {
  invoiceNumber: string;
  verificationCode: string;
}) {
  const [qrSrc, setQrSrc] = useState<string | null>(null);

  useEffect(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://samyak.edu.np';
    const verifyUrl = `${origin}/verify-receipt?inv=${encodeURIComponent(invoiceNumber)}&code=${encodeURIComponent(verificationCode)}`;
    QRCode.toDataURL(verifyUrl, { width: 140, margin: 1, errorCorrectionLevel: 'M' })
      .then((url) => setQrSrc(url))
      .catch(() => {});
  }, [invoiceNumber, verificationCode]);

  if (!qrSrc) {
    return <DeterministicQrMatrix seed={verificationCode} />;
  }

  return (
    <a
      href={`/verify-receipt?inv=${encodeURIComponent(invoiceNumber)}&code=${encodeURIComponent(verificationCode)}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-block border border-slate-900 bg-white p-0.5 shrink-0 hover:opacity-90 transition-opacity"
      title="Click or scan with phone camera to verify authenticity"
    >
      <img
        src={qrSrc}
        alt="Scan to verify invoice"
        width={68}
        height={68}
        className="block"
      />
    </a>
  );
}

export function buildStandaloneReceiptHtml(invoice: BillingInvoiceRecord): string {
  const grossNpr = invoice.grossAmountNpr ?? invoice.netAmountNpr ?? 0;
  const discountNpr = invoice.discountAmountNpr ?? 0;
  const taxNpr = invoice.taxAmountNpr ?? 0;
  const netNpr = invoice.netAmountNpr ?? 0;
  const taxableNpr = Math.max(0, grossNpr - discountNpr);
  const adDate = formatAdDate(invoice.paidAt || invoice.issuedAt);
  const bsMiti = formatBsMiti(invoice.paidAt || invoice.issuedAt);
  const isPaid = invoice.status === 'paid';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Tax Invoice ${invoice.invoiceNumber} - Samyak Education & Research Academy Pvt. Ltd.</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: 'Georgia', 'Times New Roman', serif;
      background: #e2e8f0;
      color: #0f172a;
      margin: 0;
      padding: 28px 16px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .voucher {
      max-width: 820px;
      margin: 0 auto;
      background: #ffffff;
      border: 2px solid #0f172a;
      padding: 28px 32px;
      box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12);
    }
    .mono {
      font-family: 'Courier New', Courier, monospace;
      font-variant-numeric: tabular-nums;
    }
    .sans {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
    }
    .top-bar {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 14px;
      margin-bottom: 14px;
    }
    .co-name {
      font-size: 19px;
      font-weight: 700;
      letter-spacing: 0.02em;
      text-transform: uppercase;
      color: #0f172a;
    }
    .co-sub {
      font-size: 11.5px;
      color: #334155;
      margin-top: 3px;
      line-height: 1.45;
    }
    .pan-wrap {
      text-align: right;
    }
    .pan-label {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      margin-bottom: 4px;
    }
    .pan-boxes {
      display: inline-flex;
      border: 1px solid #0f172a;
    }
    .pan-boxes span {
      width: 19px;
      height: 21px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 700;
      border-right: 1px solid #0f172a;
    }
    .pan-boxes span:last-child { border-right: none; }
    .doc-banner {
      text-align: center;
      margin: 10px 0 14px;
    }
    .doc-title {
      display: inline-block;
      border: 1.5px solid #0f172a;
      padding: 4px 18px;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      background: #f8fafc;
    }
    table.meta-grid, table.ledger {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }
    table.meta-grid td {
      border: 1px solid #475569;
      padding: 8px 10px;
      vertical-align: top;
      width: 50%;
    }
    .meta-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 4px;
      line-height: 1.4;
    }
    .meta-row:last-child { margin-bottom: 0; }
    .meta-k { color: #475569; font-weight: 600; }
    .meta-v { color: #0f172a; font-weight: 700; text-align: right; }
    table.ledger {
      margin-top: 14px;
    }
    table.ledger th {
      border: 1px solid #0f172a;
      background: #f1f5f9;
      padding: 7px 8px;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      text-align: left;
    }
    table.ledger td {
      border: 1px solid #475569;
      padding: 8px;
      vertical-align: top;
    }
    .num { text-align: right; font-variant-numeric: tabular-nums; }
    .center { text-align: center; }
    .sigs {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-top: 34px;
      padding-top: 12px;
      font-size: 11.5px;
    }
    .sig-line {
      border-top: 1px solid #0f172a;
      padding-top: 5px;
      min-width: 190px;
      text-align: center;
      font-weight: 600;
    }
    .stamp-box {
      border: 2px double #1e3a8a;
      color: #1e3a8a;
      padding: 6px 14px;
      font-size: 10.5px;
      font-weight: 700;
      text-align: center;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      transform: rotate(-4deg);
    }
    .footnote {
      margin-top: 16px;
      border-top: 1px solid #94a3b8;
      padding-top: 8px;
      font-size: 10.5px;
      color: #475569;
      display: flex;
      justify-content: space-between;
    }
    @media print {
      body { background: #ffffff; padding: 0; }
      .voucher { box-shadow: none; max-width: 100%; }
    }
  </style>
</head>
<body>
  <div class="voucher">
    <div class="top-bar">
      <div>
        <div class="co-name">${COMPANY_BILLING_CONFIG.legalName}</div>
        <div class="co-sub sans">
          ${COMPANY_BILLING_CONFIG.addressLine1}, ${COMPANY_BILLING_CONFIG.addressLine2}<br/>
          Tel: ${COMPANY_BILLING_CONFIG.phone} &bull; Email: ${COMPANY_BILLING_CONFIG.email} &bull; Web: ${COMPANY_BILLING_CONFIG.website}
        </div>
      </div>
      <div class="pan-wrap sans">
        <div class="pan-label">Seller PAN / VAT Reg. No.</div>
        <div class="pan-boxes mono">
          ${PAN_DIGITS.map((d) => `<span>${d}</span>`).join('')}
        </div>
        <div style="font-size:10px;color:#475569;margin-top:5px;">Regd. No: ${COMPANY_BILLING_CONFIG.registrationNumber}</div>
      </div>
    </div>

    <div class="doc-banner sans">
      <span class="doc-title">TAX INVOICE / OFFICIAL FEE RECEIPT</span>
      <div style="font-size:10.5px;color:#475569;margin-top:4px;">
        ${isPaid ? 'CUSTOMER ORIGINAL COPY — PAID & SETTLED' : `VOUCHER STATUS: ${invoice.status.toUpperCase()}`}
      </div>
    </div>

    <table class="meta-grid sans">
      <tr>
        <td>
          <div class="meta-row"><span class="meta-k">Invoice No.:</span><span class="meta-v mono">${invoice.invoiceNumber}</span></div>
          <div class="meta-row"><span class="meta-k">Money Receipt No.:</span><span class="meta-v mono">${invoice.receiptNumber || 'N/A'}</span></div>
          <div class="meta-row"><span class="meta-k">Student / Buyer Name:</span><span class="meta-v">${invoice.customerName}</span></div>
          <div class="meta-row"><span class="meta-k">Registered Email:</span><span class="meta-v">${invoice.customerEmail || 'N/A'}</span></div>
          <div class="meta-row"><span class="meta-k">Contact Phone:</span><span class="meta-v mono">${invoice.customerPhone || 'N/A'}</span></div>
          <div class="meta-row"><span class="meta-k">Buyer PAN:</span><span class="meta-v">Individual (Student)</span></div>
        </td>
        <td>
          <div class="meta-row"><span class="meta-k">Fiscal Year (B.S.):</span><span class="meta-v mono">${invoice.fiscalYearBs}</span></div>
          <div class="meta-row"><span class="meta-k">Transaction Date (A.D.):</span><span class="meta-v mono">${adDate}</span></div>
          <div class="meta-row"><span class="meta-k">Transaction Miti (B.S.):</span><span class="meta-v mono">${bsMiti}</span></div>
          <div class="meta-row"><span class="meta-k">Payment Mode:</span><span class="meta-v">${invoice.gateway.toUpperCase()} ELECTRONIC</span></div>
          <div class="meta-row"><span class="meta-k">Merchant PRN / Ref.:</span><span class="meta-v mono">${invoice.purchaseOrderId}</span></div>
          <div class="meta-row"><span class="meta-k">Gateway Trace ID:</span><span class="meta-v mono">${invoice.gatewayRef || invoice.sourceId.slice(0, 14)}</span></div>
        </td>
      </tr>
    </table>

    <table class="ledger sans">
      <thead>
        <tr>
          <th style="width:42px;" class="center">S.N.</th>
          <th style="width:115px;">HS / Course Code</th>
          <th>Particulars / Academic Service Description</th>
          <th style="width:52px;" class="center">Qty</th>
          <th style="width:110px;" class="num">Rate (NPR)</th>
          <th style="width:120px;" class="num">Amount (NPR)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="center mono">1.</td>
          <td class="mono">${invoice.itemSku || 'EDU-BATCH'}</td>
          <td>
            <strong>${invoice.itemTitle}</strong><br/>
            <span style="font-size:11px;color:#475569;">
              Academic Access Validity: ${invoice.durationDays || 365} Days &bull; Plan Tier: ${(invoice.planTier || 'pro').toUpperCase()}
              ${invoice.notes ? `<br/>Remarks: ${invoice.notes}` : ''}
            </span>
          </td>
          <td class="center mono">1</td>
          <td class="num mono">${formatNprCurrency(grossNpr)}</td>
          <td class="num mono"><strong>${formatNprCurrency(grossNpr)}</strong></td>
        </tr>
        <tr>
          <td class="center mono" style="height:28px;">&nbsp;</td>
          <td></td>
          <td style="font-size:10.5px;color:#64748b;font-style:italic;">-- End of Academic Line Items --</td>
          <td></td>
          <td></td>
          <td></td>
        </tr>
        <tr>
          <td colspan="3" rowspan="5" style="vertical-align:top;padding:10px;">
            <div style="margin-bottom:8px;">
              <span style="font-size:10.5px;font-weight:700;text-transform:uppercase;color:#475569;">In Words (NPR):</span><br/>
              <strong style="font-size:12px;">${invoice.amountInWords}</strong>
            </div>
            <div style="border-top:1px dashed #94a3b8;padding-top:8px;margin-top:8px;font-size:10.5px;color:#334155;">
              <div><strong>CBMS / Electronic Billing Control:</strong> <span class="mono">${invoice.verificationCode}</span></div>
              <div class="mono" style="font-size:9.5px;color:#475569;word-break:break-all;margin-top:2px;">
                HMAC-SHA256: ${invoice.signatureHash}
              </div>
            </div>
          </td>
          <td colspan="2" class="num" style="font-weight:600;">Sub-Total (Gross Fee)</td>
          <td class="num mono">${formatNprCurrency(grossNpr)}</td>
        </tr>
        <tr>
          <td colspan="2" class="num" style="font-weight:600;">Less: Scholarship / Rebate</td>
          <td class="num mono">${discountNpr > 0 ? `(${formatNprCurrency(discountNpr)})` : '0.00'}</td>
        </tr>
        <tr>
          <td colspan="2" class="num" style="font-weight:600;">Taxable Amount</td>
          <td class="num mono">${formatNprCurrency(taxableNpr)}</td>
        </tr>
        <tr>
          <td colspan="2" class="num" style="font-weight:600;">Education Tax / VAT (0%)</td>
          <td class="num mono">${formatNprCurrency(taxNpr)}</td>
        </tr>
        <tr style="background:#f8fafc;">
          <td colspan="2" class="num" style="font-weight:700;font-size:12.5px;">Grand Total Paid (NPR)</td>
          <td class="num mono" style="font-weight:700;font-size:13px;">${formatNprCurrency(netNpr)}</td>
        </tr>
      </tbody>
    </table>

    <div class="sigs sans">
      <div class="sig-line">
        Received By (Student / Payee)
      </div>
      <div class="stamp-box">
        Samyak Education &amp; Research Academy<br/>
        Accounts Dept &bull; Kathmandu<br/>
        <strong>${isPaid ? 'PAID & VERIFIED' : invoice.status.toUpperCase()}</strong>
      </div>
      <div class="sig-line">
        For: Samyak Academy Pvt. Ltd.<br/>
        <span style="font-size:10px;font-weight:400;color:#475569;">Authorized Signatory</span>
      </div>
    </div>

    <div class="footnote sans">
      <span>E. &amp; O. E. &bull; Issued pursuant to Electronic Transactions Act, 2063 (Nepal).</span>
      <span class="mono">Printed: ${new Date().toISOString().slice(0, 19).replace('T', ' ')} UTC</span>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Reusable Paper-Grade Nepal IRD / Corporate Accounting Tax Invoice & Fee Receipt Sheet.
 * Designed to look like a real physical accounting document rather than a generic web card.
 */
export function OfficialReceiptPaper({
  invoice,
  onVerifyLive,
  verifying = false,
  verifiedAt = null,
}: {
  invoice: BillingInvoiceRecord;
  onVerifyLive?: () => void;
  verifying?: boolean;
  verifiedAt?: string | null;
}) {
  const [copiedCode, setCopiedCode] = useState(false);

  const isPaid = invoice.status === 'paid';
  const isRefunded = invoice.status === 'refunded';

  const grossNpr = invoice.grossAmountNpr ?? invoice.netAmountNpr ?? 0;
  const discountNpr = invoice.discountAmountNpr ?? 0;
  const taxNpr = invoice.taxAmountNpr ?? 0;
  const netNpr = invoice.netAmountNpr ?? 0;
  const taxableNpr = Math.max(0, grossNpr - discountNpr);

  const adDate = formatAdDate(invoice.paidAt || invoice.issuedAt);
  const bsMiti = formatBsMiti(invoice.paidAt || invoice.issuedAt);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(invoice.verificationCode);
    setCopiedCode(true);
    toast.success('Control code copied to clipboard');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="bg-white text-slate-950 border-2 border-slate-900 p-5 sm:p-8 shadow-md print:shadow-none print:border-slate-900 selection:bg-slate-200">
      {/* Top Corporate & IRD PAN Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b-2 border-slate-900 pb-4">
        <div>
          <h2
            className="text-base sm:text-lg font-bold uppercase tracking-wide text-slate-950"
            style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
          >
            {COMPANY_BILLING_CONFIG.legalName}
          </h2>
          <p className="text-[11px] text-slate-700 mt-0.5 leading-relaxed">
            {COMPANY_BILLING_CONFIG.addressLine1}, {COMPANY_BILLING_CONFIG.addressLine2}
            <br />
            Tel: {COMPANY_BILLING_CONFIG.phone} &bull; Email: {COMPANY_BILLING_CONFIG.email} &bull; Web:{' '}
            {COMPANY_BILLING_CONFIG.website}
          </p>
        </div>

        {/* Authentic 9-Box Nepal PAN / VAT Grid */}
        <div className="md:text-right shrink-0">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-800 mb-1">
            Seller PAN / VAT Reg. No.
          </div>
          <div className="inline-flex border border-slate-900 bg-slate-50 font-mono text-xs font-bold text-slate-950">
            {PAN_DIGITS.map((digit, idx) => (
              <span
                key={idx}
                className="w-5 h-5 flex items-center justify-center border-r border-slate-900 last:border-r-0"
              >
                {digit}
              </span>
            ))}
          </div>
          <div className="text-[10px] text-slate-600 mt-1 font-mono">
            Regd. No: {COMPANY_BILLING_CONFIG.registrationNumber}
          </div>
        </div>
      </div>

      {/* Document Type Banner */}
      <div className="text-center my-3">
        <div className="inline-block border border-slate-900 bg-slate-100 px-5 py-1 text-xs font-bold uppercase tracking-widest text-slate-950">
          Tax Invoice / Official Fee Receipt
        </div>
        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 mt-1">
          {isPaid
            ? 'Customer Original Copy — Account Settled'
            : isRefunded
            ? 'Credit / Refunded Voucher Copy'
            : 'Provisional Unpaid Voucher'}
        </div>
      </div>

      {/* Ruled 2-Column Party & Transaction Metadata Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 border border-slate-800 text-[11.5px] leading-snug">
        <div className="p-3 border-b md:border-b-0 md:border-r border-slate-800 space-y-1">
          <div className="flex justify-between gap-2">
            <span className="text-slate-600 font-semibold">Invoice No.:</span>
            <span className="font-mono font-bold text-slate-950">{invoice.invoiceNumber}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-slate-600 font-semibold">Receipt No.:</span>
            <span className="font-mono font-bold text-slate-950">
              {invoice.receiptNumber || 'PENDING'}
            </span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-slate-600 font-semibold">Student / Buyer Name:</span>
            <span className="font-bold text-slate-950 text-right">{invoice.customerName}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-slate-600 font-semibold">Registered Email:</span>
            <span className="text-slate-900 text-right truncate max-w-[210px]">
              {invoice.customerEmail || 'N/A'}
            </span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-slate-600 font-semibold">Contact No.:</span>
            <span className="font-mono text-slate-900">{invoice.customerPhone || 'N/A'}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-slate-600 font-semibold">Buyer PAN:</span>
            <span className="text-slate-700">Individual (Student Enrollment)</span>
          </div>
        </div>

        <div className="p-3 space-y-1">
          <div className="flex justify-between gap-2">
            <span className="text-slate-600 font-semibold">Fiscal Year (B.S.):</span>
            <span className="font-mono font-bold text-slate-950">{invoice.fiscalYearBs}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-slate-600 font-semibold">Invoice Date (A.D.):</span>
            <span className="font-mono text-slate-950">{adDate}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-slate-600 font-semibold">Invoice Miti (B.S.):</span>
            <span className="font-mono text-slate-950">{bsMiti} B.S.</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-slate-600 font-semibold">Payment Mode:</span>
            <span className="font-bold uppercase text-slate-950">
              {invoice.gateway} Electronic
            </span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-slate-600 font-semibold">Merchant Order / PRN:</span>
            <span className="font-mono font-semibold text-slate-950">
              {invoice.purchaseOrderId}
            </span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-slate-600 font-semibold">Gateway Trace ID:</span>
            <span className="font-mono text-slate-800">
              {invoice.gatewayRef || invoice.sourceId.slice(0, 14).toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Ruled Particulars & Accounting Table */}
      <div className="mt-3 overflow-x-auto">
        <table className="w-full border-collapse border border-slate-900 text-xs">
          <thead>
            <tr className="bg-slate-100 text-slate-900 uppercase text-[10.5px] font-bold tracking-wider">
              <th className="border border-slate-800 py-2 px-2 text-center w-10">S.N.</th>
              <th className="border border-slate-800 py-2 px-2.5 text-left w-28">HS / Code</th>
              <th className="border border-slate-800 py-2 px-3 text-left">
                Particulars / Academic Service Description
              </th>
              <th className="border border-slate-800 py-2 px-2 text-center w-12">Qty</th>
              <th className="border border-slate-800 py-2 px-2.5 text-right w-28">Rate (NPR)</th>
              <th className="border border-slate-800 py-2 px-2.5 text-right w-28">Amount (NPR)</th>
            </tr>
          </thead>
          <tbody className="text-slate-900">
            <tr>
              <td className="border border-slate-800 py-2.5 px-2 text-center font-mono align-top">
                1.
              </td>
              <td className="border border-slate-800 py-2.5 px-2.5 font-mono text-[11px] align-top">
                {invoice.itemSku || 'EDU-BATCH'}
              </td>
              <td className="border border-slate-800 py-2.5 px-3 align-top">
                <div className="font-bold text-slate-950">{invoice.itemTitle}</div>
                <div className="text-[11px] text-slate-600 mt-0.5">
                  Course Access Validity: {invoice.durationDays || 365} Days &bull; Tier:{' '}
                  {(invoice.planTier || 'Pro').toUpperCase()}
                  {invoice.notes ? ` • ${invoice.notes}` : ''}
                </div>
              </td>
              <td className="border border-slate-800 py-2.5 px-2 text-center font-mono align-top">
                1
              </td>
              <td className="border border-slate-800 py-2.5 px-2.5 text-right font-mono tabular-nums align-top">
                {formatNprCurrency(grossNpr)}
              </td>
              <td className="border border-slate-800 py-2.5 px-2.5 text-right font-mono font-bold tabular-nums align-top">
                {formatNprCurrency(grossNpr)}
              </td>
            </tr>

            {/* Blank Ledger Spacer Row for Authentic Printed Voucher Proportions */}
            <tr className="h-7">
              <td className="border border-slate-800 px-2 text-center font-mono text-slate-400">
                &nbsp;
              </td>
              <td className="border border-slate-800 px-2.5"></td>
              <td className="border border-slate-800 px-3 text-[10.5px] italic text-slate-500">
                -- Nothing Follows --
              </td>
              <td className="border border-slate-800 px-2"></td>
              <td className="border border-slate-800 px-2.5"></td>
              <td className="border border-slate-800 px-2.5"></td>
            </tr>

            {/* Split Footer: Left = Words + CBMS QR Control; Right = Numeric Subtotals */}
            <tr>
              <td
                colSpan={3}
                rowSpan={5}
                className="border border-slate-800 p-3 align-top bg-slate-50/50"
              >
                <div className="mb-2.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">
                    Amount in Words (NPR):
                  </span>
                  <span
                    className="text-xs font-bold text-slate-950"
                    style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                  >
                    {invoice.amountInWords}
                  </span>
                </div>

                {/* Electronic Billing Control & QR Block */}
                <div className="pt-2.5 border-t border-dashed border-slate-400 flex items-start gap-3">
                  <ScannableReceiptQr
                    invoiceNumber={invoice.invoiceNumber}
                    verificationCode={invoice.verificationCode}
                  />
                  <div className="space-y-1 text-[10.5px] min-w-0 flex-1">
                    <div className="font-bold uppercase tracking-wider text-slate-800">
                      CBMS / E-Billing Control Seal
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-slate-600">Control Code:</span>
                      <code className="font-mono font-bold text-slate-950 bg-slate-200/80 px-1.5 py-0.5 border border-slate-400">
                        {invoice.verificationCode}
                      </code>
                      <button
                        type="button"
                        onClick={handleCopyCode}
                        className="px-1.5 py-0.5 border border-slate-400 bg-white hover:bg-slate-100 text-[10px] font-semibold text-slate-800 inline-flex items-center gap-1 cursor-pointer print:hidden"
                      >
                        {copiedCode ? <Check size={10} /> : <Copy size={10} />}
                        <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                      </button>
                      {onVerifyLive && (
                        <button
                          type="button"
                          onClick={onVerifyLive}
                          disabled={verifying}
                          className="px-2 py-0.5 border border-slate-900 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-semibold inline-flex items-center gap-1 cursor-pointer print:hidden"
                        >
                          {verifying ? (
                            <Loader2 size={10} className="animate-spin" />
                          ) : (
                            <ShieldCheck size={10} />
                          )}
                          <span>{verifiedAt ? 'Verified Authentic' : 'Verify Online'}</span>
                        </button>
                      )}
                    </div>
                    <div className="font-mono text-[9.5px] text-slate-500 break-all leading-tight">
                      SHA256: {invoice.signatureHash}
                    </div>
                  </div>
                </div>
              </td>
              <td
                colSpan={2}
                className="border border-slate-800 py-1.5 px-2.5 text-right font-semibold text-slate-700"
              >
                Sub-Total (Gross Fee)
              </td>
              <td className="border border-slate-800 py-1.5 px-2.5 text-right font-mono tabular-nums">
                {formatNprCurrency(grossNpr)}
              </td>
            </tr>
            <tr>
              <td
                colSpan={2}
                className="border border-slate-800 py-1.5 px-2.5 text-right font-semibold text-slate-700"
              >
                Less: Scholarship / Rebate
              </td>
              <td className="border border-slate-800 py-1.5 px-2.5 text-right font-mono tabular-nums">
                {discountNpr > 0 ? `(${formatNprCurrency(discountNpr)})` : '0.00'}
              </td>
            </tr>
            <tr>
              <td
                colSpan={2}
                className="border border-slate-800 py-1.5 px-2.5 text-right font-semibold text-slate-700"
              >
                Taxable Tuition Amount
              </td>
              <td className="border border-slate-800 py-1.5 px-2.5 text-right font-mono tabular-nums">
                {formatNprCurrency(taxableNpr)}
              </td>
            </tr>
            <tr>
              <td
                colSpan={2}
                className="border border-slate-800 py-1.5 px-2.5 text-right font-semibold text-slate-700"
              >
                Education Tax / VAT (0%)
              </td>
              <td className="border border-slate-800 py-1.5 px-2.5 text-right font-mono tabular-nums">
                {formatNprCurrency(taxNpr)}
              </td>
            </tr>
            <tr className="bg-slate-100 font-bold text-slate-950">
              <td colSpan={2} className="border border-slate-900 py-2 px-2.5 text-right text-xs">
                Grand Total Paid (NPR)
              </td>
              <td className="border border-slate-900 py-2 px-2.5 text-right font-mono text-xs tabular-nums">
                {formatNprCurrency(netNpr)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Authentic Accounting Signatures & Ink Rubber Stamp Row */}
      <div className="mt-8 pt-2 grid grid-cols-1 sm:grid-cols-3 items-end gap-6 text-[11px] text-slate-800">
        {/* Student / Payee Signature Line */}
        <div className="text-center sm:text-left">
          <div className="h-10 flex items-end justify-center sm:justify-start pb-1 text-slate-500 font-mono text-[10px]">
            [Electronically Acknowledged]
          </div>
          <div className="border-t border-slate-900 pt-1 font-semibold inline-block min-w-[180px] text-center">
            Received By (Student / Payee)
          </div>
        </div>

        {/* Official Blue Ink Circular Rubber Stamp */}
        <div className="flex justify-center">
          <div
            className="border-2 border-double border-blue-900 text-blue-900 px-3.5 py-1.5 text-center uppercase tracking-wider select-none"
            style={{ transform: 'rotate(-4deg)' }}
          >
            <div className="text-[9px] font-bold">{COMPANY_BILLING_CONFIG.tradeName}</div>
            <div className="text-[11px] font-black border-y border-blue-900 my-0.5 py-0.5">
              {isPaid ? 'PAID & VERIFIED' : invoice.status.toUpperCase()}
            </div>
            <div className="text-[8.5px] font-semibold">{COMPANY_BILLING_CONFIG.stampHeader}</div>
          </div>
        </div>

        {/* Authorized Signatory with Pen Signature */}
        <div className="text-center sm:text-right">
          <div className="h-10 flex items-end justify-center sm:justify-end pb-1">
            <svg
              width="125"
              height="32"
              viewBox="0 0 140 36"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-label="Authorized Signature"
            >
              <path
                d="M12 27C22 14 29 8 33 17C36 24 27 29 36 25C45 21 53 10 57 18C60 24 64 15 71 14C78 13 79 23 86 20C94 17 104 9 112 15C117 19 109 25 128 19"
                stroke="#1e3a8a"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M22 31C52 28 88 26 124 25"
                stroke="#1e3a8a"
                strokeWidth="1"
                strokeLinecap="round"
                strokeDasharray="2 2"
              />
            </svg>
          </div>
          <div className="border-t border-slate-900 pt-1 font-semibold inline-block min-w-[190px] text-center">
            For: {COMPANY_BILLING_CONFIG.legalName}
            <span className="block text-[9.5px] font-normal text-slate-600">
              {COMPANY_BILLING_CONFIG.authorizedSignatoryName} ({COMPANY_BILLING_CONFIG.authorizedSignatoryTitle})
            </span>
          </div>
        </div>
      </div>

      {/* Statutory Footnote */}
      <div className="mt-5 pt-2.5 border-t border-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[10px] text-slate-500">
        <span>
          E. &amp; O. E. &bull; Valid without physical signature under the Electronic Transactions Act,
          2063 (Nepal).
        </span>
        <span className="font-mono">Voucher ID: {invoice.invoiceNumber}</span>
      </div>
    </div>
  );
}

export default function OfficialReceiptModal({ invoice, onClose }: OfficialReceiptModalProps) {
  const [verifying, setVerifying] = useState(false);
  const [verifiedAt, setVerifiedAt] = useState<string | null>(null);

  if (!invoice) return null;

  const handleVerifyLive = async () => {
    setVerifying(true);
    try {
      const res = await fetch('/api/billing/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceNumber: invoice.invoiceNumber,
          verificationCode: invoice.verificationCode,
        }),
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        setVerifiedAt(data.verifiedAt || new Date().toISOString());
        toast.success('Invoice control code verified against Samyak Billing Ledger.');
      } else {
        toast.error(data.error || 'Control code verification failed');
      }
    } catch {
      toast.error('Could not reach verification endpoint');
    } finally {
      setVerifying(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadStandaloneReceipt = () => {
    const html = buildStandaloneReceiptHtml(invoice);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Tax_Invoice_${invoice.invoiceNumber}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${invoice.invoiceNumber}`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-2 sm:p-6 overflow-y-auto">
      <div className="bg-slate-200 border border-slate-400 w-full max-w-3xl shadow-2xl overflow-hidden my-auto">
        {/* Top Utility Toolbar (Hidden when printing) */}
        <div className="bg-slate-900 text-white px-4 py-2.5 flex items-center justify-between gap-3 print:hidden">
          <div className="text-xs font-mono font-semibold tracking-wide">
            VOUCHER PREVIEW &bull; {invoice.invoiceNumber}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer size={13} />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={handleDownloadStandaloneReceipt}
              className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download size={13} />
              <span>Download Voucher (.html)</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
              aria-label="Close receipt modal"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Paper Sheet Container */}
        <div className="p-3 sm:p-6 bg-slate-200 print:p-0 print:bg-white max-h-[85vh] overflow-y-auto">
          <OfficialReceiptPaper
            invoice={invoice}
            onVerifyLive={handleVerifyLive}
            verifying={verifying}
            verifiedAt={verifiedAt}
          />
        </div>
      </div>
    </div>
  );
}
