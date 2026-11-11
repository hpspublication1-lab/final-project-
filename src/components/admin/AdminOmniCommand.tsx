'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  X,
  User,
  CreditCard,
  Zap,
  BookOpen,
  Layers,
  FileText,
  Shield,
  ArrowRight,
  ExternalLink,
  Loader2,
  Sparkles,
} from 'lucide-react';
import Student360Drawer, { type StudentProfileData } from './Student360Drawer';
import OfficialReceiptModal from '@/components/billing/OfficialReceiptModal';
import type { BillingInvoiceRecord } from '@/lib/billing/invoiceEngine';

const ADMIN_NAVIGATION_MODULES = [
  { label: 'Overview Control Center', href: '/admin', category: 'General' },
  { label: 'Billing & Tax Ledger', href: '/admin/billing', category: 'Finance' },
  { label: 'Orders & Payments Hub', href: '/admin/orders', category: 'Finance' },
  { label: 'Students & Subscribers', href: '/admin/users?role=student', category: 'Users' },
  { label: 'Teachers & Faculty', href: '/admin/teachers', category: 'Users' },
  { label: 'Course Enrollments', href: '/admin/enrollments', category: 'Users' },
  { label: 'Courses & Programs', href: '/admin/courses', category: 'Curriculum' },
  { label: 'Batches (Cohorts)', href: '/admin/batches', category: 'Curriculum' },
  { label: 'Subjects & Chapters', href: '/admin/subjects', category: 'Curriculum' },
  { label: 'Lessons & Videos', href: '/admin/lessons', category: 'Curriculum' },
  { label: 'Question Bank (MCQs)', href: '/admin/questions', category: 'Assessments' },
  { label: 'Tests & Mock Exams', href: '/admin/exams', category: 'Assessments' },
  { label: 'Coupons & Vouchers', href: '/admin/coupons', category: 'Finance' },
  { label: 'Live Virtual Classes', href: '/admin/live-classes', category: 'Classroom' },
  { label: 'Student Doubts & Q&A', href: '/admin/doubts', category: 'Classroom' },
  { label: 'Immutable Audit Logs', href: '/admin/audit-logs', category: 'Governance' },
  { label: 'Platform Settings', href: '/admin/settings', category: 'Governance' },
];

interface AdminOmniCommandProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminOmniCommand({ isOpen, onClose }: AdminOmniCommandProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [students, setStudents] = useState<StudentProfileData[]>([]);
  const [invoices, setInvoices] = useState<BillingInvoiceRecord[]>([]);

  // Selected student / invoice states
  const [selectedStudent, setSelectedStudent] = useState<StudentProfileData | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<BillingInvoiceRecord | null>(null);

  // Load students & invoices for local fast search
  useEffect(() => {
    if (isOpen) {
      async function loadData() {
        setSearching(true);
        try {
          const [usersRes, billRes] = await Promise.all([
            fetch('/api/admin/users'),
            fetch('/api/billing/invoices?all=true'),
          ]);
          if (usersRes.ok) {
            const uData = await usersRes.json();
            setStudents(uData.users || []);
          }
          if (billRes.ok) {
            const bData = await billRes.json();
            setInvoices(bData.invoices || []);
          }
        } catch {
          // ignore
        } finally {
          setSearching(false);
        }
      }
      loadData();
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Global keydown escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const filteredModules = useMemo(() => {
    if (!query.trim()) return ADMIN_NAVIGATION_MODULES.slice(0, 4);
    const q = query.toLowerCase();
    return ADMIN_NAVIGATION_MODULES.filter(
      (m) => m.label.toLowerCase().includes(q) || m.category.toLowerCase().includes(q)
    );
  }, [query]);

  const filteredStudents = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return students
      .filter(
        (s) =>
          s.full_name?.toLowerCase().includes(q) ||
          s.email?.toLowerCase().includes(q) ||
          s.phone?.includes(q)
      )
      .slice(0, 5);
  }, [query, students]);

  const filteredInvoices = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return invoices
      .filter(
        (i) =>
          i.invoiceNumber.toLowerCase().includes(q) ||
          (i.receiptNumber && i.receiptNumber.toLowerCase().includes(q)) ||
          i.purchaseOrderId.toLowerCase().includes(q) ||
          i.customerName.toLowerCase().includes(q) ||
          i.verificationCode.toLowerCase().includes(q)
      )
      .slice(0, 4);
  }, [query, invoices]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-start justify-center pt-16 sm:pt-24 px-4 animate-fade-in">
        <div className="bg-card border-2 border-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden my-auto animate-in zoom-in-95 duration-150 flex flex-col max-h-[80vh]">
          {/* Top Search Input Bar */}
          <div className="p-4 sm:p-5 border-b border-border bg-slate-950 text-white flex items-center gap-3">
            <Search size={20} className="text-emerald-400 shrink-0" />
            <input
              type="text"
              autoFocus
              placeholder="Search students, invoices, PRNs, MCQs, or admin tools..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-transparent text-sm sm:text-base font-semibold focus:outline-none placeholder:text-slate-500 text-white"
            />
            {searching ? (
              <Loader2 size={18} className="animate-spin text-slate-400 shrink-0" />
            ) : (
              <button
                onClick={onClose}
                className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            )}
          </div>

          {/* Results List */}
          <div className="overflow-y-auto p-3 space-y-4 text-xs">
            {/* Student Results */}
            {filteredStudents.length > 0 && (
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground px-2">
                  Matching Students ({filteredStudents.length}) &bull; Click to open 360° Drawer
                </span>
                {filteredStudents.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setSelectedStudent(s);
                    }}
                    className="w-full text-left p-3 rounded-2xl bg-muted/30 hover:bg-muted/80 border border-border/80 flex items-center justify-between gap-3 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                        {s.full_name ? s.full_name.charAt(0).toUpperCase() : 'S'}
                      </div>
                      <div className="truncate">
                        <p className="font-bold text-foreground truncate">{s.full_name}</p>
                        <p className="text-[10.5px] font-mono text-muted-foreground truncate">
                          {s.email} {s.phone ? `&bull; ${s.phone}` : ''}
                        </p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-600 shrink-0">
                      360° View
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Invoices & Vouchers */}
            {filteredInvoices.length > 0 && (
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground px-2">
                  Matching Invoices &amp; Receipts ({filteredInvoices.length})
                </span>
                {filteredInvoices.map((inv) => (
                  <button
                    key={inv.id}
                    onClick={() => setSelectedInvoice(inv)}
                    className="w-full text-left p-3 rounded-2xl bg-muted/30 hover:bg-muted/80 border border-border/80 flex items-center justify-between gap-3 transition-colors cursor-pointer"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-foreground">{inv.invoiceNumber}</span>
                        <span className="text-[10px] font-bold text-emerald-600 uppercase">
                          NPR {inv.netAmountNpr.toLocaleString()}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate">{inv.itemTitle}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-primary/10 text-primary shrink-0">
                      View Voucher
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Module Navigation */}
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground px-2">
                {query ? 'Admin Modules' : 'Quick Navigation Shortcuts'}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {filteredModules.map((m) => (
                  <button
                    key={m.href}
                    onClick={() => {
                      onClose();
                      router.push(m.href);
                    }}
                    className="p-2.5 rounded-xl hover:bg-muted border border-border/60 flex items-center justify-between gap-2 text-left cursor-pointer transition-colors"
                  >
                    <span className="font-semibold text-foreground truncate">{m.label}</span>
                    <span className="text-[10px] font-mono text-muted-foreground px-1.5 py-0.2 bg-muted rounded">
                      {m.category}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer Bar */}
          <div className="p-3 bg-muted/50 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground font-mono">
            <span>Press ESC or click outside to dismiss</span>
            <kbd className="px-2 py-0.5 bg-background border border-border text-[10px] rounded">
              ESC
            </kbd>
          </div>
        </div>
      </div>

      {/* Slide-over Student 360 Drawer */}
      <Student360Drawer
        student={selectedStudent}
        onClose={() => setSelectedStudent(null)}
      />

      {/* Official Receipt Modal */}
      <OfficialReceiptModal
        invoice={selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
      />
    </>
  );
}
