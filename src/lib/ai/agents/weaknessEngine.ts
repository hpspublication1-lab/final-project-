import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';

export interface IeltsProfile {
  speaking: {
    overall: number;
    fc: number; // Fluency & Coherence
    lr: number; // Lexical Resource
    gra: number; // Grammatical Range & Accuracy
    pr: number; // Pronunciation
  };
  writing: {
    overall: number;
    ta: number; // Task Achievement
    cc: number; // Coherence & Cohesion
    lr: number; // Lexical Resource
    gra: number; // Grammatical Range & Accuracy
  };
  reading: {
    overall: number;
    accuracyPercentage: number;
    speedWpm: number;
    inferenceScore: number; // 0-100
  };
  listening: {
    overall: number;
    accentAdaptability: number; // 0-100
    distractorResistance: number; // 0-100
    noteTakingAccuracy: number; // 0-100
  };
}

export interface GeneralEnglishProfile {
  vocabulary: {
    cefrLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
    awlCoverage: number; // Academic Word List %
    lexicalDensity: number; // TTR 0-1.0
  };
  grammar: {
    complexSentenceRatio: number; // %
    tenseConsistency: number; // %
    subjectVerbAccuracy: number; // %
  };
  fluency: {
    speakingRateWpm: number;
    hesitationIndex: 'Low' | 'Moderate' | 'High';
    discourseMarkerCount: number;
  };
}

export interface WeakestSubskill {
  category: 'IELTS Speaking' | 'IELTS Writing' | 'IELTS Reading' | 'IELTS Listening' | 'General English';
  subskillName: string; // e.g. 'Coherence & Cohesion', 'Reading Speed', 'Pronunciation /v/ vs /w/'
  currentLevel: string; // e.g. 'Band 6.0' or '210 WPM'
  targetLevel: string; // e.g. 'Band 8.0' or '400 WPM'
  impactScore: number; // 0-100 severity
  description: string;
}

export interface NextBestExercise {
  id: string;
  title: string;
  skillTarget: string;
  category: 'Speaking' | 'Writing' | 'Reading' | 'Listening' | 'Grammar';
  type: 'speed-skimming' | 'cohesion-drill' | 'fluency-sprint' | 'vocab-booster' | 'phonetic-polish';
  instructions: string;
  promptText: string;
  targetMetrics: string;
  estimatedDurationMinutes: number;
  routePath: string;
}

export interface StudentDualProfileResult {
  userId: string;
  ieltsProfile: IeltsProfile;
  englishProfile: GeneralEnglishProfile;
  weakestSubskill: WeakestSubskill;
  nextBestExercise: NextBestExercise;
  lastUpdated: string;
}

/** Compute Dual Student Profiles & Run Master Weakness Engine */
export async function computeStudentDualProfile(userId: string): Promise<StudentDualProfileResult> {
  const admin = createAdminClient();

  // Fetch recent attempts from english_practice_attempts
  const { data: attempts } = await admin
    .from('english_practice_attempts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);

  // Fetch memory metrics from agent_memory
  const { data: memoryRows } = await admin
    .from('agent_memory')
    .select('*')
    .eq('user_id', userId)
    .eq('course_id', 'ielts');

  // Default Baseline Profiles
  let ieltsProfile: IeltsProfile = {
    speaking: { overall: 6.5, fc: 6.5, lr: 6.5, gra: 6.0, pr: 6.5 },
    writing: { overall: 6.5, ta: 7.0, cc: 6.0, lr: 6.5, gra: 6.5 },
    reading: { overall: 7.0, accuracyPercentage: 75, speedWpm: 240, inferenceScore: 70 },
    listening: { overall: 7.5, accentAdaptability: 80, distractorResistance: 75, noteTakingAccuracy: 85 },
  };

  let englishProfile: GeneralEnglishProfile = {
    vocabulary: { cefrLevel: 'B2', awlCoverage: 65, lexicalDensity: 0.62 },
    grammar: { complexSentenceRatio: 45, tenseConsistency: 85, subjectVerbAccuracy: 90 },
    fluency: { speakingRateWpm: 125, hesitationIndex: 'Moderate', discourseMarkerCount: 4 },
  };

  // Parse actual historical attempt data if available
  if (attempts && attempts.length > 0) {
    const speakingAttempts = attempts.filter((a) => a.task_type_slug?.includes('speaking'));
    const writingAttempts = attempts.filter((a) => a.task_type_slug?.includes('writing') || a.task_type_slug?.includes('task'));

    if (speakingAttempts.length > 0) {
      const latestSpk = speakingAttempts[0];
      const r = latestSpk.rubric_scores || {};
      ieltsProfile.speaking = {
        overall: Number(latestSpk.band_score) || 6.5,
        fc: r.fluencyCoherence?.band || 6.5,
        lr: r.lexicalResource?.band || 6.5,
        gra: r.grammaticalRange?.band || 6.0,
        pr: r.pronunciation?.band || 6.5,
      };
    }

    if (writingAttempts.length > 0) {
      const latestWrt = writingAttempts[0];
      const r = latestWrt.rubric_scores || {};
      ieltsProfile.writing = {
        overall: Number(latestWrt.band_score) || 6.5,
        ta: r.taskAchievement?.band || 7.0,
        cc: r.coherenceCohesion?.band || 6.0,
        lr: r.lexicalResource?.band || 6.5,
        gra: r.grammaticalRange?.band || 6.5,
      };
    }
  }

  // Determine single lowest subskill (Master Weakness Engine)
  const subskillList: Array<{ sub: WeakestSubskill; val: number }> = [
    {
      val: ieltsProfile.speaking.gra,
      sub: {
        category: 'IELTS Speaking',
        subskillName: 'Grammatical Range & Accuracy (GRA)',
        currentLevel: `Band ${ieltsProfile.speaking.gra.toFixed(1)}`,
        targetLevel: 'Band 8.0',
        impactScore: 88,
        description: 'Frequent reliance on simple sentences and occasional tense consistency errors during spoken monologues.',
      },
    },
    {
      val: ieltsProfile.writing.cc,
      sub: {
        category: 'IELTS Writing',
        subskillName: 'Coherence & Cohesion (CC)',
        currentLevel: `Band ${ieltsProfile.writing.cc.toFixed(1)}`,
        targetLevel: 'Band 8.5',
        impactScore: 92,
        description: 'Paragraphing flow needs stronger cohesive linkers beyond basic connectors (firstly, furthermore).',
      },
    },
    {
      val: ieltsProfile.reading.speedWpm / 50, // 240/50 = 4.8
      sub: {
        category: 'IELTS Reading',
        subskillName: 'Reading Speed & Skimming',
        currentLevel: `${ieltsProfile.reading.speedWpm} WPM`,
        targetLevel: '400 WPM',
        impactScore: 85,
        description: 'Reading speed requires optimization to complete Passage 3 comfortably under 20 minutes.',
      },
    },
  ];

  subskillList.sort((a, b) => a.val - b.val);
  const weakestSubskill = subskillList[0].sub;

  // Generate Targeted Next Best Exercise
  const nextBestExercise: NextBestExercise = generateTargetedExercise(weakestSubskill);

  return {
    userId,
    ieltsProfile,
    englishProfile,
    weakestSubskill,
    nextBestExercise,
    lastUpdated: new Date().toISOString(),
  };
}

function generateTargetedExercise(weakest: WeakestSubskill): NextBestExercise {
  if (weakest.category === 'IELTS Writing') {
    return {
      id: `ex_cc_${Date.now()}`,
      title: 'Band 9.0 Essay Cohesion & Paragraph Linker Drill',
      skillTarget: 'Coherence & Cohesion (CC)',
      category: 'Writing',
      type: 'cohesion-drill',
      instructions: 'Rewrite a 200-word paragraph using advanced cohesive devices ("notwithstanding", "it is paramount that", "conversely").',
      promptText: 'Write a body paragraph discussing why remote software development teams boost company productivity.',
      targetMetrics: 'Band 8.5+ Cohesion Score',
      estimatedDurationMinutes: 10,
      routePath: '/english/syllabus#live-essay-evaluator',
    };
  }

  if (weakest.category === 'IELTS Reading') {
    return {
      id: `ex_rd_${Date.now()}`,
      title: '400 WPM Speed Skimming & True/False/Not Given Sprint',
      skillTarget: 'Reading Speed & Inference',
      category: 'Reading',
      type: 'speed-skimming',
      instructions: 'Skim a 450-word Cambridge C1 Academic Reading passage in under 2 minutes and solve 4 True/False/Not Given questions.',
      promptText: 'The Evolution of Neural Architectures in Modern Computing',
      targetMetrics: '100% Accuracy in < 2 mins',
      estimatedDurationMinutes: 5,
      routePath: '/english/cambridge',
    };
  }

  return {
    id: `ex_spk_${Date.now()}`,
    title: 'Complex Conditional Sentence Speaking Sprint',
    skillTarget: 'Grammatical Range (GRA)',
    category: 'Speaking',
    type: 'fluency-sprint',
    instructions: 'Record a 60-second speech incorporating at least 3 Third Conditional clauses ("If I had... I would have...").',
    promptText: 'Describe a decision you made in the past that changed your career path.',
    targetMetrics: 'Zero grammar penalties in 60s',
    estimatedDurationMinutes: 5,
    routePath: '/english/speaking',
  };
}
