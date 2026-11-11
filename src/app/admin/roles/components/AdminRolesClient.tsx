'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Shield, Users, UserCheck, AlertCircle, CheckCircle2,
  RefreshCw, Loader2, KeyRound, Search, Check, X, ShieldAlert,
  ChevronRight, Lock
} from 'lucide-react';
import { toast } from 'sonner';
import RbacMatrixTable from '@/components/admin/RbacMatrixTable';

interface StaffUser {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  role: string;
  is_admin: boolean;
  created_at: string;
}

interface RoleMeta {
  name: string;
  level: number;
  permissions: string[];
  isStaffRole: boolean;
}

const ALL_ROLES = [
  { key: 'super_admin', label: 'Super Administrator', badge: 'bg-primary/20 text-primary border-primary/30' },
  { key: 'admin', label: 'Administrator', badge: 'bg-chem-light text-chem border-chem/30' },
  { key: 'teacher', label: 'Teacher', badge: 'bg-bio-light text-bio border-bio/30' },
  { key: 'content_manager', label: 'Content Manager', badge: 'bg-physics-light text-physics border-physics/30' },
  { key: 'payment_staff', label: 'Payment Staff', badge: 'bg-ma-light text-ma border-ma/30' },
  { key: 'support_staff', label: 'Support Staff', badge: 'bg-muted text-foreground border-border' },
  { key: 'student_all_access', label: 'Student (All Access)', badge: 'bg-muted text-muted-foreground border-border' },
  { key: 'student_paid_cee', label: 'Student (CEE Pro)', badge: 'bg-muted text-muted-foreground border-border' },
  { key: 'student_paid_see', label: 'Student (SEE Pro)', badge: 'bg-muted text-muted-foreground border-border' },
  { key: 'student_free', label: 'Student (Free Starter)', badge: 'bg-muted text-muted-foreground border-border' },
];

export default function AdminRolesClient() {
  const [loading, setLoading] = useState(true);
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>([]);
  const [roles, setRoles] = useState<RoleMeta[]>([]);
  const [activeTab, setActiveTab] = useState<'staff' | 'matrix'>('staff');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Assign role modal
  const [selectedUser, setSelectedUser] = useState<StaffUser | null>(null);
  const [selectedRole, setSelectedRole] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const fetchRolesData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/roles');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load roles');
      setStaffUsers(data.staffUsers || []);
      setRoles(data.roles || []);
    } catch (err: any) {
      toast.error(err.message || 'Error fetching roles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRolesData();
  }, []);

  const handleOpenAssignModal = (user: StaffUser) => {
    setSelectedUser(user);
    setSelectedRole(user.role);
    setConfirmOpen(true);
  };

  const handleAssignRole = async () => {
    if (!selectedUser || !selectedRole) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId: selectedUser.id,
          newRole: selectedRole,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to assign role');
      toast.success(data.message || `Assigned role ${selectedRole} successfully`);
      setConfirmOpen(false);
      fetchRolesData();
    } catch (err: any) {
      toast.error(err.message || 'Role assignment failed');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredStaff = staffUsers.filter((u) => {
    const q = searchQuery.toLowerCase();
    return u.full_name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.role?.toLowerCase().includes(q);
  });

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
                <Shield size={22} className="text-primary" /> Roles &amp; Permissions Engine
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Manage role hierarchy, RBAC authorization matrix, and staff assignments.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={fetchRolesData} className="btn-secondary py-2 px-3 text-xs font-bold gap-1.5">
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>
        </div>

        {/* Super-admin Security Alert */}
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex items-start gap-3">
          <ShieldAlert size={20} className="text-primary shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-bold text-foreground">Super Administrator Protection Policy</p>
            <p className="text-muted-foreground">
              Role assignment is strictly protected on the server by the <code className="px-1.5 py-0.5 rounded bg-muted font-mono text-[11px]">users:assign_role</code> permission.
              Payment staff and content managers can never elevate their own privileges or modify academic grading permissions.
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-border gap-2">
          <button
            onClick={() => setActiveTab('staff')}
            className={`pb-3 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'staff' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <UserCheck size={16} /> Staff Role Assignments ({staffUsers.length})
          </button>
          <button
            onClick={() => setActiveTab('matrix')}
            className={`pb-3 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'matrix' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <KeyRound size={16} /> RBAC Permissions Matrix ({roles.length} Roles)
          </button>
        </div>

        {/* Staff Assignment View */}
        {activeTab === 'staff' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="relative max-w-sm w-full">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search staff by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-field pl-9 py-2 text-xs w-full"
                />
              </div>
              <span className="text-xs text-muted-foreground">{filteredStaff.length} staff members listed</span>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 size={28} className="animate-spin text-primary" />
              </div>
            ) : filteredStaff.length === 0 ? (
              <div className="text-center py-16 bg-card border border-border rounded-2xl text-muted-foreground">
                <Users size={32} className="mx-auto mb-2 opacity-40" />
                <p className="font-semibold text-sm">No staff users found.</p>
              </div>
            ) : (
              <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/50 border-b border-border uppercase font-semibold text-muted-foreground tracking-wider">
                    <tr>
                      <th className="p-3.5">Staff User</th>
                      <th className="p-3.5">Current Role</th>
                      <th className="p-3.5">Contact</th>
                      <th className="p-3.5">Joined</th>
                      <th className="p-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredStaff.map((u) => {
                      const roleDef = ALL_ROLES.find((r) => r.key === u.role) || { label: u.role, badge: 'bg-muted text-foreground' };
                      return (
                        <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                          <td className="p-3.5">
                            <div className="font-bold text-foreground">{u.full_name || 'Staff Member'}</div>
                            <div className="text-[11px] text-muted-foreground">{u.email}</div>
                          </td>
                          <td className="p-3.5">
                            <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${roleDef.badge}`}>
                              {roleDef.label}
                            </span>
                          </td>
                          <td className="p-3.5 text-muted-foreground">
                            {u.phone || '—'}
                          </td>
                          <td className="p-3.5 text-muted-foreground">
                            {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                          </td>
                          <td className="p-3.5 text-right">
                            <button
                              onClick={() => handleOpenAssignModal(u)}
                              className="px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold transition-colors"
                            >
                              Change Role
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Permissions Matrix View */}
        {activeTab === 'matrix' && (
          <div className="space-y-4">
            <RbacMatrixTable />
          </div>
        )}

        {/* Role Change Modal with Confirmation */}
        {confirmOpen && selectedUser && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <KeyRound size={16} className="text-primary" /> Modify User Role
                </h3>
                <button onClick={() => setConfirmOpen(false)} className="text-muted-foreground hover:text-foreground">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="bg-muted/50 p-3 rounded-xl space-y-1">
                  <p className="text-muted-foreground font-semibold">Target User:</p>
                  <p className="font-bold text-foreground">{selectedUser.full_name || 'Staff'}</p>
                  <p className="text-muted-foreground">{selectedUser.email}</p>
                </div>

                <div>
                  <label className="block font-semibold text-foreground mb-1">Select New Role:</label>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="input-field w-full py-2 text-xs"
                  >
                    {ALL_ROLES.map((r) => (
                      <option key={r.key} value={r.key}>
                        {r.label} (Level {roles.find((rm) => rm.name === r.key)?.level ?? '—'})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedRole === 'payment_staff' && (
                  <div className="bg-ma-light border border-ma/20 text-ma p-2.5 rounded-xl text-[11px] space-y-0.5">
                    <p className="font-bold">Strict Payment Staff Policy:</p>
                    <p>Will grant access to payments, order verification, and enrollments, but completely excludes academic tools and test grading.</p>
                  </div>
                )}

                {selectedRole === 'super_admin' && (
                  <div className="bg-error-light border border-error/20 text-error p-2.5 rounded-xl text-[11px] space-y-0.5">
                    <p className="font-bold">High Privilege Role:</p>
                    <p>Super Administrator grants full administrative privilege across all 21 modules including role assignment.</p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <button
                  onClick={() => setConfirmOpen(false)}
                  disabled={submitting}
                  className="btn-secondary py-1.5 px-3 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignRole}
                  disabled={submitting}
                  className="btn-primary py-1.5 px-4 text-xs font-bold flex items-center gap-1.5"
                >
                  {submitting ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                  Confirm Role Change
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
