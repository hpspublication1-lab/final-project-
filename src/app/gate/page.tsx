'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  useProgram,
  COURSES_MAP,
  CanonicalCourseId,
  normalizeCourseId,
} from '@/contexts/ProgramContext';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import {
  Stethoscope,
  Zap,
  ShieldCheck,
  GraduationCap,
  Languages,
  TrendingUp,
  Cpu,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  BookOpen,
  Award,
  Layers,
  ArrowLeft,
} from 'lucide-react';
import { toast } from 'sonner';

const PROGRAM_ICONS: Record<CanonicalCourseId, React.ElementType> = {
  cee_medical: Stethoscope,
  ioe_engineering: Zap,
  lok_sewa: ShieldCheck,
  neb_class_12: GraduationCap,
  neb_class_11: GraduationCap,
  see_class_10: GraduationCap,
  ielts: Languages,
  digital_marketing: TrendingUp,
  artificial_intelligence: Cpu,
};

const CATEGORIES = [
  {
    id: 'entrance',
    title: 'Entrance & Civil Service Competitive Exams',
    subtitle: 'High-stakes entrance tests for medical colleges, engineering institutes, and government administration',
    courses: ['cee_medical', 'ioe_engineering', 'lok_sewa'] as CanonicalCourseId[],
  },
  {
    id: 'boards',
    title: 'School & Secondary Board Examinations',
    subtitle: 'Curriculum-aligned revision, past model solutions, and board topper prep',
    courses: ['neb_class_12', 'neb_class_11', 'see_class_10'] as CanonicalCourseId[],
  },
  {
    id: 'career',
    title: 'Global Exams & Professional Digital Skills',
    subtitle: 'International language assessments, modern freelancing, and practical tech',
    courses: ['ielts', 'digital_marketing', 'artificial_intelligence'] as CanonicalCourseId[],
  },
];

export default function CourseGatePage() {
  const router = useRouter();
  const { program, setProgram } = useProgram();
  const { user } = useAuth();
  const [selectedCourse, setSelectedCourse] = useState<CanonicalCourseId>(normalizeCourseId(program));
  const [submitting, setSubmitting] = useState(false);

  const handleSelectTrack = async (courseId: CanonicalCourseId) => {
    setSelectedCourse(courseId);
    setProgram(courseId);
  };

  const handleEnterStream = async () => {
    setSubmitting(true);
    setProgram(selectedCourse);

    if (typeof window !== 'undefined') {
      localStorage.setItem('samyak_course_chosen', 'true');
    }

    // Best-effort sync to database user profile if logged in
    if (user?.id) {
      try {
        const supabase = createClient();
        await supabase
          .from('user_profiles')
          .update({
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);
      } catch {}
    }

    toast.success(`Active stream set to ${COURSES_MAP[selectedCourse].shortName}!`);
    router.push('/student-dashboard');
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/60 backdrop-blur sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link
            href="/student-dashboard"
            className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-black tracking-tight uppercase text-muted-foreground">
              Learning Gate Selector
            </span>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 sm:py-12 space-y-10">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-black">
            <Sparkles size={14} /> ADAPTIVE NEPAL CURRICULUM GATE
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Which course do you want to continue learning?
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Choose your target study program below. Your video lectures, question banks, AI doubt engine, and mock tests will automatically tune to your selected stream.
          </p>
        </div>

        {/* Categories */}
        <div className="space-y-10">
          {CATEGORIES.map((cat) => (
            <div key={cat.id} className="space-y-4">
              <div className="border-b border-border pb-2">
                <h2 className="text-base font-extrabold text-foreground flex items-center gap-2">
                  <Layers size={18} className="text-primary" /> {cat.title}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">{cat.subtitle}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {cat.courses.map((id) => {
                  const details = COURSES_MAP[id];
                  const Icon = PROGRAM_ICONS[id] || BookOpen;
                  const isSelected = selectedCourse === id;

                  return (
                    <div
                      key={id}
                      onClick={() => handleSelectTrack(id)}
                      className={`relative cursor-pointer rounded-2xl p-5 border-2 transition-all flex flex-col justify-between group ${
                        isSelected
                          ? 'border-primary bg-primary/5 ring-4 ring-primary/10 shadow-lg'
                          : 'border-border bg-card hover:border-primary/40 hover:shadow-md'
                      }`}
                    >
                      {/* Selection Radio Indicator */}
                      <div className="absolute top-4 right-4">
                        {isSelected ? (
                          <CheckCircle2 size={22} className="text-primary fill-primary/10" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-border group-hover:border-primary/50 transition-colors" />
                        )}
                      </div>

                      <div className="space-y-3 pr-6">
                        <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                          <Icon size={22} />
                        </div>

                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                            {details.badge}
                          </span>
                          <h3 className="text-base font-extrabold text-foreground mt-1.5 group-hover:text-primary transition-colors">
                            {details.name}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-3 leading-relaxed">
                            {details.description}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-border/60 space-y-2">
                        <div className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                          <Award size={13} className="text-primary" /> High-Yield Modules:
                        </div>
                        <div className="flex flex-wrap gap-1 text-[10px]">
                          {details.subjects.map((s) => (
                            <span key={s.name} className="px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-medium">
                              {s.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Action Bar Sticky Bottom */}
        <div className="sticky bottom-4 z-20 max-w-2xl mx-auto bg-card/95 backdrop-blur-md border border-border shadow-2xl rounded-2xl p-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black">
              {React.createElement(PROGRAM_ICONS[selectedCourse] || Stethoscope, { size: 20 })}
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Selected Learning Stream:</div>
              <div className="text-sm font-extrabold text-foreground">
                {COURSES_MAP[selectedCourse].name}
              </div>
            </div>
          </div>

          <button
            onClick={handleEnterStream}
            disabled={submitting}
            className="btn-primary py-2.5 px-6 font-bold text-xs flex items-center gap-2 rounded-xl shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>Continue into Dashboard</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </main>
    </div>
  );
}
