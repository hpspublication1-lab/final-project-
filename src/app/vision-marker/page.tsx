'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import PublicNav from '@/components/PublicNav';
import {
  Camera, Upload, Sparkles, CheckCircle2, AlertTriangle, RefreshCw,
  Award, FileText, Check, X, ArrowRight, Eye, Image as ImageIcon, BookOpen
} from 'lucide-react';
import toast from 'react-hot-toast';
import { VisionMarkerResult } from '@/app/api/ai/vision-marker/route';

export default function VisionMarkerPage() {
  const [isDark, setIsDark] = useState(false);
  const [subject, setSubject] = useState('physics');
  const [questionContext, setQuestionContext] = useState('');
  
  // Image State
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [evaluating, setEvaluating] = useState(false);
  const [result, setResult] = useState<VisionMarkerResult | null>(null);

  // Camera Stream
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  useEffect(() => {
    if (isDark) {
      document.documentElement?.classList?.add('dark');
    } else {
      document.documentElement?.classList?.remove('dark');
    }
  }, [isDark]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (PNG, JPG, JPEG).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target?.result as string);
      setResult(null);
    };
    reader.readAsDataURL(file);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch {
      toast.error('Could not access camera. Please upload an image file instead.');
    }
  };

  const captureCameraPhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg');
      setImagePreview(dataUrl);
      stopCamera();
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((t) => t.stop());
    }
    setIsCameraActive(false);
  };

  const handleEvaluateVision = async () => {
    if (!imagePreview) {
      toast.error('Please capture or upload a photo of your handwritten paper first.');
      return;
    }

    setEvaluating(true);
    try {
      const res = await fetch('/api/ai/vision-marker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: imagePreview,
          subjectCategory: subject,
          questionContext,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.details || data.error || 'Vision evaluation failed');

      setResult(data);
      toast.success(`🎉 Evaluated! Score: ${data.score}/100 (${data.verdict})`);

      setTimeout(() => {
        document.getElementById('vision-result')?.scrollIntoView({ behavior: 'smooth' });
      }, 200);
    } catch (err: any) {
      toast.error(err.message || 'Vision evaluation failed.');
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <PublicNav isDark={isDark} onToggleDark={() => setIsDark(!isDark)} />

      {/* Hero Banner */}
      <section className="pt-28 pb-10 bg-gradient-to-b from-amber-500/10 via-card to-background border-b border-border">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 text-amber-600 text-xs font-black border border-amber-500/20">
              <Camera size={14} /> GPT-4o Vision Handwriting Marker &amp; OCR Engine
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-foreground tracking-tight leading-tight">
              Snap a Photo of Your <br />
              <span className="text-amber-600">Handwritten Notebook or Exam Paper</span>
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              Our AI Vision Marker reads your handwriting, verifies step-by-step mathematical derivations, marks mistakes, and grades handwritten IELTS essays and CEE/SEE paper answers!
            </p>
          </div>
        </div>
      </section>

      {/* Main Workspace */}
      <section className="py-8 max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-1 space-y-8">
        <div className="grid lg:grid-cols-12 gap-8 items-start">

          {/* Left Column: Photo Upload / Camera Stream */}
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <h3 className="text-sm font-bold text-foreground">1. Select Subject &amp; Capture Paper Photo</h3>
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600">AI OCR VISION</span>
              </div>

              {/* Subject Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Subject Category:</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'physics', label: '🔬 Physics' },
                    { id: 'math', label: '📐 Math' },
                    { id: 'chemistry', label: '🧪 Chemistry' },
                    { id: 'ielts-essay', label: '✍️ IELTS Essay' },
                    { id: 'see-class-10', label: '📘 SEE Class 10' },
                    { id: 'cee-medical', label: '🩺 CEE Medical' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSubject(cat.id)}
                      className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                        subject === cat.id
                          ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                          : 'bg-muted/40 border-border text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Optional Question Context */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Question Context (Optional):</label>
                <input
                  type="text"
                  value={questionContext}
                  onChange={(e) => setQuestionContext(e.target.value)}
                  placeholder="e.g., 'Derive pressure formula P=F/A' or 'Task 2 Essay on Education'"
                  className="w-full p-3 bg-muted/50 border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium"
                />
              </div>

              {/* Camera & File Input Area */}
              <div className="space-y-4">
                {isCameraActive ? (
                  <div className="relative rounded-2xl overflow-hidden bg-black aspect-video flex items-center justify-center">
                    <video ref={videoRef} className="w-full h-full object-cover" />
                    <button
                      onClick={captureCameraPhoto}
                      className="absolute bottom-4 px-6 py-2.5 rounded-full bg-amber-600 text-white font-extrabold text-xs shadow-lg hover:bg-amber-700 transition-all flex items-center gap-2"
                    >
                      <Camera size={16} />
                      <span>Take Photo Now</span>
                    </button>
                  </div>
                ) : imagePreview ? (
                  <div className="relative rounded-2xl overflow-hidden border border-border bg-muted/20 aspect-video flex items-center justify-center p-2">
                    <img src={imagePreview} alt="Handwritten Paper" className="max-h-full object-contain rounded-xl" />
                    <button
                      onClick={() => setImagePreview(null)}
                      className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white hover:bg-black transition-colors"
                      title="Clear photo"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-border rounded-2xl p-8 text-center space-y-4 bg-muted/20 hover:border-amber-500/40 transition-all">
                    <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto">
                      <ImageIcon size={24} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">Upload or Take a Photo of Your Paper</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Supports PNG, JPG, JPEG photos of handwritten pages</p>
                    </div>

                    <div className="flex items-center justify-center gap-3 pt-2">
                      <label className="px-4 py-2.5 rounded-xl bg-amber-600 text-white font-extrabold text-xs cursor-pointer hover:bg-amber-700 transition-all flex items-center gap-2 shadow-sm">
                        <Upload size={14} />
                        <span>Choose File</span>
                        <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                      </label>

                      <button
                        onClick={startCamera}
                        className="px-4 py-2.5 rounded-xl bg-card border border-border text-foreground font-bold text-xs hover:bg-muted transition-all flex items-center gap-2"
                      >
                        <Camera size={14} className="text-amber-600" />
                        <span>Use Camera</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Evaluate Button */}
              <button
                onClick={handleEvaluateVision}
                disabled={evaluating || !imagePreview}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-600/25 transition-all disabled:opacity-50"
              >
                {evaluating ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" />
                    <span>GPT-4o Vision Reading Handwriting &amp; Marking Steps...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    <span>Evaluate Handwritten Paper &amp; Mark Errors</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Column: AI Vision Evaluation Results */}
          <div className="lg:col-span-6 space-y-6">
            {result ? (
              <div id="vision-result" className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-6 animate-fadeIn">
                {/* Result Header */}
                <div className="flex items-center justify-between pb-4 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-2xl bg-amber-600 text-white flex flex-col items-center justify-center font-black shadow-md shadow-amber-600/20">
                      <span className="text-2xl">{result.score}</span>
                      <span className="text-[8px] uppercase tracking-wider text-white/90">SCORE / 100</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-foreground flex items-center gap-2">
                        {result.verdict} Verdict
                        <CheckCircle2 size={18} className="text-success" />
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Handwriting Legibility: <span className="font-bold text-amber-600">{result.handwritingLegibilityScore}% readable</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Extracted OCR Text */}
                <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-1.5">
                  <span className="text-xs font-bold uppercase text-muted-foreground">Extracted OCR Text:</span>
                  <p className="text-xs font-mono text-foreground leading-relaxed whitespace-pre-line bg-card p-3 rounded-xl border border-border">
                    {result.ocrTranscription}
                  </p>
                </div>

                {/* Step-by-Step Analysis */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase text-foreground">Step-by-Step Error &amp; Notation Analysis:</h4>
                  <div className="space-y-2.5">
                    {result.stepByStepAnalysis.map((step, idx) => (
                      <div
                        key={idx}
                        className={`p-3.5 rounded-2xl border text-xs space-y-1.5 ${
                          step.status === 'correct'
                            ? 'bg-success/10 border-success/20 text-foreground'
                            : 'bg-amber-500/10 border-amber-500/20 text-foreground'
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold">
                          <span>Step {step.stepNumber}: &ldquo;{step.extractedText}&rdquo;</span>
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                            step.status === 'correct' ? 'bg-success/20 text-success' : 'bg-amber-500/20 text-amber-600'
                          }`}>
                            {step.status === 'correct' ? '✓ Correct' : '⚠️ Minor Error'}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-snug">{step.feedback}</p>
                        {step.correction && (
                          <p className="text-[11px] font-mono font-semibold text-amber-600">
                            Correction: {step.correction}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Model Answer */}
                {result.modelAnswer && (
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-1.5">
                    <h5 className="text-xs font-extrabold uppercase text-amber-600">Textbook Model Solution:</h5>
                    <p className="text-xs font-serif italic text-foreground leading-relaxed">
                      &ldquo;{result.modelAnswer}&rdquo;
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-card border border-border rounded-3xl p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto">
                  <Eye size={24} />
                </div>
                <h3 className="text-sm font-bold text-foreground">AI Vision Marking Workspace</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Upload or capture your handwritten paper photo on the left. The AI will extract handwriting via OCR and mark errors step-by-step.
                </p>
              </div>
            )}
          </div>

        </div>
      </section>
    </div>
  );
}
