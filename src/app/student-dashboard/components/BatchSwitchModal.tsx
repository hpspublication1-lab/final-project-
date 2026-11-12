'use client';

import React, { useState } from 'react';
import { X, Loader2, Check } from 'lucide-react';

interface BatchSwitchModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableBatches: Array<{
    id: string;
    title: string;
    priceNpr: number;
  }>;
  currentBatchId?: string | null;
  onConfirmSwitch: (batchId: string) => Promise<void>;
  isSwitching: boolean;
}

export default function BatchSwitchModal({
  isOpen,
  onClose,
  availableBatches,
  currentBatchId,
  onConfirmSwitch,
  isSwitching,
}: BatchSwitchModalProps) {
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(currentBatchId || null);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Switch Batch Cohort"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-150"
    >
      <div className="bg-card border border-border/80 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <div className="space-y-1">
          <h3 className="text-lg font-bold text-foreground">Switch Cohort Batch</h3>
          <p className="text-xs text-muted-foreground">
            Choose the academic cohort that best matches your target exam timeline.
          </p>
        </div>

        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {availableBatches.map((batch) => {
            const isSelected =
              selectedBatchId === batch.id || (!selectedBatchId && batch.id === currentBatchId);
            const isCurrent = batch.id === currentBatchId;

            return (
              <button
                key={batch.id}
                type="button"
                onClick={() => setSelectedBatchId(batch.id)}
                className={`w-full p-3.5 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                  isSelected
                    ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                    : 'border-border/70 hover:bg-muted/40'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-foreground">{batch.title}</span>
                    {isCurrent && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        Active
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-muted-foreground font-mono">
                    {batch.priceNpr > 0 ? `NPR ${batch.priceNpr.toLocaleString()}` : 'Free'}
                  </span>
                </div>

                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    isSelected ? 'border-primary bg-primary' : 'border-muted-foreground/40'
                  }`}
                >
                  {isSelected && <Check size={10} className="text-primary-foreground stroke-[3]" />}
                </div>
              </button>
            );
          })}
        </div>

        <div className="pt-2 border-t border-border/60 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSwitching || !selectedBatchId || selectedBatchId === currentBatchId}
            onClick={() => selectedBatchId && onConfirmSwitch(selectedBatchId)}
            className="btn-primary text-xs font-bold py-2 px-5 rounded-xl flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            {isSwitching ? <Loader2 size={14} className="animate-spin" /> : null}
            <span>Confirm Switch</span>
          </button>
        </div>
      </div>
    </div>
  );
}
