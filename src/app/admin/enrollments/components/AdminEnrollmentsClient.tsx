'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Ticket, Plus, RefreshCw, Loader2, Search, Download,
  CheckCircle2, XCircle, AlertCircle, Filter, Calendar, User, BookOpen
} from 'lucide-react';
import { toast } from 'sonner';

interface EnrollmentRecord {
  id: string;
  student_id: string;
  student_name?: string;
  student_phone?: string;
  course_id: string;
  batch_id?: string;
  enrollment_status: string;
  created_at: string;
  starts_at?: string;
  expires_at?: string;
}

const COURSES = [
  { slug: 'cee_medical', label: 'CEE Medical Entrance (MBBS/BDS)' },
  { slug: 'neb_class_12', label: 'NEB Class 12 Board & Entrance Foundation' },
  { slug: 'neb_class_11', label: 'NEB Class 11 Core Concept Mastery' },
  { slug: 'ioe_engineering', label: 'IOE Pulchowk BE Entrance Mastery' },
  { slug: 'lok_sewa', label: 'Lok Sewa Aayog (PSC) Civil Service' },
  { slug: 'see_class_10', label: 'SEE Class 10 Board Excellence' },
  { slug: 'ielts', label: 'IELTS Academic & General Prep' },
  { slug: 'digital_marketing', label: 'Digital Marketing & AI Masterclass' },
];

export default function AdminEnrollmentsClient() {
  const [loading, setLoading] = useState(true);
  const [enrollments, setEnrollments] = useState<EnrollmentRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [courseFilter, setCourseFilter] = useState('all');

  // Grant Modal
  const [grantModalOpen, setGrantModalOpen] = useState(false);
  const [studentEmail, setStudentEmail] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('cee_medical');
  const [durationDays, setDurationDays] = useState(365);
  const [notes, setNotes] = useState('');
  const [granting, setGranting] = useState(false);

  // Revoke Modal
  const [revokeTarget, setRevokeTarget] = useState<EnrollmentRecord | null>(null);
  const [revokeReason, setRevokeReason] = useState('');
  const [revoking, setRevoking] = useState(false);

  const fetchEnrollments = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/enrollments');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load enrollments');
      setEnrollments(data.enrollments || []);
    } catch (err: any) {
      toast.error(err.message || 'Error fetching enrollments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnrollments();
  }, []);

  const handleGrantEnrollment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentEmail.trim()) {
      toast.error('Student email is required.');
      return;
    }

    setGranting(true);
    try {
      const res = await fetch('/api/admin/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentEmail: studentEmail.trim(),
          courseSlug: selectedCourse,
          durationDays: Number(durationDays),
          notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to grant enrollment');
      toast.success('Enrollment granted successfully!');
      setGrantModalOpen(false);
      setStudentEmail('');
      setNotes('');
      fetchEnrollments();
    } catch (err: any) {
      toast.error(err.message || 'Grant enrollment failed');
    } finally {
      setGranting(false);
    }
  };

  const handleRevokeEnrollment = async () => {
    if (!revokeTarget) return;
    setRevoking(true);
    try {
      const res = await fetch(`/api/admin/enrollments?id=${revokeTarget.id}&reason=${encodeURIComponent(revokeReason || 'Administrative revocation')}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to revoke enrollment');
      toast.success('Enrollment revoked successfully.');
      setRevokeTarget(null);
      setRevokeReason('');
      fetchEnrollments();
    } catch (err: any) {
      toast.error(err.message || 'Revoke enrollment failed');
    } finally {
      setRevoking(false);
    }
  };

  const filteredEnrollments = enrollments.filter((e) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      e.student_name?.toLowerCase().includes(q) ||
      e.student_id?.toLowerCase().includes(q) ||
      e.course_id?.toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'all' || e.enrollment_status === statusFilter;
    const matchesCourse = courseFilter === 'all' || e.course_id === courseFilter;
    return matchesSearch && matchesStatus && matchesCourse;
  });

  const exportCsv = () => {
    const headers = ['ID', 'Student Name', 'Student ID', 'Course', 'Status', 'Created At'];
    const lines = filteredEnrollments.map((e) => [
      e.id,
      e.student_name || '',
      e.student_id,
      e.course_id,
      e.enrollment_status,
      e.created_at,
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','));
    const csv = [headers.join(','), ...lines].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `enrollments-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="w-9 h-9 flex items-center justify-center rounded-xl border border-border bg-card text-foreground hover:bg-muted transition-colors">
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-xl font-extrabold text-foreground flex items-center gap-2">
                <Ticket size={22} className="text-primary" /> Course Enrollments &amp; Access Grants
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Manage active student access periods, manual scholarship grants, and revocations.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setGrantModalOpen(true)}
              className="btn-primary py-2 px-3 text-xs font-bold gap-1.5"
            >
              <Plus size={14} /> Grant Enrollment
            </button>
            <button
              onClick={exportCsv}
              disabled={filteredEnrollments.length === 0}
              className="btn-secondary py-2 px-3 text-xs font-bold gap-1.5 disabled:opacity-50"
            >
              <Download size={14} /> Export CSV
            </button>
            <button onClick={fetchEnrollments} className="btn-secondary py-2 px-3 text-xs font-bold gap-1.5">
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search student or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-9 py-2 text-xs w-full"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field py-2 text-xs"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="revoked">Revoked</option>
          </select>

          <select
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            className="input-field py-2 text-xs"
          >
            <option value="all">All Courses</option>
            {COURSES.map((c) => (
              <option key={c.slug} value={c.slug}>{c.label}</option>
            ))}
          </select>
        </div>

        {/* Enrollments Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="animate-spin text-primary" />
          </div>
        ) : filteredEnrollments.length === 0 ? (
          <div className="text-center py-16 bg-card border border-border rounded-2xl text-muted-foreground">
            <Ticket size={32} className="mx-auto mb-2 opacity-40" />
            <p className="font-semibold text-sm">No enrollments match the selected criteria.</p>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 border-b border-border uppercase font-semibold text-muted-foreground tracking-wider">
                <tr>
                  <th className="p-3.5">Student</th>
                  <th className="p-3.5">Target Course</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Enrolled Date</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredEnrollments.map((e) => (
                  <tr key={e.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3.5">
                      <div className="font-bold text-foreground">{e.student_name || 'Student'}</div>
                      <div className="text-[11px] font-mono text-muted-foreground">{e.student_id}</div>
                    </td>
                    <td className="p-3.5">
                      <span className="font-semibold text-foreground capitalize">
                        {e.course_id?.replace(/_/g, ' ') || 'General'}
                      </span>
                      {e.batch_id && <div className="text-[11px] text-muted-foreground font-mono">Batch: {e.batch_id}</div>}
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        e.enrollment_status === 'active'
                          ? 'bg-success-light text-success'
                          : e.enrollment_status === 'revoked'
                          ? 'bg-error-light text-error'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {e.enrollment_status}
                      </span>
                    </td>
                    <td className="p-3.5 text-muted-foreground">
                      {new Date(e.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-3.5 text-right">
                      {e.enrollment_status === 'active' && (
                        <button
                          onClick={() => setRevokeTarget(e)}
                          className="px-2.5 py-1 rounded-lg bg-error/10 hover:bg-error/20 text-error text-xs font-semibold transition-colors"
                        >
                          Revoke Access
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Grant Enrollment Modal */}
        {grantModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <form onSubmit={handleGrantEnrollment} className="bg-card border border-border rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Ticket size={16} className="text-primary" /> Manual Access Grant
                </h3>
                <button type="button" onClick={() => setGrantModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-foreground mb-1">Student Registered Email:</label>
                  <input
                    type="email"
                    required
                    placeholder="student@gmail.com"
                    value={studentEmail}
                    onChange={(e) => setStudentEmail(e.target.value)}
                    className="input-field w-full py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-foreground mb-1">Course Program:</label>
                  <select
                    value={selectedCourse}
                    onChange={(e) => setSelectedCourse(e.target.value)}
                    className="input-field w-full py-2 text-xs"
                  >
                    {COURSES.map((c) => (
                      <option key={c.slug} value={c.slug}>{c.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-foreground mb-1">Access Duration (Days):</label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={durationDays}
                    onChange={(e) => setDurationDays(Number(e.target.value))}
                    className="input-field w-full py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-foreground mb-1">Grant Reason / Notes (Audit logged):</label>
                  <input
                    type="text"
                    placeholder="e.g. Scholarship recipient / Manual bank payment verified"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="input-field w-full py-2 text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setGrantModalOpen(false)}
                  className="btn-secondary py-1.5 px-3 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={granting}
                  className="btn-primary py-1.5 px-4 text-xs font-bold flex items-center gap-1.5"
                >
                  {granting ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                  Confirm Grant
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Revoke Confirmation Modal */}
        {revokeTarget && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="text-sm font-bold text-error flex items-center gap-2">
                  <AlertCircle size={16} /> Confirm Access Revocation
                </h3>
                <button onClick={() => setRevokeTarget(null)} className="text-muted-foreground hover:text-foreground">
                  ✕
                </button>
              </div>

              <div className="space-y-2 text-xs">
                <p className="text-muted-foreground">
                  Are you sure you want to revoke enrollment for <strong className="text-foreground">{revokeTarget.student_name || revokeTarget.student_id}</strong> in <strong className="text-foreground">{revokeTarget.course_id}</strong>?
                </p>
                <div>
                  <label className="block font-semibold text-foreground mb-1">Reason for Revocation (Required for Audit):</label>
                  <input
                    type="text"
                    placeholder="e.g. Refund processed / Terms violation"
                    value={revokeReason}
                    onChange={(e) => setRevokeReason(e.target.value)}
                    className="input-field w-full py-2 text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <button
                  onClick={() => setRevokeTarget(null)}
                  className="btn-secondary py-1.5 px-3 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRevokeEnrollment}
                  disabled={revoking}
                  className="px-4 py-1.5 rounded-xl bg-error hover:bg-error/90 text-white text-xs font-bold transition-colors flex items-center gap-1.5"
                >
                  {revoking ? <Loader2 size={13} className="animate-spin" /> : <XCircle size={13} />}
                  Revoke Immediately
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
