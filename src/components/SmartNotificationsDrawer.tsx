'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Bell, Flame, AlertTriangle, Video, Sparkles, CheckCircle2, ArrowRight, X
} from 'lucide-react';
import toast from 'react-hot-toast';

export interface SmartNotification {
  id: string;
  type: 'streak' | 'weak_topic' | 'missed_class' | 'readiness';
  title: string;
  message: string;
  timeAgo: string;
  read: boolean;
  ctaText: string;
  ctaHref: string;
}

export default function SmartNotificationsDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<SmartNotification[]>([
    {
      id: 'n1',
      type: 'streak',
      title: '🔥 Streak Maintenance Alert',
      message: "You're on a 7-day streak. Complete today's 20 MCQs to keep it alive.",
      timeAgo: '10m ago',
      read: false,
      ctaText: 'Solve 20 MCQs Now',
      ctaHref: '/see/subject/mathematics',
    },
    {
      id: 'n2',
      type: 'weak_topic',
      title: '⚠️ Accuracy Drop Warning',
      message: "Your Algebra accuracy dropped to 54%. We've prepared a 15-minute targeted revision for you.",
      timeAgo: '1h ago',
      read: false,
      ctaText: 'Start 15m Algebra Revision',
      ctaHref: '/see/subject/mathematics',
    },
    {
      id: 'n3',
      type: 'missed_class',
      title: '📹 Missed Live Class Recording',
      message: 'You missed today\'s Physics Universal Gravitation live class. Watch the recording now.',
      timeAgo: '3h ago',
      read: false,
      ctaText: 'Watch Recording (24m)',
      ctaHref: '/see/lessons/default-see-1',
    },
    {
      id: 'n4',
      type: 'readiness',
      title: '🎯 SEE Readiness Boost Opportunity',
      message: 'Completing 1 Light Refraction Science chapter will push your SEE Readiness Score to 78%.',
      timeAgo: '5h ago',
      read: true,
      ctaText: 'View Science Chapter',
      ctaHref: '/see/subject/science',
    },
  ]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    toast.success('All notifications marked as read');
  };

  const getNotificationBadge = (type: SmartNotification['type']) => {
    switch (type) {
      case 'streak':
        return { icon: Flame, color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/20' };
      case 'weak_topic':
        return { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-500/10 border-red-500/20' };
      case 'missed_class':
        return { icon: Video, color: 'text-purple-500', bg: 'bg-purple-500/10 border-purple-500/20' };
      case 'readiness':
        return { icon: Sparkles, color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/20' };
    }
  };

  return (
    <div className="relative">
      
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-2xl bg-card hover:bg-muted border border-border text-foreground transition-all shadow-sm flex items-center justify-center"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-600 text-white font-mono text-[10px] font-black flex items-center justify-center border-2 border-background animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Drawer Popup */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-card border-2 border-emerald-500/30 rounded-3xl shadow-2xl p-5 z-50 space-y-4 animate-fade-in font-sans">
          
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-mono">
                SMART BEHAVIOR ENGINE
              </span>
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-[10px] font-bold text-emerald-600 hover:underline"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground hover:text-foreground text-xs font-bold"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
            {notifications.map((n) => {
              const badge = getNotificationBadge(n.type);
              const Icon = badge.icon;
              return (
                <div
                  key={n.id}
                  className={`p-3.5 rounded-2xl border transition-all space-y-2 ${
                    n.read
                      ? 'bg-muted/20 border-border/60 text-muted-foreground opacity-75'
                      : 'bg-card border-emerald-500/30 text-foreground shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-xl border ${badge.bg} ${badge.color}`}>
                        <Icon size={14} />
                      </div>
                      <h4 className="text-xs font-black text-foreground">{n.title}</h4>
                    </div>
                    <span className="text-[9px] font-mono text-muted-foreground shrink-0">{n.timeAgo}</span>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed pl-7">
                    {n.message}
                  </p>

                  <div className="pl-7 pt-1">
                    <Link
                      href={n.ctaHref}
                      onClick={() => setIsOpen(false)}
                      className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-600 hover:underline"
                    >
                      <span>{n.ctaText}</span>
                      <ArrowRight size={12} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

    </div>
  );
}
