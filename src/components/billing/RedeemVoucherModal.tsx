'use client';

import React, { useState } from 'react';
import {
  KeyRound,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  Sparkles,
  ShieldCheck,
  Check,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { verifyCodeChecksum } from '@/lib/billing/bulkActivationCodesEngine';

interface RedeemVoucherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function RedeemVoucherModal({ isOpen, onClose, onSuccess }: RedeemVoucherModalProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [redeemSuccess, setRedeemSuccess] = useState<{
    plan: string;
    durationDays: number;
    expiresAt: string;
  } | null>(null);

  if (!isOpen) return null;

  const normalized = code.trim().toUpperCase();
  const isValidChecksum = normalized.length >= 10 && verifyCodeChecksum(normalized);

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!normalized) return;

    setLoading(true);
    try {
      const res = await fetch('/api/student/redeem-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: normalized }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to activate voucher');
      }

      setRedeemSuccess({
        plan: data.plan,
        durationDays: data.durationDays,
        expiresAt: data.expiresAt,
      });

      toast.success(data.message || 'Plan activated successfully!');
      if (onSuccess) onSuccess();
    } catch (err: any) {
      toast.error(err.message || 'Redemption failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <KeyRound size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Redeem Activation Voucher</h3>
              <p className="text-xs text-muted-foreground">From physical textbooks or partner institutions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="py-4">
          {!redeemSuccess ? (
            <form onSubmit={handleRedeem} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Voucher / Activation Code
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="SAMYAK-CEE-XXXX-YYYYZ"
                    className="input-base w-full font-mono text-sm uppercase tracking-wider pr-10"
                    required
                    autoFocus
                  />
                  {normalized.length >= 10 && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {isValidChecksum ? (
                        <span title="Valid Cryptographic Checksum">
                          <CheckCircle2 size={18} className="text-emerald-500" />
                        </span>
                      ) : (
                        <span title="Invalid Checksum Format">
                          <AlertCircle size={18} className="text-amber-500" />
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between mt-1.5 text-[11px]">
                  <span className="text-muted-foreground">Format: SAMYAK-BATCH-XXXX-YYYYZ</span>
                  {normalized.length >= 10 && (
                    <span className={isValidChecksum ? 'text-emerald-500 font-semibold' : 'text-amber-500'}>
                      {isValidChecksum ? 'Checksum Verified' : 'Check Code Format'}
                    </span>
                  )}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 text-xs text-muted-foreground flex items-center gap-2">
                <Sparkles size={16} className="text-primary shrink-0" />
                <span>
                  Redeeming instantly unlocks full course videos, 200Q mock test ranking, and AI error analysis.
                </span>
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button type="button" onClick={onClose} className="btn-ghost text-xs">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !normalized}
                  className="btn-primary text-xs font-bold py-2 px-5 flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Verifying Ledger...
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={14} />
                      Activate My Plan
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4 text-center py-2">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto shadow-sm border border-emerald-500/20">
                <CheckCircle2 size={32} />
              </div>
              <div>
                <h4 className="text-base font-extrabold text-foreground">
                  Welcome to Samyak {redeemSuccess.plan.toUpperCase()}!
                </h4>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                  Your account has been upgraded with full access granted for{' '}
                  <span className="font-bold text-foreground">{redeemSuccess.durationDays} Days</span> (valid until{' '}
                  {new Date(redeemSuccess.expiresAt).toLocaleDateString()}).
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  window.location.reload();
                }}
                className="btn-primary w-full text-xs font-bold py-2.5 flex items-center justify-center gap-2 mt-2"
              >
                Go to Student Dashboard
                <ArrowRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
