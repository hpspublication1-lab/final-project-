import { SEE_QUESTION_BANK, SeeQuestion } from '@/lib/data/seeQuestionBankData';

export interface SeeQuestionFilterOptions {
  subject?: string;
  chapter?: string;
  marks?: number | 'all';
  difficulty?: string;
  source?: 'all' | 'static' | 'database' | 'past_papers';
  limit?: number;
  offset?: number;
}

export interface UnifiedSeeQuestion {
  id: string;
  subject: string;
  subjectName: string;
  chapter: string;
  subtopic?: string;
  marks: number;
  section?: string;
  group?: string;
  question: string;
  questionNepali?: string;
  solution: string;
  markingScheme?: { step: string; marks: number }[];
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Very Hard';
  year?: string;
  source: 'static_bank' | 'database_subjective' | 'past_paper';
  raw?: any;
}

/**
 * Normalizes static SeeQuestion to UnifiedSeeQuestion format.
 */
function normalizeStaticQuestion(q: SeeQuestion): UnifiedSeeQuestion {
  return {
    id: q.id,
    subject: q.subject,
    subjectName: q.subjectName,
    chapter: q.chapter,
    subtopic: q.subtopic,
    marks: q.marks,
    section: q.section,
    group: q.group,
    question: q.question,
    questionNepali: q.questionNepali,
    solution: q.solution,
    markingScheme: q.markingScheme,
    difficulty: q.difficulty,
    year: q.year,
    source: 'static_bank',
    raw: q,
  };
}

/**
 * Standardized repository service to fetch SEE questions with zero data loss.
 * Seamlessly merges static TypeScript data with Supabase subjective questions.
 */
export async function getSeeQuestions(options: SeeQuestionFilterOptions = {}): Promise<UnifiedSeeQuestion[]> {
  const {
    subject,
    chapter,
    marks,
    difficulty,
    source = 'all',
    limit,
    offset = 0,
  } = options;

  let combined: UnifiedSeeQuestion[] = [];

  // 1. Gather static question bank
  if (source === 'all' || source === 'static') {
    const staticQuestions = SEE_QUESTION_BANK.map(normalizeStaticQuestion);
    combined.push(...staticQuestions);
  }

  // 2. Fetch from Supabase subjective_questions table via API or client if needed
  if (source === 'all' || source === 'database') {
    try {
      if (typeof window !== 'undefined') {
        const queryParams = new URLSearchParams();
        queryParams.set('program', 'see');
        if (subject && subject !== 'all') queryParams.set('subject', subject);
        if (chapter && chapter !== 'all') queryParams.set('chapter', chapter);
        if (marks && marks !== 'all') queryParams.set('marks', String(marks));

        const res = await fetch(`/api/subjective/questions?${queryParams.toString()}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.questions)) {
            const dbQuestions: UnifiedSeeQuestion[] = data.questions.map((q: any) => ({
              id: q.id,
              subject: (q.subject || 'science').toLowerCase().replace(/\s+/g, '_'),
              subjectName: q.subject || 'Compulsory Science',
              chapter: q.chapter || 'General',
              marks: q.marks || 4,
              question: q.question_text || q.question || '',
              questionNepali: q.question_nepali || undefined,
              solution: q.sample_solution || q.solution || '',
              markingScheme: Array.isArray(q.rubric)
                ? q.rubric.map((r: any) => ({ step: r.criterion || r.step, marks: r.max_marks || r.marks || 1 }))
                : undefined,
              difficulty: (q.difficulty || 'Medium') as any,
              year: q.year || '2081/2082 Model',
              source: 'database_subjective',
              raw: q,
            }));

            // Deduplicate by ID
            const existingIds = new Set(combined.map((c) => c.id));
            for (const dbQ of dbQuestions) {
              if (!existingIds.has(dbQ.id)) {
                combined.push(dbQ);
                existingIds.add(dbQ.id);
              }
            }
          }
        }
      }
    } catch (e) {
      console.warn('seeQuestionService: Database subjective questions fallback active', e);
    }
  }

  // 3. Apply memory filters
  let filtered = combined.filter((q) => {
    if (subject && subject !== 'all') {
      const s = subject.toLowerCase();
      if (!q.subject.toLowerCase().includes(s) && !q.subjectName.toLowerCase().includes(s)) {
        return false;
      }
    }

    if (chapter && chapter !== 'all') {
      const c = chapter.toLowerCase();
      if (!q.chapter.toLowerCase().includes(c)) {
        return false;
      }
    }

    if (marks && marks !== 'all') {
      if (q.marks !== marks) {
        return false;
      }
    }

    if (difficulty && difficulty !== 'all') {
      if (q.difficulty.toLowerCase() !== difficulty.toLowerCase()) {
        return false;
      }
    }

    return true;
  });

  // 4. Pagination
  if (typeof offset === 'number' && offset > 0) {
    filtered = filtered.slice(offset);
  }
  if (typeof limit === 'number' && limit > 0) {
    filtered = filtered.slice(0, limit);
  }

  return filtered;
}
