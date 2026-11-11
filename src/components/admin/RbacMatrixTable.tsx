'use client';

import React, { useState, useEffect } from 'react';
import {
  Shield, Check, X, Lock, RefreshCw, Loader2, Search,
  AlertTriangle, Filter, Info, ShieldCheck, Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import type { PermissionCategoryDef } from '@/lib/auth/rbac';
import { UserRoleType, PermissionCode } from '@/types/lms';

interface StaffRoleDef {
  role: UserRoleType;
  label: string;
  badge: string;
  level: number;
}

export default function RbacMatrixTable() {
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [roles, setRoles] = useState<StaffRoleDef[]>([]);
  const [categories, setCategories] = useState<PermissionCategoryDef[]>([]);
  const [matrix, setMatrix] = useState<Record<string, string[]>>({});
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const fetchMatrix = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/roles/matrix');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load RBAC matrix');
      setRoles(data.roles || []);
      setCategories(data.categories || []);
      setMatrix(data.matrix || {});
      setOverrides(data.overrides || {});
    } catch (err: any) {
      toast.error(err.message || 'Error fetching matrix');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatrix();
  }, []);

  const handleTogglePermission = async (role: UserRoleType, permission: PermissionCode, currentGranted: boolean) => {
    const key = `${role}:${permission}`;
    setUpdating(key);
    const newGranted = !currentGranted;

    // Optimistic update
    setMatrix((prev) => {
      const list = new Set(prev[role] || []);
      if (newGranted) list.add(permission);
      else list.delete(permission);
      return { ...prev, [role]: Array.from(list) };
    });

    try {
      const res = await fetch('/api/admin/roles/matrix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role,
          permission,
          granted: newGranted,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update permission');
      toast.success(data.message || `Updated ${permission} for ${role}`);
      if (data.overrides) setOverrides(data.overrides);
    } catch (err: any) {
      toast.error(err.message || 'Permission update failed');
      // Revert optimistic update
      fetchMatrix();
    } finally {
      setUpdating(null);
    }
  };

  const isLocked = (role: UserRoleType, permission: PermissionCode) => {
    if (role === 'super_admin' && (permission === 'users:assign_role' || permission === 'admin:access' || permission === 'audit:view')) {
      return true;
    }
    return false;
  };

  // Filter categories
  const filteredCategories = categories
    .filter((cat) => selectedCategory === 'all' || cat.category === selectedCategory)
    .map((cat) => {
      const filteredPerms = cat.permissions.filter(
        (p) =>
          p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
      return { ...cat, permissions: filteredPerms };
    })
    .filter((cat) => cat.permissions.length > 0);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-muted-foreground bg-card border border-border rounded-3xl">
        <Loader2 size={32} className="animate-spin text-primary mb-3" />
        <p className="font-semibold text-sm">Compiling Cryptographic RBAC Matrix...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Control Bar: Search & Category Filter */}
      <div className="flex items-center justify-between gap-3 flex-wrap bg-card border border-border rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 max-w-md">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search permissions by name, code, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-9 py-2 text-xs w-full"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="input-field py-2 text-xs max-w-xs"
          >
            <option value="all">All Functional Domains</option>
            {categories.map((c) => (
              <option key={c.category} value={c.category}>
                {c.category}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchMatrix}
            className="btn-secondary py-2 px-3 text-xs font-bold gap-1.5 cursor-pointer"
          >
            <RefreshCw size={13} className={updating ? 'animate-spin' : ''} /> Refresh Matrix
          </button>
        </div>
      </div>

      {/* Interactive Matrix Table */}
      <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-muted/70 border-b border-border">
                <th className="p-4 font-bold text-foreground min-w-[280px] sticky left-0 bg-muted/70 z-10 backdrop-blur-sm">
                  Functional Permission &amp; Capability
                </th>
                {roles.map((r) => (
                  <th key={r.role} className="p-3 text-center min-w-[130px] border-l border-border/60">
                    <div className="font-extrabold text-foreground text-xs">{r.label}</div>
                    <span className="text-[10px] text-muted-foreground font-mono">Lvl {r.level}</span>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {filteredCategories.map((cat) => (
                <React.Fragment key={cat.category}>
                  {/* Category Header Row */}
                  <tr className="bg-muted/30 border-t-2 border-border font-bold">
                    <td colSpan={roles.length + 1} className="py-2.5 px-4 bg-muted/40">
                      <div className="flex items-center justify-between">
                        <span className="text-primary uppercase tracking-wider text-[11px] font-extrabold flex items-center gap-1.5">
                          <Shield size={13} /> {cat.category}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-normal">
                          {cat.description}
                        </span>
                      </div>
                    </td>
                  </tr>

                  {/* Permission Rows */}
                  {cat.permissions.map((perm) => (
                    <tr key={perm.code} className="hover:bg-muted/20 transition-colors">
                      <td className="p-3.5 sticky left-0 bg-card z-10">
                        <div className="font-bold text-foreground text-xs">{perm.label}</div>
                        <div className="font-mono text-[10px] text-muted-foreground mt-0.5">{perm.code}</div>
                        <div className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                          {perm.description}
                        </div>
                      </td>

                      {roles.map((r) => {
                        const rolePerms = matrix[r.role] || [];
                        const isGranted = rolePerms.includes(perm.code);
                        const locked = isLocked(r.role, perm.code);
                        const toggleKey = `${r.role}:${perm.code}`;
                        const isMutating = updating === toggleKey;

                        return (
                          <td key={r.role} className="p-3 text-center border-l border-border/50">
                            {locked ? (
                              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-[10px] font-bold cursor-not-allowed" title="Immutable root privilege">
                                <Lock size={11} /> Root Protected
                              </div>
                            ) : (
                              <button
                                onClick={() => handleTogglePermission(r.role, perm.code, isGranted)}
                                disabled={isMutating}
                                className={`group px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                                  isGranted
                                    ? 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                    : 'bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground border border-border'
                                }`}
                                title={`Click to toggle ${perm.code} for ${r.label}`}
                              >
                                {isMutating ? (
                                  <Loader2 size={12} className="animate-spin text-primary" />
                                ) : isGranted ? (
                                  <>
                                    <Check size={13} className="text-emerald-500" />
                                    <span>Granted</span>
                                  </>
                                ) : (
                                  <>
                                    <X size={13} className="opacity-40" />
                                    <span>Denied</span>
                                  </>
                                )}
                              </button>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer Security Note */}
        <div className="p-4 bg-muted/30 border-t border-border flex items-center justify-between flex-wrap gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-primary shrink-0" />
            <span>
              All modifications are instantaneously enforced across all client sessions and audited in the immutable security ledger.
            </span>
          </div>
          <span className="font-mono text-[10px]">Active Override Nodes: {Object.keys(overrides).length}</span>
        </div>
      </div>
    </div>
  );
}
