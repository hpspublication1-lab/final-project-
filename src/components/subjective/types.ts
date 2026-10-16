export type SubjectiveProgramType = 'see' | 'cee' | 'english' | 'digital';

export interface RubricItem {
  id?: string;
  criterion: string;
  max_marks: number;
  description?: string;
  dimension?: 'learning_performance' | 'knowledge_elements' | 'reasoning_skills';
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
  paraphrasing_note?: string;
  created_at?: string;
}

export interface EvaluationRubricBreakdown {
  criterion: string;
  score: number;
  max_marks: number;
  feedback: string;
  evidence_found?: string | null;
  status?: 'full' | 'partial' | 'missing';
  alternative_phrasing_accepted?: boolean;
  misconception_detected?: string | null;
  dimension?: 'learning_performance' | 'knowledge_elements' | 'reasoning_skills';
}

export interface DimensionMetric {
  score: number;
  maxScore: number;
  percentage: number;
}

export interface StudentMisconception {
  concept: string;
  misconception: string;
  correction: string;
}

export interface TranscriptionVerification {
  decoupledOcr: boolean;
  rawTranscription: string;
  ocrLegibilityScore: number;
  requiresHumanReview: boolean;
  notice: string;
}

export interface DifferenceAwareInspection {
  meaningChangingUncertaintiesFound: boolean;
  overallRisk: 'none' | 'low' | 'medium' | 'high';
  uncertainTokens: Array<{
    token: string;
    category: string;
    snippet: string;
    confidence: number;
    potentialAlternatives: string[];
    reason: string;
  }>;
  requiresHumanReview: boolean;
  routingDecision: string;
  humanReviewTicket?: {
    ticketId: string;
    priority: string;
    teacherInstruction: string;
  };
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
  dimensions?: {
    learningPerformance: DimensionMetric;
    knowledgeElements: DimensionMetric;
    reasoningSkills: DimensionMetric;
  };
  detected_misconceptions?: StudentMisconception[];
  transcription_verification?: TranscriptionVerification;
  difference_aware_inspection?: DifferenceAwareInspection;
  engineering_notice?: string;
  created_at?: string;
}

export interface SubjectiveFilterOptions {
  subject: string;
  marksFilter: 'all' | '2' | '4' | '5';
  searchQuery: string;
}
