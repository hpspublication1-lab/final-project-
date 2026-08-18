'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { MessageCircleQuestion, ShieldCheck, FileText, Loader2, ArrowRight, Users, LayoutDashboard, LogOut } from 'lucide-react';

const STAFF_ROLES = ['admin', 'teacher', 'content_reviewer', 'support_agent'];

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrator',
  teacher: 'Teacher',
  content_reviewer: 'Content Reviewer',
  support_agent: 'Support Agent',
};

export default function StaffDashboardClient() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [openDoubts, setOpenDoubts] = useState<number | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const role = profile?.role ?? '';
  const isStaff = STAFF_ROLES.includes(role);
  const isAdmin = role === 'admin';

  // Route guard: students don't belong here.
  useEffect(() => {
    if (!loading && (!user || (profile && !isStaff))) {
      router.replace('/student-dashboard');
    }
  }, [loading, user, profile, isStaff, router]);

  useEffect(() => {
    if (!isStaff) return;
    let cancelled = false;
    (async () => {
      setStatsLoading(true);
      const supabase = createClient();
      const { count } = await supabase
        .from('doubts')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'open');
      if (!cancelled) {
        setOpenDoubts(count ?? 0);
        setStatsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [isStaff]);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace('/sign-up-login-screen');
  };

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 size={28} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!isStaff) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 size={28} className="animate-spin text-primary" />
      </div>
    );
  }

  const cards = [
    {
      key: 'doubts',
      show: true,
      title: 'Answer Doubts',
      desc: 'Respond to student questions',
      href: '/admin/doubts',
      icon: MessageCircleQuestion,
      color: 'text-primary',
      bg: 'bg-primary/10',
      badge: statsLoading ? null : openDoubts,
    },
    {
      key: 'review',
      show: role === 'admin' || role === 'content_reviewer',
      title: 'Review AI Content',
      desc: 'Grade generated questions & notes',
      href: '/admin/ai-review',
      icon: ShieldCheck,
      color: 'text-chem',
      bg: 'bg-chem-light',
      badge: null,
    },
    {
      key: 'uploads',
      show: role === 'admin' || role === 'content_reviewer',
      title: 'Content Uploads',
      desc: 'Notes, videos, materials, live classes',
      href: '/admin/uploads',
      icon: FileText,
      color: 'text-bio',
      bg: 'bg-bio-light',
      badge: null,
    },
    {
      key: 'admin',
      show: isAdmin,
      title: 'Full Admin Panel',
      desc: 'Users, exams, questions, analytics',
      href: '/admin',
      icon: LayoutDashboard,
      color: 'text-ma',
      bg: 'bg-ma-light',
      badge: null,
    },
  ].filter((c) => c.show);

  const displayName = profile.full_name?.split(' ')?.[0] || user?.email?.split('@')?.[0] || 'there';

  return (
    <div className="min-h-screen bg-background">
      <header className="h-14 bg-card border-b border-border flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <Users size={15} className="text-primary" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground leading-none">Staff Dashboard</p>
            <p className="text-xs text-muted-foreground">{ROLE_LABELS[role] ?? 'Staff'}</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-error transition-colors"
        >
          <LogOut size={15} /> Sign out
        </button>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Welcome, {displayName} 👋</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {openDoubts && openDoubts > 0
              ? `${openDoubts} student ${openDoubts === 1 ? 'doubt is' : 'doubts are'} waiting for a reply.`
              : 'You’re all caught up on student doubts.'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {cards.map((card) => (
            <Link
              key={card.key}
              href={card.href}
              className="group bg-card border border-border rounded-2xl p-5 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-150 flex items-start gap-4"
            >
              <div className={`w-11 h-11 rounded-xl ${card.bg} flex items-center justify-center shrink-0`}>
                <card.icon size={22} className={card.color} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-foreground">{card.title}</p>
                  {typeof card.badge === 'number' && card.badge > 0 && (
                    <span className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-error text-white">{card.badge}</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{card.desc}</p>
              </div>
              <ArrowRight size={16} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
            </Link>
          ))}
        </div>

        <div className="mt-6">
          <Link href="/student-dashboard" className="text-sm text-primary font-medium hover:underline">
            ← Go to student view
          </Link>
        </div>
      </div>
    </div>
  );
}
