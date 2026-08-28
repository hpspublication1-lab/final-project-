'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import {
  ShoppingBag,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  Loader2,
  GraduationCap,
  Stethoscope,
  Languages,
  TrendingUp,
  Cpu,
  Receipt,
} from 'lucide-react';

export default function PurchasesClient() {
  const [isDark, setIsDark] = useState(false);
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [purchases, setPurchases] = useState<any[]>([]);

  useEffect(() => {
    async function loadPurchases() {
      try {
        setLoading(true);
        const res = await fetch('/api/my-purchases');
        const data = await res.json();
        setPurchases(data.purchases || []);
        setLoading(false);
      } catch (err) {
        console.warn('Failed to load purchases:', err);
        setLoading(false);
      }
    }
    if (user) loadPurchases();
  }, [user]);

  const getCourseIcon = (courseId: string) => {
    switch (courseId) {
      case 'see_class_10': return <GraduationCap size={18} className="text-emerald-500" />;
      case 'cee_medical': return <Stethoscope size={18} className="text-indigo-500" />;
      case 'ielts': return <Languages size={18} className="text-amber-500" />;
      case 'digital_marketing': return <TrendingUp size={18} className="text-rose-500" />;
      case 'artificial_intelligence': return <Cpu size={18} className="text-purple-500" />;
      default: return <ShoppingBag size={18} className="text-primary" />;
    }
  };

  return (
    <DashboardLayout isDark={isDark} onToggleDark={() => setIsDark(!isDark)}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Header */}
        <div className="p-6 rounded-3xl bg-card border border-border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
              <ShoppingBag size={22} className="text-primary" /> My Purchases &amp; Enrollments
            </h1>
            <p className="text-xs text-muted-foreground">
              Review your course transactions, payment receipts, and active learning portal access.
            </p>
          </div>
          <Link
            href="/courses"
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm shrink-0"
          >
            <span>Explore Courses</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        {loading ? (
          <div className="py-16 text-center space-y-3">
            <Loader2 size={32} className="animate-spin text-primary mx-auto" />
            <p className="text-xs text-muted-foreground">Loading your purchase history...</p>
          </div>
        ) : purchases.length === 0 ? (
          <div className="p-12 rounded-3xl bg-card border border-border text-center space-y-4 shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto text-muted-foreground">
              <Receipt size={28} />
            </div>
            <h3 className="text-base font-bold text-foreground">No Purchase Records Yet</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              You are currently exploring free trial modules. Enroll in a course batch to unlock full access.
            </p>
            <Link
              href="/see"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
            >
              <span>Explore SEE Class 10 Batch</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {purchases.map((p) => (
              <div
                key={p.id}
                className="p-5 rounded-3xl bg-card border border-border hover:border-primary/40 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-muted/60 flex items-center justify-center shrink-0">
                    {getCourseIcon(p.courseId)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-extrabold text-foreground">{p.courseName}</h4>
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                        p.status === 'paid' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
                      }`}>
                        {p.status}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Order ID: <span className="font-mono">{p.orderNumber}</span> · Gateway: {p.gateway?.toUpperCase()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-border/60">
                  <div className="text-right">
                    <p className="text-sm font-black text-foreground">NPR {p.amount?.toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground">{p.paidAt ? new Date(p.paidAt).toLocaleDateString() : 'Pending'}</p>
                  </div>
                  <Link
                    href="/student-dashboard"
                    className="px-4 py-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-bold text-xs flex items-center gap-1 transition-colors shrink-0"
                  >
                    <span>Launch Portal</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
