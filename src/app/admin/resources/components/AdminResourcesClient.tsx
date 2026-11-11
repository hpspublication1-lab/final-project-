'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, FileText, Download, Plus, Archive, RefreshCw,
  Search, ShieldCheck, CheckCircle2, FileCheck, ExternalLink,
  Sparkles, Lock, Globe, Eye, Upload, Filter, BookOpen, Layers, Zap
} from 'lucide-react';
import { toast } from 'sonner';
import AiContentGeneratorModal from './AiContentGeneratorModal';
import UploadResourceModal from './UploadResourceModal';
import AutonomousAutoPilotModal from './AutonomousAutoPilotModal';

interface ResourceItem {
  id: string;
  title: string;
  program_type: 'cee' | 'see' | 'ielts' | 'neb' | 'ioe';
  subject?: string;
  chapter?: string;
  file_type: 'pdf_notes' | 'model_question' | 'formula_sheet' | 'ielts_pack' | 'syllabus';
  file_size_mb: number;
  is_downloadable: boolean;
  is_premium_only: boolean;
  is_archived: boolean;
  download_count: number;
  pdf_url?: string | null;
  content?: string | null;
  created_at: string;
}

export default function AdminResourcesClient() {
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [programFilter, setProgramFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // Modals
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [autoPilotOpen, setAutoPilotOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [previewResource, setPreviewResource] = useState<ResourceItem | null>(null);

  const fetchResources = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/resources?program=${programFilter}&type=${typeFilter}&query=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data?.resources) {
        setResources(data.resources);
      }
    } catch {
      toast.error('Failed to load resources');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, [programFilter, typeFilter]);

  const handleToggleArchive = async (id: string) => {
    const target = resources.find((r) => r.id === id);
    if (!target) return;
    const newArchived = !target.is_archived;

    setResources((prev) =>
      prev.map((r) => (r.id === id ? { ...r, is_archived: newArchived } : r))
    );

    try {
      const res = await fetch('/api/admin/resources', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_archived: newArchived }),
      });
      if (!res.ok) throw new Error('Update failed');
      toast.success(`Resource '${target.title}' ${newArchived ? 'archived' : 'restored'}.`);
    } catch {
      toast.error('Failed to update resource in database.');
      fetchResources();
    }
  };

  const handleTogglePremium = async (id: string) => {
    const target = resources.find((r) => r.id === id);
    if (!target) return;
    const newPremium = !target.is_premium_only;

    setResources((prev) =>
      prev.map((r) => (r.id === id ? { ...r, is_premium_only: newPremium } : r))
    );

    try {
      const res = await fetch('/api/admin/resources', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_premium_only: newPremium }),
      });
      if (!res.ok) throw new Error('Update failed');
      toast.success(`Resource access set to ${newPremium ? 'PRO EXCLUSIVE' : 'FREE'}.`);
    } catch {
      toast.error('Failed to update tier in database.');
      fetchResources();
    }
  };

  const filtered = resources.filter((r) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      r.title.toLowerCase().includes(q) ||
      (r.subject && r.subject.toLowerCase().includes(q)) ||
      (r.chapter && r.chapter.toLowerCase().includes(q)) ||
      r.file_type.includes(q);
    const matchesType = typeFilter === 'all' || r.file_type === typeFilter;
    const matchesProgram = programFilter === 'all' || r.program_type === programFilter;
    return matchesSearch && matchesType && matchesProgram;
  });

  const ceeCount = resources.filter((r) => r.program_type === 'cee').length;
  const seeCount = resources.filter((r) => r.program_type === 'see').length;
  const ieltsCount = resources.filter((r) => r.program_type === 'ielts').length;
  const totalDownloads = resources.reduce((acc, r) => acc + (r.download_count || 0), 0);

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
                <FileText size={22} className="text-primary" /> Multi-Section Resource &amp; Study Material Hub
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Manage and upload handouts, formula cheat sheets, past papers, and IELTS packs across CEE, SEE &amp; IELTS.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setAutoPilotOpen(true)}
              className="py-2 px-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              title="Launch Hands-Free Curriculum Auto-Pilot"
            >
              <Zap size={14} /> ⚡ Autonomous Auto-Pilot
            </button>

            <button
              onClick={() => setAiModalOpen(true)}
              className="py-2 px-3.5 rounded-xl bg-primary text-white font-extrabold text-xs shadow-md hover:bg-primary/90 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles size={14} /> AI Auto-Generate &amp; Post
            </button>

            <button
              onClick={() => setUploadModalOpen(true)}
              className="btn-secondary py-2 px-3 text-xs font-bold gap-1.5 cursor-pointer"
            >
              <Upload size={14} /> Upload Resource
            </button>

            <button
              onClick={fetchResources}
              className="btn-secondary py-2 px-2.5 text-xs font-bold cursor-pointer"
              title="Refresh resources list"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Quick Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Total Resources</span>
            <div className="text-xl font-extrabold text-foreground mt-1">{resources.length} Handouts</div>
            <p className="text-[10px] text-muted-foreground mt-0.5">Across all academic streams</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
            <span className="text-[10px] font-bold text-primary uppercase tracking-wider block">🩺 CEE Medical</span>
            <div className="text-xl font-extrabold text-foreground mt-1">{ceeCount} Files</div>
            <p className="text-[10px] text-muted-foreground mt-0.5">Physics, Bio, Chem, MAT</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">🎒 SEE Class 10</span>
            <div className="text-xl font-extrabold text-foreground mt-1">{seeCount} Files</div>
            <p className="text-[10px] text-muted-foreground mt-0.5">Science, Math, English, Social</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
            <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider block">🌍 IELTS Mastery</span>
            <div className="text-xl font-extrabold text-foreground mt-1">{ieltsCount} Packs</div>
            <p className="text-[10px] text-muted-foreground mt-0.5">{totalDownloads.toLocaleString()} Student Downloads</p>
          </div>
        </div>

        {/* Program Tabs */}
        <div className="flex border-b border-border gap-2 overflow-x-auto pb-1 text-xs">
          {[
            { key: 'all', label: `All Sections (${resources.length})` },
            { key: 'cee', label: `🩺 CEE Medical (${ceeCount})` },
            { key: 'see', label: `🎒 SEE Class 10 (${seeCount})` },
            { key: 'ielts', label: `🌍 IELTS (${ieltsCount})` },
            { key: 'neb', label: '🎓 NEB 11/12' },
            { key: 'ioe', label: '📐 IOE Eng' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setProgramFilter(tab.key)}
              className={`pb-2.5 px-3.5 font-bold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
                programFilter === tab.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative sm:col-span-2">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search resources by title, subject, or chapter..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-9 py-2 text-xs w-full"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="input-field py-2 text-xs"
          >
            <option value="all">All Content Formats</option>
            <option value="pdf_notes">PDF Lecture Handouts</option>
            <option value="formula_sheet">Formula Cheat Sheets</option>
            <option value="model_question">Model Question Papers</option>
            <option value="ielts_pack">IELTS Essay &amp; Cue Card Packs</option>
            <option value="syllabus">Syllabus Outlines</option>
          </select>
        </div>

        {/* Resources Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <RefreshCw size={24} className="animate-spin text-primary mr-2" /> Loading multi-section resources...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-card border border-border rounded-2xl text-muted-foreground space-y-2">
            <FileText size={32} className="mx-auto opacity-40" />
            <p className="font-semibold text-sm">No resources found in this section.</p>
            <p className="text-xs">Click <strong>"AI Auto-Generate &amp; Post"</strong> or <strong>"Upload Resource"</strong> to populate this stream.</p>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 border-b border-border uppercase font-semibold text-muted-foreground tracking-wider">
                <tr>
                  <th className="p-3.5">Resource Title &amp; Chapter</th>
                  <th className="p-3.5">Section</th>
                  <th className="p-3.5">Format</th>
                  <th className="p-3.5">Access Tier</th>
                  <th className="p-3.5">Downloads</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3.5">
                      <div className="font-bold text-foreground line-clamp-1">{r.title}</div>
                      <div className="text-[11px] text-muted-foreground flex items-center gap-2 mt-0.5">
                        <span className="font-semibold text-foreground">{r.subject || 'Core'}</span>
                        {r.chapter && <span>· {r.chapter}</span>}
                        <span>· {r.file_size_mb} MB</span>
                      </div>
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                        r.program_type === 'cee'
                          ? 'bg-primary/10 text-primary'
                          : r.program_type === 'see'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : r.program_type === 'ielts'
                          ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                          : 'bg-muted text-foreground'
                      }`}>
                        {r.program_type}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-full bg-muted text-[11px] font-mono text-muted-foreground">
                        {r.file_type.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <button
                        onClick={() => handleTogglePremium(r.id)}
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                          r.is_premium_only
                            ? 'bg-amber-500/15 text-amber-600 hover:bg-amber-500/25'
                            : 'bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25'
                        }`}
                        title="Click to toggle access tier"
                      >
                        {r.is_premium_only ? <Lock size={10} /> : <Globe size={10} />}
                        {r.is_premium_only ? 'PRO EXCLUSIVE' : 'FREE ACCESS'}
                      </button>
                    </td>
                    <td className="p-3.5 text-muted-foreground font-mono">
                      {r.download_count ? r.download_count.toLocaleString() : 0}
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setPreviewResource(r)}
                          className="px-2.5 py-1 rounded-lg bg-card hover:bg-muted border border-border text-foreground font-semibold text-xs transition-colors flex items-center gap-1 cursor-pointer"
                          title="Preview Content"
                        >
                          <Eye size={12} className="text-primary" /> View
                        </button>
                        {r.pdf_url && (
                          <a
                            href={r.pdf_url}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                            title="Direct Download Link"
                          >
                            <Download size={13} />
                          </a>
                        )}
                        <button
                          onClick={() => handleToggleArchive(r.id)}
                          className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                            r.is_archived
                              ? 'border-error/40 text-error bg-error/10 hover:bg-error/20'
                              : 'border-border text-muted-foreground hover:text-foreground'
                          }`}
                          title={r.is_archived ? 'Restore' : 'Archive'}
                        >
                          <Archive size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* In-App Content Preview Modal */}
        {previewResource && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in">
            <div className="bg-card border border-border rounded-3xl max-w-3xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between border-b border-border pb-3 shrink-0">
                <div>
                  <h3 className="font-extrabold text-foreground text-base">{previewResource.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Section: <strong className="uppercase text-primary">{previewResource.program_type}</strong> · Format:{' '}
                    {previewResource.file_type}
                  </p>
                </div>
                <button
                  onClick={() => setPreviewResource(null)}
                  className="w-8 h-8 rounded-xl border border-border hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-y-auto bg-muted/20 p-4 rounded-2xl border border-border/70 text-xs leading-relaxed space-y-3">
                {previewResource.content ? (
                  <pre className="whitespace-pre-wrap font-sans text-xs">
                    {previewResource.content}
                  </pre>
                ) : previewResource.pdf_url ? (
                  <div className="text-center py-8 space-y-3">
                    <FileText size={36} className="mx-auto text-primary opacity-60" />
                    <p className="font-bold text-foreground">Attached Document URL:</p>
                    <a
                      href={previewResource.pdf_url}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-primary py-2 px-4 text-xs inline-flex items-center gap-1.5"
                    >
                      <ExternalLink size={13} /> Open PDF in New Tab
                    </a>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No inline markdown content attached to this resource record.</p>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-border flex justify-end">
                <button
                  onClick={() => setPreviewResource(null)}
                  className="btn-secondary py-1.5 px-4 text-xs font-semibold"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        )}

        {/* AI Studio Modal */}
        <AiContentGeneratorModal
          isOpen={aiModalOpen}
          onClose={() => setAiModalOpen(false)}
          onSuccess={fetchResources}
        />

        {/* Manual Upload Modal */}
        <UploadResourceModal
          isOpen={uploadModalOpen}
          onClose={() => setUploadModalOpen(false)}
          onSuccess={fetchResources}
        />

        {/* Autonomous Auto-Pilot Daemon Modal */}
        <AutonomousAutoPilotModal
          isOpen={autoPilotOpen}
          onClose={() => setAutoPilotOpen(false)}
          onCompleted={fetchResources}
        />

      </div>
    </div>
  );
}
