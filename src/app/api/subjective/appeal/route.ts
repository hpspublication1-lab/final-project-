import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  submitStudentAppeal,
  resolveStudentAppeal,
  getPendingAppeals,
  DisputeCategory,
} from '@/lib/security/assessmentIntegrity';

export const dynamic = 'force-dynamic';

/**
 * GET /api/subjective/appeal
 * Retrieves pending student appeals for teacher review queue.
 */
export async function GET(request: NextRequest) {
  try {
    const appeals = getPendingAppeals();
    return NextResponse.json({
      success: true,
      count: appeals.length,
      appeals,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * POST /api/subjective/appeal
 * Student submits an appeal against an AI evaluation.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const body = await request.json();
    const {
      evaluationId,
      questionId,
      studentRationale,
      category = 'ocr_misread',
      originalMarksAwarded,
      totalPossibleMarks,
    } = body;

    if (!evaluationId || !studentRationale) {
      return NextResponse.json(
        { error: 'Evaluation ID and student rationale are required.' },
        { status: 400 }
      );
    }

    const ticket = submitStudentAppeal({
      evaluationId,
      questionId: questionId || 'generic-question',
      studentId: user?.id || 'guest-student',
      studentRationale,
      category: category as DisputeCategory,
      originalMarksAwarded: Number(originalMarksAwarded) || 0,
      totalPossibleMarks: Number(totalPossibleMarks) || 4,
    });

    return NextResponse.json({
      success: true,
      ticket,
      message: 'Your appeal has been submitted to certified subject faculty for manual re-evaluation.',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

/**
 * PUT /api/subjective/appeal
 * Teacher resolves a student appeal (override marks or uphold AI marks).
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const body = await request.json();
    const {
      appealId,
      action, // 'override' | 'upheld'
      newMarks,
      resolutionNotes,
    } = body;

    if (!appealId || !action || !resolutionNotes) {
      return NextResponse.json(
        { error: 'Appeal ID, action, and resolution notes are required.' },
        { status: 400 }
      );
    }

    const ticket = resolveStudentAppeal({
      appealId,
      facultyReviewerId: user?.email || 'faculty-reviewer',
      action,
      newMarks: newMarks !== undefined ? Number(newMarks) : undefined,
      resolutionNotes,
    });

    return NextResponse.json({
      success: true,
      ticket,
      message: action === 'override' ? 'Marks adjusted by faculty reviewer.' : 'AI mark upheld with faculty explanation.',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
