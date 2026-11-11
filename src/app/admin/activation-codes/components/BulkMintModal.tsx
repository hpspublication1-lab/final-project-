'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  Download,
  KeyRound,
  CheckCircle2,
  X,
  Loader2,
  AlertTriangle,
  Copy,
  Check,
  Hash,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

interface BulkMintModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function BulkMintModal({ isOpen, onClose, onSuccess }: BulkMintModalProps) {
  const [batchName, setBatchName] = useState('CEE-BOOK-2082');
  const [count, setCount] = useState<number>(1000);
  const [plan, setPlan] = useState<'student' | 'pro'>('pro');
  const [durationDays, setDurationDays] = useState<number>(365);
  const [expiresInDays, setExpiresInDays] = useState<number>(180);
  const [notes, setNotes] = useState('Offline book publishing & institutional bundle distribution');

  const [loading, setLoading] = useState(false);
  const [mintResult, setMintResult] = useState<{
    batchId: string;
    totalMinted: number;
    csvContent: string;
    sampleCodes: string[];
  } | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleMint = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMintResult(null);

    try {
      const res = await fetch('/api/admin/activation-codes/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchName,
          count,
          plan,
          durationDays,
          expiresInDays,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to mint activation codes');
      }

      setMintResult({
        batchId: data.batchId,
        totalMinted: data.totalMinted,
        csvContent: data.csvContent,
        sampleCodes: data.sampleCodes || [],
      });

      toast.success(`Generated ${data.totalMinted.toLocaleString()} activation codes!`);
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || 'Error generating codes');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCsv = () => {
    if (!mintResult) return;
    const blob = new Blob([mintResult.csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Samyak_${mintResult.batchId}_${mintResult.totalMinted}_Codes.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('CSV downloaded successfully!');
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
    toast.success('Code copied to clipboard');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl p-6 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                10,000 Cryptographic Bulk Codes Minter
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  Base32 + Luhn Checksum
                </span>
              </h2>
              <p className="text-xs text-muted-foreground">
                Generate high-entropy, collision-proof voucher keys for offline books, institutions, and wholesale.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          {!mintResult ? (
            <form onSubmit={handleMint} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Batch Tag / Identifier
                  </label>
                  <input
                    type="text"
                    value={batchName}
                    onChange={(e) => setBatchName(e.target.value.toUpperCase())}
                    placeholder="e.g. CEE-MED-2082"
                    className="input-base w-full font-mono text-sm uppercase"
                    required
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">Embedded into the voucher prefix</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Number of Codes to Mint
                  </label>
                  <div className="flex items-center gap-2">
                    <select
                      value={count}
                      onChange={(e) => setCount(Number(e.target.value))}
                      className="input-base w-full text-sm font-semibold"
                    >
                      <option value={100}>100 Codes (Test Batch)</option>
                      <option value={500}>500 Codes</option>
                      <option value={1000}>1,000 Codes (Standard Batch)</option>
                      <option value={2500}>2,500 Codes</option>
                      <option value={5000}>5,000 Codes</option>
                      <option value={10000}>10,000 Codes (Full Scale Enterprise)</option>
                    </select>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">Zero collisions guaranteed via high entropy</p>
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Subscription Tier
                  </label>
                  <select
                    value={plan}
                    onChange={(e) => setPlan(e.target.value as any)}
                    className="input-base w-full text-sm"
                  >
                    <option value="pro">Pro Plan (All Features)</option>
                    <option value="student">Student Plan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Plan Duration (Days)
                  </label>
                  <select
                    value={durationDays}
                    onChange={(e) => setDurationDays(Number(e.target.value))}
                    className="input-base w-full text-sm"
                  >
                    <option value={30}>30 Days (1 Month)</option>
                    <option value={90}>90 Days (3 Months)</option>
                    <option value={180}>180 Days (6 Months)</option>
                    <option value={365}>365 Days (1 Full Year)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Redemption Expiry
                  </label>
                  <select
                    value={expiresInDays}
                    onChange={(e) => setExpiresInDays(Number(e.target.value))}
                    className="input-base w-full text-sm"
                  >
                    <option value={90}>Expires in 90 Days</option>
                    <option value={180}>Expires in 180 Days (6 mo)</option>
                    <option value={365}>Expires in 1 Year</option>
                    <option value={730}>Expires in 2 Years</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Internal Notes & Allocation
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="input-base w-full text-sm"
                  placeholder="e.g. Bound into physical CEE Question Bank Vol. 1 with Heritage Publications"
                />
              </div>

              <div className="p-3 bg-muted/40 rounded-xl border border-border text-xs text-muted-foreground flex items-center gap-2.5">
                <Sparkles size={16} className="text-primary shrink-0" />
                <span>
                  Codes are generated using non-ambiguous Base32 (no 0/O, 1/I) with a cryptographic verification checksum.
                  Includes automated database chunking and instant Excel/CSV formatting.
                </span>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button type="button" onClick={onClose} className="btn-ghost text-sm">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary text-sm flex items-center gap-2 px-5 py-2.5 font-semibold"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Minting {count.toLocaleString()} Cryptographic Codes...
                    </>
                  ) : (
                    <>
                      <KeyRound size={16} />
                      Mint {count.toLocaleString()} Codes Now
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-start gap-3">
                <CheckCircle2 size={24} className="text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    Bulk Minting Completed Successfully!
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Batch <span className="font-mono font-semibold text-foreground">{mintResult.batchId}</span> created with{' '}
                    <span className="font-semibold text-emerald-500">{mintResult.totalMinted.toLocaleString()}</span> valid activation codes.
                  </p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Sample Verified Codes (with Checksums)
                  </span>
                  <span className="text-xs text-primary font-mono">100% Collision-Proof</span>
                </div>
                <div className="space-y-1.5 bg-muted/40 p-3 rounded-xl border border-border font-mono text-xs">
                  {mintResult.sampleCodes.map((code, idx) => (
                    <div key={idx} className="flex items-center justify-between py-1 border-b border-border/40 last:border-0">
                      <span className="text-foreground font-semibold">{code}</span>
                      <button
                        onClick={() => handleCopy(code)}
                        className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-[11px]"
                      >
                        {copiedCode === code ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                        {copiedCode === code ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-primary/5 rounded-xl border border-primary/20">
                <div className="flex items-center gap-2">
                  <Hash size={18} className="text-primary" />
                  <span className="text-xs font-medium text-foreground">
                    Full CSV ready with serial numbers, plans, and expiry dates
                  </span>
                </div>
                <button
                  onClick={handleDownloadCsv}
                  className="btn-primary text-xs flex items-center gap-1.5 py-1.5 px-3.5"
                >
                  <Download size={14} />
                  Download Full CSV ({mintResult.totalMinted.toLocaleString()} Keys)
                </button>
              </div>

              <div className="pt-2 flex justify-between">
                <button
                  type="button"
                  onClick={() => setMintResult(null)}
                  className="btn-ghost text-xs"
                >
                  ← Mint Another Batch
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-primary text-xs px-4 py-2"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
