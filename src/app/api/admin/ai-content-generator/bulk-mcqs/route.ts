import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/supabase/route-auth';
import {
  executeBulkQuestionIngestion,
  SYLLABUS_RESEARCH_MATRIX,
  MUST_SOLVE_MASTER_BANK,
  ExamProgram,
} from '@/lib/ai/autonomousResearchPipeline';
import { AuditService } from '@/lib/services/auditService';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/ai-content-generator/bulk-mcqs
 * Ingests and generates up to 10,000 syllabus-researched MCQs with KaTeX explanations
 * and past-year examination tagging. Optionally auto-posts to the database.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Admin privileges required.' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const {
      program = 'cee',
      subject,
      topic,
      count = 100,
      autoPublish = true,
    } = body;

    const validatedCount = Math.min(10000, Math.max(1, Number(count) || 100));
    const validatedProgram = (['cee', 'see', 'ielts', 'neb', 'ioe'].includes(program) ? program : 'cee') as ExamProgram;

    const result = await executeBulkQuestionIngestion({
      program: validatedProgram,
      subject,
      topic,
      targetCount: validatedCount,
      autoPublish: Boolean(autoPublish),
    });

    // Record audit log
    await AuditService.recordAuditEvent({
      actorId: user.id,
      actorEmail: user.email,
      action: 'BULK_QUESTION_INGESTION',
      resourceType: 'question_bank',
      resourceId: result.batchId,
      changesDiff: {
        program: validatedProgram,
        totalGenerated: result.totalGenerated,
        totalInserted: result.totalInserted,
        autoPublish,
        topicsCount: result.topicsCovered.length,
      },
    }).catch(() => null);

    return NextResponse.json({
      success: true,
      batchId: result.batchId,
      program: result.program,
      totalGenerated: result.totalGenerated,
      totalInserted: result.totalInserted,
      topicsCovered: result.topicsCovered,
      sampleQuestions: result.questions.slice(0, 5),
      csvContent: result.csvContent,
      executionTimeMs: result.executionTimeMs,
      message: `Successfully synthesized and processed ${result.totalGenerated.toLocaleString()} questions for ${result.program.toUpperCase()}.`,
    });
  } catch (err: any) {
    console.error('[BulkMCQs] Generation error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error during question synthesis.' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/ai-content-generator/bulk-mcqs
 * Returns syllabus topic categories and curated Must-Solve 500 counts.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const program = searchParams.get('program') as ExamProgram | null;

    const filteredMatrix = program
      ? SYLLABUS_RESEARCH_MATRIX.filter((m) => m.program === program)
      : SYLLABUS_RESEARCH_MATRIX;

    const mustSolveCount = program
      ? MUST_SOLVE_MASTER_BANK.filter((q) => q.program_type === program).length
      : MUST_SOLVE_MASTER_BANK.length;

    return NextResponse.json({
      success: true,
      topics: filteredMatrix,
      totalTopicsAvailable: SYLLABUS_RESEARCH_MATRIX.length,
      mustSolveBankCount: mustSolveCount,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal error' }, { status: 500 });
  }
}
