'use client';

import React from 'react';
import { Sparkles, Pin } from 'lucide-react';
import { motion } from 'framer-motion';
import { DashboardData } from '../types';

interface NoticesTabProps {
  data: DashboardData;
}

export default function NoticesTab({ data }: NoticesTabProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="space-y-4"
    >
      <div className="bg-card border border-border/80 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-primary" />
            <h3 className="text-sm font-bold text-foreground tracking-tight">Announcements</h3>
          </div>
          <span className="text-xs text-muted-foreground">Batch updates</span>
        </div>

        {data.announcements.length > 0 ? (
          <div className="space-y-3">
            {data.announcements.map((ann) => (
              <div
                key={ann.id}
                className="p-4 rounded-xl bg-primary/5 border border-primary/15 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {ann.isPinned && (
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25 flex items-center gap-1">
                        <Pin size={10} className="text-amber-600 dark:text-amber-400" />
                        <span>Pinned</span>
                      </span>
                    )}
                    <h5 className="text-xs sm:text-sm font-bold text-foreground">
                      {ann.title}
                    </h5>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {new Date(ann.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {ann.content}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center bg-muted/15 border border-border/50 rounded-xl space-y-2">
            <Sparkles size={24} className="mx-auto text-muted-foreground/60" />
            <p className="text-xs font-bold text-foreground">No new announcements</p>
            <p className="text-[11px] text-muted-foreground">
              Important schedule updates, exam notices, and live batch reminders will appear here.
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
