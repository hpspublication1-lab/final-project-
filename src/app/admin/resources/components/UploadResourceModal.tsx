'use client';

import React, { useState } from 'react';
import {
  X, Upload, FileText, CheckCircle2, Loader2, ShieldCheck,
  Link as LinkIcon, Lock, Globe
} from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function UploadResourceModal({ isOpen, onClose, onSuccess }: Props) {
  const [title, setTitle] = useState('');
  const [program, setProgram] = useState<'cee' | 'see' | 'ielts' | 'neb' | 'ioe'>('cee');
  const [fileType, setFileType] = useState('pdf_notes');
  const [subject, setSubject] = useState('Physics');
  const [chapter, setChapter] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
  const [contentMarkdown, setContentMarkdown] = useState('');
  const [isPremium, setIsPremium] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Resource title is required');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          program_type: program,
          file_type: fileType,
          pdf_url: pdfUrl || null,
          content: contentMarkdown || null,
          is_premium: isPremium,
          is_active: true,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to create resource');

      toast.success(data.message || 'Resource published successfully!');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Error uploading resource');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Upload size={17} />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-foreground">Upload Study Resource</h2>
              <p className="text-[11px] text-muted-foreground">Publish PDFs, formula sheets, or IELTS packs across sections</p>
            </div>
          </div>

          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
          
          {/* Target Section */}
          <div>
            <label className="block font-bold text-foreground mb-1 text-[11px]">Academic Section:</label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { key: 'cee', label: '🩺 CEE Medical' },
                { key: 'see', label: '🎒 SEE Class 10' },
                { key: 'ielts', label: '🌍 IELTS' },
                { key: 'neb', label: '🎓 NEB 11/12' },
                { key: 'ioe', label: '📐 IOE Eng' },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setProgram(item.key as any)}
                  className={`py-1.5 px-2 rounded-xl font-bold text-center transition-all cursor-pointer ${
                    program === item.key
                      ? 'bg-primary text-white'
                      : 'bg-card border border-border text-foreground hover:bg-muted'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block font-bold text-foreground mb-1">Resource Title:</label>
            <input
              type="text"
              required
              placeholder="e.g. CEE Botany Cell Biology Comprehensive Lecture Notes"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-field w-full py-2 text-xs"
            />
          </div>

          {/* Resource Type & Subject */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block font-semibold text-foreground mb-1">Resource Type:</label>
              <select
                value={fileType}
                onChange={(e) => setFileType(e.target.value)}
                className="input-field w-full py-2 text-xs"
              >
                <option value="pdf_notes">PDF Lecture Handout</option>
                <option value="formula_sheet">Formula Cheat Sheet</option>
                <option value="model_question">Model Board Question Paper</option>
                <option value="ielts_pack">IELTS Essay &amp; Cue Card Pack</option>
                <option value="syllabus">Official Syllabus Document</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-foreground mb-1">Subject / Domain:</label>
              <input
                type="text"
                placeholder="e.g. Physics, Chemistry, English"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="input-field w-full py-2 text-xs"
              />
            </div>
          </div>

          {/* PDF / File Link */}
          <div>
            <label className="block font-semibold text-foreground mb-1 flex items-center gap-1.5">
              <LinkIcon size={13} className="text-primary" /> External File / CDN Storage URL (PDF, Drive, R2):
            </label>
            <input
              type="url"
              placeholder="https://cdn.samyak.edu.np/handouts/my-notes.pdf"
              value={pdfUrl}
              onChange={(e) => setPdfUrl(e.target.value)}
              className="input-field w-full py-2 text-xs font-mono"
            />
          </div>

          {/* Optional Markdown Handout Notes */}
          <div>
            <label className="block font-semibold text-foreground mb-1">
              Inline Handout Content (Markdown / KaTeX Math):
            </label>
            <textarea
              rows={3}
              placeholder="Write summary notes or KaTeX formulas here (e.g. $$E = mc^2$$)..."
              value={contentMarkdown}
              onChange={(e) => setContentMarkdown(e.target.value)}
              className="input-field w-full py-1.5 text-xs font-mono"
            />
          </div>

          {/* Access Tier */}
          <div className="flex items-center justify-between p-3 bg-muted/40 rounded-xl border border-border">
            <div className="flex items-center gap-2">
              {isPremium ? <Lock size={15} className="text-amber-500" /> : <Globe size={15} className="text-emerald-500" />}
              <div>
                <p className="font-bold text-foreground text-xs">
                  {isPremium ? 'Pro Subscription Required' : 'Free Public Starter Handout'}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {isPremium ? 'Only paid CEE/SEE/IELTS subscribers can access' : 'Accessible to all visitors & students'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsPremium(!isPremium)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                isPremium ? 'bg-amber-500/20 text-amber-500' : 'bg-emerald-500/20 text-emerald-500'
              }`}
            >
              {isPremium ? 'PRO ONLY' : 'FREE ACCESS'}
            </button>
          </div>

          {/* Footer Submit */}
          <div className="pt-2 border-t border-border flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary py-1.5 px-3 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary py-1.5 px-4 text-xs font-bold flex items-center gap-1.5"
            >
              {submitting ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={14} />}
              Publish Resource
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
