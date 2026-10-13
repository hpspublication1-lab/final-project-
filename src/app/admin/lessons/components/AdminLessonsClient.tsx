'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Video, BookOpen, Layers, CheckCircle2, Archive,
  Upload, Eye, Play, Plus, Clock, Search
} from 'lucide-react';
import { toast } from 'sonner';

interface LessonRecord {
  id: string;
  chapter_title: string;
  title: string;
  lesson_order: number;
  duration_minutes: number;
  is_free_preview: boolean;
  is_published: boolean;
  is_archived: boolean;
  bunny_video_id?: string;
}

const INITIAL_LESSONS: LessonRecord[] = [
  {
    id: 'les_1',
    chapter_title: 'Cell Structure & Organelles',
    title: 'Cell Membrane Fluid Mosaic Model & Transport',
    lesson_order: 1,
    duration_minutes: 42,
    is_free_preview: true,
    is_published: true,
    is_archived: false,
    bunny_video_id: 'bny_cell_01',
  },
  {
    id: 'les_2',
    chapter_title: 'Cell Structure & Organelles',
    title: 'Mitochondria, Chloroplasts & Semi-Autonomous DNA',
    lesson_order: 2,
    duration_minutes: 38,
    is_free_preview: false,
    is_published: true,
    is_archived: false,
    bunny_video_id: 'bny_cell_02',
  },
  {
    id: 'les_3',
    chapter_title: 'Chemical Bonding',
    title: 'VSEPR Theory & Molecular Geometry Hybridization',
    lesson_order: 1,
    duration_minutes: 55,
    is_free_preview: true,
    is_published: true,
    is_archived: false,
    bunny_video_id: 'bny_chem_01',
  },
  {
    id: 'les_4',
    chapter_title: 'Current Electricity',
    title: "Kirchhoff's Laws & Wheatstone Bridge Mastery",
    lesson_order: 1,
    duration_minutes: 48,
    is_free_preview: false,
    is_published: true,
    is_archived: false,
    bunny_video_id: 'bny_phy_01',
  },
];

export default function AdminLessonsClient() {
  const [lessons, setLessons] = useState<LessonRecord[]>(INITIAL_LESSONS);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetch('/api/admin/lessons')
      .then((res) => res.json())
      .then((data) => {
        if (data?.lessons && data.lessons.length > 0) {
          setLessons(data.lessons);
        }
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  const handleToggleArchive = async (id: string) => {
    const target = lessons.find((l) => l.id === id);
    if (!target) return;
    const newArchived = !target.is_archived;

    setLessons((prev) =>
      prev.map((l) => {
        if (l.id === id) {
          return { ...l, is_archived: newArchived, is_published: !newArchived };
        }
        return l;
      })
    );

    try {
      const res = await fetch('/api/admin/lessons', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_archived: newArchived }),
      });
      if (!res.ok) throw new Error('Update failed');
      toast.success(`Lesson '${target.title}' ${newArchived ? 'archived' : 'restored'}.`);
    } catch {
      toast.error('Failed to update lesson status in database.');
    }
  };

  const handleTogglePreview = async (id: string) => {
    const target = lessons.find((l) => l.id === id);
    if (!target) return;
    const newPreview = !target.is_free_preview;

    setLessons((prev) =>
      prev.map((l) => {
        if (l.id === id) {
          return { ...l, is_free_preview: newPreview };
        }
        return l;
      })
    );

    try {
      const res = await fetch('/api/admin/lessons', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_free_preview: newPreview }),
      });
      if (!res.ok) throw new Error('Update failed');
      toast.success(`Free preview set to ${newPreview ? 'Active' : 'Pro Only'}.`);
    } catch {
      toast.error('Failed to update preview gate in database.');
    }
  };

  const filtered = lessons.filter((l) => {
    const q = searchQuery.toLowerCase();
    return l.title.toLowerCase().includes(q) || l.chapter_title.toLowerCase().includes(q);
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
                <Video size={22} className="text-primary" /> Lessons &amp; Video Stream Player
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Manage syllabus lessons, Bunny.net video playback links, and free preview gates.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/admin/uploads" className="btn-secondary py-2 px-3 text-xs font-bold gap-1.5 flex items-center">
              <Upload size={14} /> Bunny.net Uploader
            </Link>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search lessons or chapter name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-9 py-2 text-xs w-full"
          />
        </div>

        {/* Lessons List */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border uppercase font-semibold text-muted-foreground tracking-wider">
              <tr>
                <th className="p-3.5">Order</th>
                <th className="p-3.5">Lesson &amp; Chapter</th>
                <th className="p-3.5">Duration</th>
                <th className="p-3.5">Free Preview</th>
                <th className="p-3.5">Bunny Video ID</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((l) => (
                <tr key={l.id} className={`hover:bg-muted/30 transition-colors ${l.is_archived ? 'opacity-50' : ''}`}>
                  <td className="p-3.5 font-bold font-mono text-muted-foreground">
                    #{l.lesson_order}
                  </td>
                  <td className="p-3.5">
                    <div className="font-bold text-foreground">{l.title}</div>
                    <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <BookOpen size={11} /> {l.chapter_title}
                    </div>
                  </td>
                  <td className="p-3.5 text-muted-foreground whitespace-nowrap">
                    <span className="flex items-center gap-1">
                      <Clock size={12} /> {l.duration_minutes} mins
                    </span>
                  </td>
                  <td className="p-3.5">
                    <button
                      onClick={() => handleTogglePreview(l.id)}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors ${
                        l.is_free_preview
                          ? 'bg-success-light text-success'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {l.is_free_preview ? 'Free Preview' : 'Pro Gated'}
                    </button>
                  </td>
                  <td className="p-3.5 font-mono text-[11px] text-muted-foreground">
                    {l.bunny_video_id || '—'}
                  </td>
                  <td className="p-3.5 text-right">
                    <button
                      onClick={() => handleToggleArchive(l.id)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-error hover:bg-error-light transition-colors"
                      title={l.is_archived ? 'Restore' : 'Archive'}
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
