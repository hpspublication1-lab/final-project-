'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import PublicNav from '@/components/PublicNav';
import { useProgram, COURSES_MAP, CanonicalCourseId, normalizeCourseId } from '@/contexts/ProgramContext';
import { Search, Star, Clock, Users, BookOpen, CheckCircle, ArrowRight, Sparkles } from 'lucide-react';

interface Course {
  id: string;
  title: string;
  sector: CanonicalCourseId;
  category: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels';
  instructor: {
    name: string;
    role: string;
    avatar: string;
  };
  duration: string;
  lecturesCount: number;
  studentsEnrolled: number;
  rating: number;
  reviewsCount: number;
  priceNpr: number;
  originalPriceNpr: number;
  badge?: string;
  features: string[];
  thumbnail: string;
}

const COURSES_DATA: Course[] = [
  // CEE Medical Entrance Sector
  {
    id: 'cee-mbbs-mastery-2026',
    title: 'CEE Medical Entrance Super Target Batch 2026',
    sector: 'cee_medical',
    category: 'Full Course',
    level: 'Advanced',
    instructor: { name: 'Dr. Samyak Shrestha', role: 'Chief Medical Educator', avatar: '🩺' },
    duration: '6 Months',
    lecturesCount: 180,
    studentsEnrolled: 3420,
    rating: 4.9,
    reviewsCount: 480,
    priceNpr: 7990,
    originalPriceNpr: 14990,
    badge: 'MOST POPULAR',
    features: ['15,000+ Topicwise MCQs', 'Live Interactive Doubt Classes', 'MEC 200-Question Mock Papers', 'HD Chapter Video Lectures'],
    thumbnail: '🧬',
  },
  {
    id: 'cee-physics-chemistry-booster',
    title: 'CEE Physics & Chemistry High-Yield Formula Batch',
    sector: 'cee_medical',
    category: 'Subject Special',
    level: 'Intermediate',
    instructor: { name: 'Er. Aakash Sharma', role: 'Senior Physics Faculty', avatar: '⚡' },
    duration: '3 Months',
    lecturesCount: 90,
    studentsEnrolled: 1850,
    rating: 4.8,
    reviewsCount: 210,
    priceNpr: 3990,
    originalPriceNpr: 6990,
    badge: 'HIGH YIELD',
    features: ['Numerical Short Tricks', 'Organic Chemistry Reactions Sheet', '10 Years Past Questions Solved', 'Daily Quiz Series'],
    thumbnail: '🧪',
  },
  {
    id: 'cee-45-day-crash-course',
    title: 'CEE 45-Day Ultimate Crash Course 2026',
    sector: 'cee_medical',
    category: 'Crash Course',
    level: 'Advanced',
    instructor: { name: 'Dr. Riya Adhikari', role: 'Zoology Specialist', avatar: '🦁' },
    duration: '45 Days',
    lecturesCount: 120,
    studentsEnrolled: 2900,
    rating: 4.9,
    reviewsCount: 390,
    priceNpr: 2299,
    originalPriceNpr: 4990,
    badge: 'CRASH COURSE',
    features: ['Fast-Track Revision Notes', '20 Full-Length Mock Exams', 'Mental Agility Test (MAT) Tricks', '24/7 AI Tutor Access'],
    thumbnail: '⚡',
  },

  // SEE Class 10 Sector
  {
    id: 'see-class-10-board-topper-batch',
    title: 'SEE Class 10 Board Topper Batch 2082/2083',
    sector: 'see_class_10',
    category: 'Full Board Prep',
    level: 'All Levels',
    instructor: { name: 'Pradeep Poudel Sir', role: 'NEB Master Educator', avatar: '🎓' },
    duration: 'Full Academic Year',
    lecturesCount: 220,
    studentsEnrolled: 5100,
    rating: 4.95,
    reviewsCount: 820,
    priceNpr: 4990,
    originalPriceNpr: 9990,
    badge: 'BOARD TOPPER',
    features: ['Compulsory Science & Math Solved', 'Model Question Paper Bank', 'Chapter-wise HD Video Notes', 'AI Handwritten Answer Checker'],
    thumbnail: '🔬',
  },
  {
    id: 'see-opt-math-science-mastery',
    title: 'SEE Optional Math & Science Score Booster',
    sector: 'see_class_10',
    category: 'Subject Special',
    level: 'Intermediate',
    instructor: { name: 'Kiran Thapa Sir', role: 'Maths Head', avatar: '📐' },
    duration: '4 Months',
    lecturesCount: 80,
    studentsEnrolled: 2150,
    rating: 4.85,
    reviewsCount: 310,
    priceNpr: 2990,
    originalPriceNpr: 5490,
    badge: '4.0 GPA TARGET',
    features: ['Opt Math Trigonometry Solved', 'Physics & Chemistry Diagrams', 'Formula Wallsheets', 'Previous 8 Year Questions'],
    thumbnail: '📊',
  },

  // IELTS & English Language Sector
  {
    id: 'english-ielts-target-8-mastery',
    title: 'IELTS Academic & General Target Band 8.0+',
    sector: 'ielts',
    category: 'IELTS Prep',
    level: 'Intermediate',
    instructor: { name: 'David Miller', role: 'IELTS Ex-Examiner', avatar: '🎓' },
    duration: '8 Weeks',
    lecturesCount: 90,
    studentsEnrolled: 3100,
    rating: 4.92,
    reviewsCount: 540,
    priceNpr: 3490,
    originalPriceNpr: 6990,
    badge: 'BAND 8.0+',
    features: ['AI Speaking Simulation Mock Tests', 'Writing Task 1 & 2 Correction', 'Listening Audio Modules', 'Reading Speed Strategies'],
    thumbnail: '📚',
  },
  {
    id: 'english-spoken-fluency-pro',
    title: 'Spoken English & Professional Confidence Masterclass',
    sector: 'ielts',
    category: 'Fluency & Speaking',
    level: 'Beginner',
    instructor: { name: 'Sarah Jenkins', role: 'ESL Certified Instructor', avatar: '🗣️' },
    duration: '60 Days',
    lecturesCount: 60,
    studentsEnrolled: 4200,
    rating: 4.9,
    reviewsCount: 670,
    priceNpr: 1990,
    originalPriceNpr: 3990,
    badge: 'BESTSELLER',
    features: ['Daily Speaking Practice Drills', 'Accent & Pronunciation Guide', 'Professional Email & Job Interviews', 'AI Speech Feedback'],
    thumbnail: '💬',
  },

  // Digital Marketing Sector
  {
    id: 'digital-marketing-canva-freelancing',
    title: 'Meta Ads, TikTok Viral Growth & Digital Marketing Masterclass',
    sector: 'digital_marketing',
    category: 'Performance Marketing',
    level: 'Beginner',
    instructor: { name: 'Pooja Thapa', role: 'Digital Marketer & Creator', avatar: '📈' },
    duration: '6 Weeks',
    lecturesCount: 55,
    studentsEnrolled: 2700,
    rating: 4.87,
    reviewsCount: 310,
    priceNpr: 1990,
    originalPriceNpr: 3990,
    badge: 'HIGH ROAS',
    features: ['Facebook & Instagram Pixel Setup', 'TikTok Viral Short Hooks', '100+ Ad Copy Swipe Files', 'Upwork & Fiverr Client Blueprints'],
    thumbnail: '📈',
  },

  // Artificial Intelligence Sector
  {
    id: 'digital-ai-prompt-engineering',
    title: 'AI Tools, ChatGPT & Prompt Engineering Studio',
    sector: 'artificial_intelligence',
    category: 'Artificial Intelligence',
    level: 'Beginner',
    instructor: { name: 'Nabin KC', role: 'AI Consultant & Developer', avatar: '🤖' },
    duration: '30 Days',
    lecturesCount: 40,
    studentsEnrolled: 6300,
    rating: 4.96,
    reviewsCount: 1100,
    priceNpr: 1490,
    originalPriceNpr: 3490,
    badge: 'HOT & TRENDING',
    features: ['ChatGPT, Claude & Midjourney Mastery', 'Prompt Engineering Interactive Sandbox', 'No-Code AI App Creation', 'AI Specialist Certificate'],
    thumbnail: '🧠',
  },
  {
    id: 'digital-python-programming-zero-to-hero',
    title: 'Python for AI & Automation (5 Real-World Projects)',
    sector: 'artificial_intelligence',
    category: 'Programming',
    level: 'Beginner',
    instructor: { name: 'Rohan Shrestha', role: 'Full Stack AI Engineer', avatar: '🐍' },
    duration: '8 Weeks',
    lecturesCount: 75,
    studentsEnrolled: 3800,
    rating: 4.89,
    reviewsCount: 430,
    priceNpr: 2490,
    originalPriceNpr: 4990,
    badge: 'CAREER STARTER',
    features: ['5 Practical Real-World AI Projects', 'Web Scraping & Data Processing', 'Custom LLM API Integrations', 'GitHub Portfolio Setup'],
    thumbnail: '⚡',
  },
];

export default function MasterCourseCatalogPage() {
  const { setProgram } = useProgram();
  const [isDark, setIsDark] = useState(false);
  const [selectedSector, setSelectedSector] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');

  React.useEffect(() => {
    if (isDark) {
      document.documentElement?.classList?.add('dark');
    } else {
      document.documentElement?.classList?.remove('dark');
    }
  }, [isDark]);

  const filteredCourses = COURSES_DATA.filter((course) => {
    const matchesSector = selectedSector === 'all' || course.sector === selectedSector;
    const matchesSearch =
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.instructor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = selectedLevel === 'all' || course.level === selectedLevel;
    return matchesSector && matchesSearch && matchesLevel;
  });

  const getSectorBadgeColor = (sec: CanonicalCourseId) => {
    switch (sec) {
      case 'cee_medical': return 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20';
      case 'see_class_10': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      case 'ielts': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'digital_marketing': return 'bg-rose-500/10 text-rose-600 border-rose-500/20';
      case 'artificial_intelligence': return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <PublicNav isDark={isDark} onToggleDark={() => setIsDark(!isDark)} />

      {/* Catalog Hero Banner */}
      <section className="relative pt-28 pb-14 bg-gradient-to-b from-primary/10 via-card to-background border-b border-border overflow-hidden">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-black shadow-sm">
              <Sparkles size={14} /> Soumya Guru Multi-Course Catalog
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-foreground">
              Master Any Skill or Exam with Nepal&apos;s Top Batches
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Explore SEE Class 10 Board, CEE Medical Entrance, IELTS Mastery, Digital Marketing, and Artificial Intelligence. Top faculties, HD video lectures, live doubt sessions &amp; study notes.
            </p>
          </div>

          {/* Search & Quick Filters */}
          <div className="mt-8 grid md:grid-cols-12 gap-4 items-center">
            {/* Search Input */}
            <div className="md:col-span-5 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <input
                type="text"
                placeholder="Search courses, instructors, or topics (e.g. CEE, SEE, IELTS, Python, SEO)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-card border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm font-medium text-foreground outline-none transition-all shadow-sm"
              />
            </div>

            {/* Sector Tabs */}
            <div className="md:col-span-7 flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setSelectedSector('all')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  selectedSector === 'all' ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-card border border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                🌟 All Courses
              </button>
              <button
                onClick={() => setSelectedSector('see_class_10')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  selectedSector === 'see_class_10' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-card border border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                🎓 SEE Class 10
              </button>
              <button
                onClick={() => setSelectedSector('cee_medical')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  selectedSector === 'cee_medical' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-card border border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                🩺 CEE Medical
              </button>
              <button
                onClick={() => setSelectedSector('ielts')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  selectedSector === 'ielts' ? 'bg-amber-600 text-white shadow-sm' : 'bg-card border border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                🗣️ IELTS English
              </button>
              <button
                onClick={() => setSelectedSector('digital_marketing')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  selectedSector === 'digital_marketing' ? 'bg-rose-600 text-white shadow-sm' : 'bg-card border border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                📈 Marketing
              </button>
              <button
                onClick={() => setSelectedSector('artificial_intelligence')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  selectedSector === 'artificial_intelligence' ? 'bg-purple-600 text-white shadow-sm' : 'bg-card border border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                🤖 AI Academy
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Course Grid Section */}
      <section className="py-12 flex-1 max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 w-full">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-border">
          <div>
            <h2 className="text-xl font-bold text-foreground">Available Batches ({filteredCourses.length})</h2>
            <p className="text-xs text-muted-foreground">Enrolling for current academic session 2082/2083</p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-muted-foreground hidden sm:inline">Level Filter:</span>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="bg-card border border-border rounded-xl px-3 py-1.5 text-xs font-bold text-foreground outline-none cursor-pointer"
            >
              <option value="all">All Levels</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>
        </div>

        {/* Course Cards Grid */}
        {filteredCourses.length === 0 ? (
          <div className="py-16 text-center bg-card border border-border rounded-3xl p-8 max-w-lg mx-auto shadow-xs">
            <span className="text-5xl block mb-4">🔍</span>
            <h3 className="text-xl font-bold text-foreground">No Batches Found</h3>
            <p className="text-sm text-muted-foreground mt-2 mb-6">
              We couldn&apos;t find any courses matching your search or filters. Try resetting search parameters.
            </p>
            <button
              onClick={() => {
                setSelectedSector('all');
                setSearchQuery('');
                setSelectedLevel('all');
              }}
              className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-md hover:bg-primary/90 transition-all"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredCourses.map((course) => {
              const getBannerGradient = (sec: CanonicalCourseId) => {
                switch (sec) {
                  case 'cee_medical': return 'from-indigo-600/20 via-purple-600/10 to-primary/20';
                  case 'see_class_10': return 'from-emerald-600/20 via-teal-600/10 to-emerald-500/20';
                  case 'ielts': return 'from-amber-600/20 via-orange-600/10 to-amber-500/20';
                  case 'digital_marketing': return 'from-rose-600/20 via-pink-600/10 to-rose-500/20';
                  case 'artificial_intelligence': return 'from-purple-600/20 via-indigo-600/10 to-purple-500/20';
                }
              };

              return (
                <div
                  key={course.id}
                  className="group relative bg-card border border-border rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:border-primary/40 transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    {/* Header Banner Thumbnail */}
                    <div className={`relative h-44 bg-gradient-to-br ${getBannerGradient(course.sector)} flex items-center justify-center p-6 border-b border-border/60`}>
                      <span className="text-6xl group-hover:scale-110 transition-transform duration-300 drop-shadow-md">
                        {course.thumbnail}
                      </span>

                      {/* Badge top right */}
                      {course.badge && (
                        <span className="absolute top-3 right-3 bg-primary text-primary-foreground text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
                          {course.badge}
                        </span>
                      )}

                      {/* Sector Tag top left */}
                      <span className={`absolute top-3 left-3 text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full border bg-card/90 backdrop-blur-sm ${getSectorBadgeColor(course.sector)}`}>
                        {COURSES_MAP[course.sector]?.shortName || 'Course'}
                      </span>
                    </div>

                    {/* Body Content */}
                    <div className="p-5 sm:p-6 space-y-3">
                      <div className="flex items-center justify-between text-[11px] font-bold">
                        <span className="text-primary font-bold">{course.category}</span>
                        <div className="flex items-center gap-1 text-amber-500">
                          <Star size={12} className="fill-amber-500" />
                          <span className="text-foreground font-extrabold">{course.rating}</span>
                          <span className="text-muted-foreground font-normal">({course.reviewsCount})</span>
                        </div>
                      </div>

                      <h3 className="text-base sm:text-lg font-extrabold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                        {course.title}
                      </h3>

                      {/* Instructor */}
                      <div className="flex items-center gap-2.5 pt-1">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm border border-border">
                          {course.instructor.avatar}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-foreground leading-tight">{course.instructor.name}</p>
                          <p className="text-[10px] text-muted-foreground">{course.instructor.role}</p>
                        </div>
                      </div>

                      {/* Metrics */}
                      <div className="grid grid-cols-3 gap-2 py-3 px-3 rounded-2xl bg-muted/40 text-[11px] font-semibold text-muted-foreground border border-border/40">
                        <div className="flex items-center gap-1">
                          <Clock size={13} className="text-primary" />
                          <span>{course.duration}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <BookOpen size={13} className="text-primary" />
                          <span>{course.lecturesCount} Lectures</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users size={13} className="text-primary" />
                          <span>{course.studentsEnrolled}+ Enrolled</span>
                        </div>
                      </div>

                      {/* Feature Checkpoints */}
                      <ul className="space-y-1.5 pt-1">
                        {course.features.slice(0, 3).map((feat, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-xs font-medium text-foreground">
                            <CheckCircle size={13} className="text-success shrink-0" />
                            <span className="truncate">{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Footer / Price & Enrollment */}
                  <div className="p-5 sm:p-6 pt-0 border-t border-border/40 mt-4 flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-lg font-black text-foreground">Rs {course.priceNpr.toLocaleString()}</span>
                        <span className="text-xs font-semibold text-muted-foreground line-through">Rs {course.originalPriceNpr.toLocaleString()}</span>
                      </div>
                      <span className="text-[10px] font-bold text-success">
                        Save {Math.round(((course.originalPriceNpr - course.priceNpr) / course.originalPriceNpr) * 100)}% Discount
                      </span>
                    </div>

                    <Link
                      href={`/checkout?sku=${course.id}`}
                      onClick={() => setProgram(course.sector)}
                      className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-extrabold flex items-center gap-1.5 shadow-md hover:bg-primary/90 transition-all"
                    >
                      <span>Enroll Now</span>
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
