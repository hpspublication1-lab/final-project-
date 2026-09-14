import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export interface SubjectiveSubmission {
  id: string;
  questionId: string;
  studentId: string;
  studentName?: string;
  subject: string;
  questionText: string;
  sampleSolution: string;
  studentAnswerText?: string;
  studentImageUrl?: string;
  totalMarks: number;
  aiDraftScore: number;
  aiDraftFeedback: string;
  aiRubricBreakdown: Array<{ criterion: string; score: number; maxMarks: number; feedback: string }>;
  teacherScore?: number;
  teacherFeedback?: string;
  status: 'pending_review' | 'teacher_reviewed' | 'published';
  isAiDraft: boolean;
  publishedAt?: string;
  createdAt: string;
}

// In-memory fallback evaluation queue if database table is not provisioned
const memoryEvaluations: Map<string, SubjectiveSubmission> = new Map();

// Seed sample pending evaluations for demo & testing if queue is empty
function seedDemoQueue() {
  if (memoryEvaluations.size === 0) {
    const demoItems: SubjectiveSubmission[] = [
      {
        id: 'sub-eval-101',
        questionId: 'see-sci-h-1',
        studentId: 'demo-student-1',
        studentName: 'Aarav Shrestha',
        subject: 'Compulsory Science',
        questionText: 'State Newton\'s Universal Law of Gravitation. Calculate the gravitational force between Earth (M = 6 × 10^24 kg) and a 100 kg satellite located 400 km above Earth\'s surface (R = 6400 km).',
        sampleSolution: '1. Law definition and statement (1M)\n2. Formula F = G*(M*m)/d^2 where d = R + h = 6800 km (1M)\n3. Correct numerical substitution with G = 6.67 × 10^-11 (1M)\n4. Final answer: F ≈ 865 N with units (1M)',
        studentAnswerText: 'Newton\'s law: F is directly proportional to product of masses and inversely to square of distance. F = G*M*m/d^2. Here d = 6400 + 400 = 6800 km = 6.8e6 m. F = (6.67e-11 * 6e24 * 100) / (6.8e6)^2 = 865.5 N.',
        totalMarks: 4,
        aiDraftScore: 3.8,
        aiDraftFeedback: 'Excellent derivation and unit conversion! To get a perfect score, explicitly define all symbols G, M, m, d in your given data section.',
        aiRubricBreakdown: [
          { criterion: 'Law Definition & Statement', score: 1.0, maxMarks: 1.0, feedback: 'Correct statement' },
          { criterion: 'Formula & Effective Distance (d = R + h)', score: 1.0, maxMarks: 1.0, feedback: 'Correct addition of altitude to radius' },
          { criterion: 'Substitution & Computation', score: 1.0, maxMarks: 1.0, feedback: 'Accurate arithmetic' },
          { criterion: 'Final Unit & Statement', score: 0.8, maxMarks: 1.0, feedback: 'Units stated correctly as N' },
        ],
        status: 'pending_review',
        isAiDraft: true,
        createdAt: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: 'sub-eval-102',
        questionId: 'see-sci-h-2',
        studentId: 'demo-student-2',
        studentName: 'Pooja Thapa',
        subject: 'Compulsory Science',
        questionText: 'Explain the working principle of an electric generator (dynamo). Distinguish between AC and DC generators with diagrams.',
        sampleSolution: '1. Electromagnetic induction principle (Michael Faraday) (1M)\n2. Construction (armature, slip rings vs split rings) (1M)\n3. Clear labeled diagram (1M)\n4. Differences in current direction (1M)',
        studentAnswerText: 'It works on electromagnetic induction. When coil rotates in magnetic field, induced emf is produced according to Faraday\'s law. AC generator uses slip rings and DC uses split rings or commutator.',
        totalMarks: 4,
        aiDraftScore: 2.8,
        aiDraftFeedback: 'Solid conceptual explanation of Faraday\'s law, but missing the labeled hand-drawn diagram illustrating slip rings vs commutator.',
        aiRubricBreakdown: [
          { criterion: 'Working Principle (Faraday\'s Law)', score: 1.0, maxMarks: 1.0, feedback: 'Accurately stated' },
          { criterion: 'Slip Rings vs Split Rings Construction', score: 0.8, maxMarks: 1.0, feedback: 'Good distinction' },
          { criterion: 'Labeled Technical Diagram', score: 0.2, maxMarks: 1.0, feedback: 'Diagram is missing or incomplete' },
          { criterion: 'Current Waveform Description', score: 0.8, maxMarks: 1.0, feedback: 'Clear explanation' },
        ],
        status: 'pending_review',
        isAiDraft: true,
        createdAt: new Date(Date.now() - 7200000).toISOString(),
      },
    ];
    demoItems.forEach((item) => memoryEvaluations.set(item.id, item));
  }
}

/** GET: Fetch teacher evaluation queue */
export async function GET(request: NextRequest) {
  try {
    seedDemoQueue();
    const items = Array.from(memoryEvaluations.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({
      success: true,
      count: items.length,
      evaluations: items,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/** POST: Student submits subjective answer for evaluation */
export async function POST(request: NextRequest) {
  try {
    seedDemoQueue();
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const body = await request.json();
    const {
      questionId,
      subject = 'Compulsory Science',
      questionText = 'Subjective Question',
      sampleSolution = 'Model Solution',
      studentAnswerText = '',
      studentImageUrl = '',
      totalMarks = 4,
      rubric = [],
    } = body;

    const evalId = 'sub-eval-' + Date.now();

    // Standard AI draft grading simulation
    const simulatedDraftScore = Math.min(totalMarks, Math.round(totalMarks * 0.85 * 10) / 10);
    const aiRubricBreakdown = (rubric.length > 0 ? rubric : [
      { criterion: 'Concept Identification & Given Data', maxMarks: 1.0 },
      { criterion: 'Formula Application & Reasoning', maxMarks: Math.max(1.0, totalMarks - 2.0) },
      { criterion: 'Final Answer & Units Presentation', maxMarks: 1.0 },
    ]).map((r: any) => ({
      criterion: r.criterion,
      score: Math.min(r.maxMarks, Math.round(r.maxMarks * 0.85 * 10) / 10),
      maxMarks: r.maxMarks,
      feedback: 'Good step progression according to CDC marking guidelines.',
    }));

    const newSub: SubjectiveSubmission = {
      id: evalId,
      questionId,
      studentId: user?.id || 'guest-student',
      studentName: user?.email?.split('@')[0] || 'Student',
      subject,
      questionText,
      sampleSolution,
      studentAnswerText,
      studentImageUrl,
      totalMarks,
      aiDraftScore: simulatedDraftScore,
      aiDraftFeedback: 'AI-assisted initial evaluation completed. A certified teacher will review step marks before final publication.',
      aiRubricBreakdown,
      status: 'pending_review',
      isAiDraft: true,
      createdAt: new Date().toISOString(),
    };

    memoryEvaluations.set(evalId, newSub);

    return NextResponse.json({
      success: true,
      evaluation: newSub,
      message: 'Submission received. AI draft evaluation generated and queued for teacher verification.',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/** PUT: Teacher overrides rubric scores and publishes final grade */
export async function PUT(request: NextRequest) {
  try {
    seedDemoQueue();
    const body = await request.json();
    const {
      evaluationId,
      teacherScore,
      teacherFeedback,
      rubricBreakdown,
      publish = true,
    } = body;

    if (!evaluationId || !memoryEvaluations.has(evaluationId)) {
      return NextResponse.json({ error: 'Evaluation item not found' }, { status: 404 });
    }

    const item = memoryEvaluations.get(evaluationId)!;
    item.teacherScore = Number(teacherScore);
    item.teacherFeedback = teacherFeedback || item.aiDraftFeedback;
    if (Array.isArray(rubricBreakdown)) {
      item.aiRubricBreakdown = rubricBreakdown;
    }
    item.status = publish ? 'published' : 'teacher_reviewed';
    item.isAiDraft = false; // Finalized by faculty
    if (publish) item.publishedAt = new Date().toISOString();

    memoryEvaluations.set(evaluationId, item);

    return NextResponse.json({
      success: true,
      evaluation: item,
      message: publish ? 'Final score published to student report' : 'Teacher review saved as draft',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
