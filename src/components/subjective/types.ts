export type SubjectiveProgramType = 'see' | 'cee' | 'english' | 'digital';

export interface RubricItem {
  criterion: string;
  max_marks: number;
  description?: string;
}

export interface SubjectiveQuestion {
  id: string;
  program: SubjectiveProgramType;
  subject_id?: string | null;
  chapter_id?: string | null;
  subject: string;
  chapter: string;
  question_text: string;
  marks: number;
  suggested_time_minutes: number;
  sample_solution: string;
  rubric: RubricItem[];
  created_at?: string;
}

export interface EvaluationRubricBreakdown {
  criterion: string;
  score: number;
  max_marks: number;
  feedback: string;
}

export interface EvaluationResult {
  evaluation_id?: string;
  question_id: string;
  obtained_marks: number;
  total_marks: number;
  percentage: number;
  feedback: string;
  rubric_breakdown: EvaluationRubricBreakdown[];
  suggestions: string[];
  extracted_text?: string;
  created_at?: string;
}

export interface SubjectiveFilterOptions {
  subject: string;
  marksFilter: 'all' | '2' | '4' | '5';
  searchQuery: string;
}
