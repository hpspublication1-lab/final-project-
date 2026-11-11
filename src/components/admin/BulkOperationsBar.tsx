'use client';

import React, { useState } from 'react';
import {
  Clock,
  Calendar,
  Crown,
  Smartphone,
  X,
  Loader2,
  CheckCircle2,
  Share2,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

interface BulkOperationsBarProps {
  selectedIds: string[];
  onClearSelection: () => void;
  onSuccess: () => void;
}

export default function BulkOperationsBar({
  selectedIds,
  onClearSelection,
  onSuccess,
}: BulkOperationsBarProps) {
  const [submitting, setSubmitting] = useState<string | null>(null);

  if (selectedIds.length === 0) return null;

  const handleBulkAction = async (action: string, label: string) => {
    if (!confirm(`Are you sure you want to apply "${label}" to ${selectedIds.length} selected students?`)) {
      return;
    }

    setSubmitting(action);
    try {
      const res = await fetch('/api/admin/users/bulk-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIds: selectedIds,
          action,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Bulk operation failed');
        return;
      }

      toast.success(data.message || `Bulk update applied to ${selectedIds.length} students!`);
      onClearSelection();
      onSuccess();
    } catch {
      toast.error('Network error executing bulk operation.');
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-4xl w-[92%] sm:w-auto animate-in slide-in-from-bottom-5 duration-200">
      <div className="bg-slate-950 text-white border-2 border-slate-800 rounded-2xl sm:rounded-full px-4 py-3 shadow-2xl backdrop-blur-md flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 text-xs">
        
        {/* Selection Badge */}
        <div className="flex items-center gap-2 pr-3 sm:border-r sm:border-slate-800">
          <span className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 font-black text-xs flex items-center justify-center">
            {selectedIds.length}
          </span>
          <span className="font-bold text-slate-200 whitespace-nowrap">
            Students Selected
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
          <button
            onClick={() => handleBulkAction('grant_7_days', '+7 Days Access')}
            disabled={!!submitting}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {submitting === 'grant_7_days' ? <Loader2 size={13} className="animate-spin" /> : <Clock size={13} className="text-amber-400" />}
            <span>+7d Pro</span>
          </button>

          <button
            onClick={() => handleBulkAction('grant_30_days', '+30 Days Access')}
            disabled={!!submitting}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {submitting === 'grant_30_days' ? <Loader2 size={13} className="animate-spin" /> : <Calendar size={13} className="text-emerald-400" />}
            <span>+30d Pro</span>
          </button>

          <button
            onClick={() => handleBulkAction('set_plan_pro', 'Set Full Pro Plan')}
            disabled={!!submitting}
            className="px-3 py-1.5 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {submitting === 'set_plan_pro' ? <Loader2 size={13} className="animate-spin" /> : <Crown size={13} />}
            <span>Set Pro</span>
          </button>

          <button
            onClick={() => handleBulkAction('reset_devices', 'Reset Hardware Devices')}
            disabled={!!submitting}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {submitting === 'reset_devices' ? <Loader2 size={13} className="animate-spin" /> : <Smartphone size={13} className="text-blue-400" />}
            <span>Unlock Devices</span>
          </button>
        </div>

        {/* Clear / Dismiss */}
        <button
          onClick={onClearSelection}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0 ml-auto"
          title="Deselect All"
        >
          <X size={16} />
        </button>

      </div>
    </div>
  );
}
