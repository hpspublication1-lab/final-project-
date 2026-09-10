'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import {
  Play,
  PlayCircle,
  CheckCircle2,
  Clock,
  Search,
  BookOpen,
  HelpCircle,
  FileText,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Layers,
  Award,
  Video,
  Loader2,
  Maximize2,
  Volume2,
  RotateCcw,
  Globe,
} from 'lucide-react';
import MathRenderer from '@/components/common/MathRenderer';
import BunnyHlsPlayer from '@/components/video/BunnyHlsPlayer';
import { useProgram, normalizeCourseId } from '@/contexts/ProgramContext';

interface VideoItem {
  id: string;
  guid: string;
  rawTitle: string;
  title: string;
  unit?: string;
  part?: string;
  collectionId?: string;
  collectionName: string;
  subject: string;
  subjectDisplayName: string;
  nepaliSubjectName?: string;
  medium?: 'english' | 'nepali' | 'both';
  mediumDisplayName?: string;
  duration: number;
  durationSec: number;
  thumbnailUrl: string;
  videoUrl: string;
  embedUrl: string;
  views: number;
}

interface CollectionItem {
  guid: string;
  name: string;
  videoCount: number;
}

export default function LectureVideosClient() {
  const { program } = useProgram();
  const canonicalId = normalizeCourseId(program);

  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [collections, setCollections] = useState<CollectionItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedMedium, setSelectedMedium] = useState<'all' | 'english' | 'nepali'>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedCollection, setSelectedCollection] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Active playing video
  const [activeVideo, setActiveVideo] = useState<VideoItem | null>(null);
  const [activeVideoIndex, setActiveVideoIndex] = useState<number>(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Fetch all videos from Bunny Stream API with medium parameter
  useEffect(() => {
    async function loadVideos() {
      try {
        setLoading(true);
        const res = await fetch(`/api/bunny/videos?medium=${selectedMedium}`);
        if (res.ok) {
          const data = await res.json();
          const vids: VideoItem[] = data.videos || [];
          setVideos(vids);
          setCollections(data.collections || []);
          if (vids.length > 0) {
            setActiveVideo(vids[0]);
            setActiveVideoIndex(0);
          }
        }
      } catch (e) {
        console.error('Failed to load Bunny videos:', e);
      } finally {
        setLoading(false);
      }
    }
    loadVideos();
  }, [selectedMedium]);

  // Dynamic Subject Tabs computed from current videos
  const scienceCount = videos.filter((v) => v.subject === 'science').length;
  const mathCount = videos.filter((v) => v.subject === 'math').length;
  const optMathCount = videos.filter((v) => v.subject === 'opt_math').length;
  const englishCount = videos.filter((v) => v.subject === 'english').length;
  const socialCount = videos.filter((v) => v.subject === 'social_studies').length;

  const subjectTabs =
    canonicalId === 'cee_medical'
      ? [
          { id: 'all', label: `All CEE Subjects (${videos.length})` },
          { id: 'biology', label: `🧬 Biology (${videos.filter((v) => v.subject === 'biology').length})` },
          { id: 'chemistry', label: `⚗️ Chemistry (${videos.filter((v) => v.subject === 'chemistry').length})` },
          { id: 'physics', label: `⚡ Physics (${videos.filter((v) => v.subject === 'physics').length})` },
          { id: 'mat', label: `🧠 MAT (${videos.filter((v) => v.subject === 'mat').length})` },
        ]
      : selectedMedium === 'nepali'
      ? [
          { id: 'all', label: `सबै विषयहरू (${videos.length})` },
          { id: 'science', label: `🔬 विज्ञान तथा प्रविधि (${scienceCount})` },
          { id: 'math', label: `📐 अनिवार्य गणित (${mathCount})` },
          { id: 'opt_math', label: `📊 ऐच्छिक गणित (${optMathCount})` },
          { id: 'english', label: `📚 अंग्रेजी भाषा (${englishCount})` },
          { id: 'social_studies', label: `🏛️ सामाजिक अध्ययन (${socialCount})` },
        ]
      : [
          { id: 'all', label: `All SEE Subjects (${videos.length})` },
          { id: 'science', label: `🔬 Science & Tech (${scienceCount})` },
          { id: 'math', label: `📐 Compulsory Math (${mathCount})` },
          { id: 'opt_math', label: `📊 Optional Math (${optMathCount})` },
          { id: 'english', label: `📚 English (${englishCount})` },
          { id: 'social_studies', label: `🏛️ Social Studies (${socialCount})` },
        ];

  // Filtered video list
  const filteredVideos = videos.filter((v) => {
    const matchesSubject =
      selectedSubject === 'all' || v.subject === selectedSubject;
    const matchesCollection =
      selectedCollection === 'all' || v.collectionId === selectedCollection;
    const matchesSearch =
      !searchQuery ||
      v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.rawTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.collectionName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.subjectDisplayName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSubject && matchesCollection && matchesSearch;
  });

  const formatDuration = (seconds: number) => {
    if (!seconds) return '0m';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m >= 60) {
      const h = Math.floor(m / 60);
      const remM = m % 60;
      return `${h}h ${remM}m`;
    }
    return `${m}m ${s < 10 ? '0' : ''}${s}s`;
  };

  const handleSelectVideo = (v: VideoItem, index: number) => {
    setActiveVideo(v);
    setActiveVideoIndex(index);
    // Scroll smoothly to player
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNextVideo = () => {
    if (activeVideoIndex + 1 < filteredVideos.length) {
      const next = filteredVideos[activeVideoIndex + 1];
      setActiveVideo(next);
      setActiveVideoIndex(activeVideoIndex + 1);
    }
  };

  const handlePrevVideo = () => {
    if (activeVideoIndex > 0) {
      const prev = filteredVideos[activeVideoIndex - 1];
      setActiveVideo(prev);
      setActiveVideoIndex(activeVideoIndex - 1);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-7xl mx-auto pb-20">
        
        {/* Header Breadcrumb */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Link href="/student-dashboard" className="hover:text-foreground transition-colors">
              {canonicalId === 'cee_medical' ? 'CEE Home' : 'SEE Home'}
            </Link>
            <ChevronRight size={13} />
            <span className="font-bold text-foreground">Video Lectures (HD)</span>
          </div>
          <span className="text-xs font-mono font-bold px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
            {videos.length} Total Master Lectures Available
          </span>
        </div>

        {/* ACTIVE THEATER VIDEO PLAYER */}
        {activeVideo && (
          <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-xl">
            <div className="grid grid-cols-1 lg:grid-cols-12">
              
              {/* Left 8 cols: Video Embed / Stream */}
              <div className="lg:col-span-8 bg-black flex flex-col justify-center relative">
                <BunnyHlsPlayer
                  videoUrl={activeVideo.videoUrl}
                  thumbnailUrl={activeVideo.thumbnailUrl}
                  title={activeVideo.title}
                  onEnded={handleNextVideo}
                />
              </div>

              {/* Right 4 cols: Current Video Meta & Quick Controls */}
              <div className="lg:col-span-4 p-5 sm:p-6 flex flex-col justify-between space-y-4 bg-card border-t lg:border-t-0 lg:border-l border-border">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 font-mono">
                      {activeVideo.subjectDisplayName}
                    </span>
                    <span className="text-xs font-mono text-muted-foreground flex items-center gap-1">
                      <Clock size={12} /> {formatDuration(activeVideo.duration)}
                    </span>
                  </div>

                  <h2 className="text-base sm:text-lg font-black text-foreground leading-snug">
                    {activeVideo.title}
                  </h2>

                  <p className="text-xs text-muted-foreground font-mono">
                    📂 Playlist: {activeVideo.collectionName}
                  </p>
                </div>

                {/* Playlist Next/Prev Navigation */}
                <div className="space-y-3 pt-3 border-t border-border">
                  <div className="flex items-center justify-between gap-2">
                    <button
                      onClick={handlePrevVideo}
                      disabled={activeVideoIndex === 0}
                      className="flex-1 py-2 rounded-xl bg-muted hover:bg-muted/80 disabled:opacity-40 text-foreground font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <ChevronLeft size={14} /> Previous
                    </button>

                    <button
                      onClick={handleNextVideo}
                      disabled={activeVideoIndex + 1 >= filteredVideos.length}
                      className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                    >
                      Next Lesson <ChevronRight size={14} />
                    </button>
                  </div>

                  {/* 1-Click Practice & Resource Links */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Link
                      href={canonicalId === 'cee_medical' ? '/practice' : '/see/question-bank'}
                      className="py-2 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 text-center text-xs font-black flex items-center justify-center gap-1.5 transition-colors border border-emerald-500/20"
                    >
                      <HelpCircle size={13} />
                      <span>{canonicalId === 'cee_medical' ? 'Practice MCQs →' : 'Practice Qs →'}</span>
                    </Link>

                    <Link
                      href={canonicalId === 'cee_medical' ? '/mock-tests' : '/see/question-bank'}
                      className="py-2 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 text-center text-xs font-black flex items-center justify-center gap-1.5 transition-colors border border-amber-500/20"
                    >
                      <FileText size={13} />
                      <span>{canonicalId === 'cee_medical' ? 'Mock Tests →' : 'Formulas →'}</span>
                    </Link>
                  </div>
                </div>

              </div>

            </div>
          </div>
        )}

        {/* MEDIUM SELECTOR BAR (For SEE & Multi-medium Courses) */}
        {canonicalId !== 'cee_medical' && (
          <div className="p-3.5 rounded-3xl bg-card border border-border shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-muted-foreground ml-1 flex items-center gap-1.5 mr-1">
                <Globe size={14} className="text-emerald-500" /> Medium / माध्यम:
              </span>
              <button
                onClick={() => {
                  setSelectedMedium('all');
                  setSelectedSubject('all');
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                  selectedMedium === 'all'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                🌐 Both Mediums ({videos.length})
              </button>
              <button
                onClick={() => {
                  setSelectedMedium('english');
                  setSelectedSubject('all');
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                  selectedMedium === 'english'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <span>🇬🇧 English Medium</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/20">379737</span>
              </button>
              <button
                onClick={() => {
                  setSelectedMedium('nepali');
                  setSelectedSubject('all');
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                  selectedMedium === 'nepali'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <span>🇳🇵 नेपाली माध्यम (Nepali Medium)</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/20">367785</span>
              </button>
            </div>

            <span className="text-[11px] text-muted-foreground font-mono px-2 py-1 rounded-lg bg-muted/40">
              {selectedMedium === 'nepali' ? 'नेपाली पाठ्यक्रम अनुसारका कक्षाहरू' : 'Adaptive 1080p HLS Stream'}
            </span>
          </div>
        )}

        {/* SUBJECT FILTER BAR */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-3xl bg-card border border-border shadow-xs">
          <div className="flex flex-wrap items-center gap-2">
            {subjectTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setSelectedSubject(tab.id);
                  setSelectedCollection('all');
                }}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                  selectedSubject === tab.id
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-muted/60 text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[220px] w-full sm:w-auto">
            <Search size={14} className="absolute left-3 top-3 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search chapters or topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-4 py-2 text-xs bg-muted/60 border border-border rounded-xl text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* VIDEO PLAYLIST GRID */}
        {loading ? (
          <div className="py-24 text-center space-y-3">
            <Loader2 size={32} className="animate-spin text-emerald-500 mx-auto" />
            <p className="text-xs text-muted-foreground font-mono">
              Loading HD video lectures from Bunny Stream library...
            </p>
          </div>
        ) : filteredVideos.length === 0 ? (
          <div className="p-12 rounded-3xl bg-card border border-border text-center space-y-2 max-w-md mx-auto">
            <Video size={36} className="text-muted-foreground mx-auto" />
            <h4 className="text-sm font-black text-foreground">No videos found</h4>
            <p className="text-xs text-muted-foreground">
              Try changing the subject filter or clearing your search term.
            </p>
            <button
              onClick={() => {
                setSelectedSubject('all');
                setSelectedMedium('all');
                setSearchQuery('');
              }}
              className="text-xs font-bold text-emerald-600 hover:underline pt-2 block mx-auto"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-black uppercase tracking-wider text-muted-foreground font-mono">
                {filteredVideos.length} LECTURES IN PLAYLIST
              </span>
              <span className="text-xs text-muted-foreground">
                Click any lecture to play instantly
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredVideos.map((v, idx) => {
                const isCurrent = activeVideo?.id === v.id;
                return (
                  <div
                    key={v.id || idx}
                    onClick={() => handleSelectVideo(v, idx)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                      isCurrent
                        ? 'bg-emerald-500/10 border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
                        : 'bg-card border-border hover:border-emerald-500/50 hover:shadow-md'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 font-mono">
                            {v.subjectDisplayName}
                          </span>
                          {v.mediumDisplayName && (
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                              v.medium === 'nepali'
                                ? 'bg-red-500/10 text-red-600 border border-red-500/20'
                                : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                            }`}>
                              {v.mediumDisplayName}
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-mono text-muted-foreground">
                          {formatDuration(v.duration)}
                        </span>
                      </div>

                      <h4 className="text-xs sm:text-sm font-black text-foreground leading-snug line-clamp-2">
                        {v.title}
                      </h4>

                      <p className="text-[11px] text-muted-foreground truncate font-mono">
                        📂 {v.collectionName}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs">
                      <span className="text-muted-foreground font-mono text-[11px]">
                        Lesson #{idx + 1}
                      </span>
                      <span
                        className={`font-black flex items-center gap-1 ${
                          isCurrent ? 'text-emerald-600' : 'text-primary hover:text-emerald-600'
                        }`}
                      >
                        <Play size={12} className="fill-current" />
                        {isCurrent ? 'Now Playing' : 'Play Now →'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
