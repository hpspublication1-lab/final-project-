'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, FileText, Download, Plus, Archive, RefreshCw,
  Search, ShieldCheck, CheckCircle2, FileCheck, ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';

interface ResourceItem {
  id: string;
  title: string;
  file_type: 'pdf_notes' | 'model_question' | 'formula_sheet' | 'syllabus';
  file_size_mb: number;
  is_downloadable: boolean;
  is_premium_only: boolean;
  is_archived: boolean;
  download_count: number;
  created_at: string;
}

const INITIAL_RESOURCES: ResourceItem[] = [
  {
    id: 'res_1',
    title: 'CEE High-Yield Physics Formula & Dimensions Sheet',
    file_type: 'formula_sheet',
    file_size_mb: 3.4,
    is_downloadable: true,
    is_premium_only: false,
    is_archived: false,
    download_count: 842,
    created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
  },
  {
    id: 'res_2',
    title: 'SEE Class 10 Compulsory Science Board Model Question Paper 2081',
    file_type: 'model_question',
    file_size_mb: 2.1,
    is_downloadable: true,
    is_premium_only: false,
    is_archived: false,
    download_count: 1250,
    created_at: new Date(Date.now() - 3600000 * 72).toISOString(),
  },
  {
    id: 'res_3',
    title: 'Plant Anatomy & Secondary Growth Comprehensive PDF Notes',
    file_type: 'pdf_notes',
    file_size_mb: 6.8,
    is_downloadable: true,
    is_premium_only: true,
    is_archived: false,
    download_count: 531,
    created_at: new Date(Date.now() - 3600000 * 96).toISOString(),
  },
  {
    id: 'res_4',
    title: 'Official Medical Education Commission (MEC) CEE Syllabus 2026',
    file_type: 'syllabus',
    file_size_mb: 1.5,
    is_downloadable: true,
    is_premium_only: false,
    is_archived: false,
    download_count: 2190,
    created_at: new Date(Date.now() - 3600000 * 120).toISOString(),
  },
];

export default function AdminResourcesClient() {
  const [resources, setResources] = useState<ResourceItem[]>(INITIAL_RESOURCES);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const handleToggleArchive = (id: string) => {
    setResources((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const updated = !r.is_archived;
          toast.success(`Resource '${r.title}' ${updated ? 'archived' : 'restored'}.`);
          return { ...r, is_archived: updated };
        }
        return r;
      })
    );
  };

  const filtered = resources.filter((r) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = r.title.toLowerCase().includes(q) || r.file_type.includes(q);
    const matchesType = typeFilter === 'all' || r.file_type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="w-9 h-9 flex items-center justify-center rounded-xl border border-border bg-card text-foreground hover:bg-muted transition-colors">
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-xl font-extrabold text-foreground flex items-center gap-2">
                <FileText size={22} className="text-primary" /> Study Resources, PDFs &amp; Formula Sheets
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Manage downloadable handouts, formula quick-reference cards, and syllabus documents.
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search resources by title..."
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
            <option value="all">All File Categories</option>
            <option value="pdf_notes">PDF Notes</option>
            <option value="formula_sheet">Formula Sheets</option>
            <option value="model_question">Model Questions</option>
            <option value="syllabus">Syllabus Documents</option>
          </select>
        </div>

        {/* Resource Table */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border uppercase font-semibold text-muted-foreground tracking-wider">
              <tr>
                <th className="p-3.5">Document Title</th>
                <th className="p-3.5">Type</th>
                <th className="p-3.5">Size</th>
                <th className="p-3.5">Access Gate</th>
                <th className="p-3.5">Downloads</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((r) => (
                <tr key={r.id} className={`hover:bg-muted/30 transition-colors ${r.is_archived ? 'opacity-50' : ''}`}>
                  <td className="p-3.5">
                    <div className="font-bold text-foreground">{r.title}</div>
                    <div className="text-[11px] text-muted-foreground">Uploaded {new Date(r.created_at).toLocaleDateString()}</div>
                  </td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-muted text-muted-foreground">
                      {r.file_type.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="p-3.5 text-muted-foreground font-mono">
                    {r.file_size_mb} MB
                  </td>
                  <td className="p-3.5">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      r.is_premium_only ? 'bg-ma-light text-ma' : 'bg-success-light text-success'
                    }`}>
                      {r.is_premium_only ? 'Pro Only' : 'Free Open Access'}
                    </span>
                  </td>
                  <td className="p-3.5 font-bold text-foreground">
                    {r.download_count.toLocaleString()}
                  </td>
                  <td className="p-3.5 text-right">
                    <button
                      onClick={() => handleToggleArchive(r.id)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-error hover:bg-error-light transition-colors"
                      title={r.is_archived ? 'Restore' : 'Archive'}
                    >
                      <Archive size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
