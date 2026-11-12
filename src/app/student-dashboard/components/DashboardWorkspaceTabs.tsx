'use client';

import React from 'react';
import {
  BarChart2,
  Calendar,
  BookOpen,
  Award,
  Zap,
  HelpCircle,
  Bell,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { PWTab } from '../types';

export const DASHBOARD_TABS: Array<{
  id: PWTab;
  label: string;
  icon: React.ElementType;
}> = [
  { id: 'analytics', label: 'Overview', icon: BarChart2 },
  { id: 'schedule', label: 'Today', icon: Calendar },
  { id: 'classes', label: 'Classes', icon: BookOpen },
  { id: 'tests', label: 'Tests', icon: Award },
  { id: 'dpp', label: 'Practice', icon: Zap },
  { id: 'doubts', label: 'Doubts', icon: HelpCircle },
  { id: 'notices', label: 'Notices', icon: Bell },
];

export function isDashboardTab(value: string | null): value is PWTab {
  return DASHBOARD_TABS.some((tab) => tab.id === value);
}

interface DashboardWorkspaceTabsProps {
  activeTab: PWTab;
  onChange: (tab: PWTab) => void;
  badges?: Partial<Record<PWTab, string | number>>;
}

export default function DashboardWorkspaceTabs({
  activeTab,
  onChange,
  badges,
}: DashboardWorkspaceTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Student workspace"
      className="sticky top-0 z-20 -mx-1 px-1 py-2 bg-[#F8FAFC]/90 dark:bg-[#07090E]/90 backdrop-blur-xl"
    >
      <div className="flex items-center gap-1 p-1 bg-slate-100/90 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.08] rounded-2xl overflow-x-auto scrollbar-none">
        {DASHBOARD_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          const badge = badges?.[tab.id];

          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(tab.id)}
              className={`relative min-h-11 px-3 sm:px-4 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors shrink-0 cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                isActive
                  ? 'text-white'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeDashboardTabPill"
                  className="absolute inset-0 bg-primary rounded-xl shadow-xs -z-10"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <Icon size={15} className={isActive ? 'text-white' : 'text-slate-500 dark:text-zinc-500'} />
              <span className="tracking-tight">{tab.label}</span>
              {badge != null && badge !== '' && (
                <span
                  className={`min-w-5 h-5 px-1.5 rounded-full text-[10px] font-mono font-bold tabular-nums inline-flex items-center justify-center ${
                    isActive ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'
                  }`}
                >
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
