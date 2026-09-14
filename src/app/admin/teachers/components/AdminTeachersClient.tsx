'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, UserCheck, Users, RefreshCw, Loader2, Search,
  GraduationCap, BookOpen, Layers, ShieldCheck, Mail, Phone
} from 'lucide-react';
import { toast } from 'sonner';

interface TeacherStaff {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  role: string;
  created_at: string;
}

export default function AdminTeachersClient() {
  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState<TeacherStaff[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/roles');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load staff');
      setTeachers(data.staffUsers || []);
    } catch (err: any) {
      toast.error(err.message || 'Error loading staff');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const filteredTeachers = teachers.filter((t) => {
    const q = searchQuery.toLowerCase();
    return t.full_name?.toLowerCase().includes(q) || t.email?.toLowerCase().includes(q) || t.role?.toLowerCase().includes(q);
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
                <UserCheck size={22} className="text-primary" /> Faculty &amp; Academic Staff Directory
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Overview of verified subject teachers, content creators, and administrative operators.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/admin/roles" className="btn-primary py-2 px-3 text-xs font-bold gap-1.5 flex items-center">
              <ShieldCheck size={14} /> Manage Staff Roles
            </Link>
            <button onClick={fetchStaff} className="btn-secondary py-2 px-3 text-xs font-bold gap-1.5">
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search faculty by name, email, or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-9 py-2 text-xs w-full"
          />
        </div>

        {/* Staff Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="animate-spin text-primary" />
          </div>
        ) : filteredTeachers.length === 0 ? (
          <div className="text-center py-16 bg-card border border-border rounded-2xl text-muted-foreground">
            <UserCheck size={32} className="mx-auto mb-2 opacity-40" />
            <p className="font-semibold text-sm">No teachers or staff found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTeachers.map((t) => (
              <div key={t.id} className="bg-card border border-border rounded-2xl p-5 space-y-4 shadow-sm hover:border-primary/30 transition-all">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary font-bold flex items-center justify-center text-sm">
                      {t.full_name ? t.full_name[0].toUpperCase() : 'T'}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-foreground">{t.full_name || 'Faculty Member'}</h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-primary/10 text-primary">
                        {t.role}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-muted-foreground border-t border-border pt-3">
                  <div className="flex items-center gap-2">
                    <Mail size={13} className="text-muted-foreground" />
                    <span className="truncate">{t.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={13} className="text-muted-foreground" />
                    <span>{t.phone || 'Phone not set'}</span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between text-[11px] text-muted-foreground border-t border-border">
                  <span>Joined {new Date(t.created_at).toLocaleDateString()}</span>
                  <Link
                    href={`/admin/roles?user=${t.id}`}
                    className="text-primary hover:underline font-bold"
                  >
                    Manage Privileges →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
