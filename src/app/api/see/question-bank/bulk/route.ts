import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getSessionUser } from '@/lib/supabase/route-auth';

export const dynamic = 'force-dynamic';

interface QuestionImportRecord {
  subject?: string;
  chapter?: string;
  subtopic?: string;
  section?: number | string;
  marks?: number | string;
  question_type?: string;
  difficulty?: string;
  year?: string;
  question?: string;
  question_text?: string;
  question_nepali?: string;
  solution?: string;
  sample_solution?: string;
  exam_tip?: string;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });
    }

    const admin = createAdminClient();
    if (!admin) {
      return NextResponse.json({ error: 'Database connection unavailable' }, { status: 500 });
    }

    const { data: profile } = await admin
      .from('user_profiles')
      .select('is_admin')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden. Admin privileges required.' }, { status: 403 });
    }

    const payload = await request.json();
    const records: QuestionImportRecord[] = Array.isArray(payload) ? payload : payload.records || [];

    if (!records.length) {
      return NextResponse.json({ error: 'No question records provided.' }, { status: 400 });
    }

    const errors: string[] = [];
    const validQuestions: any[] = [];

    records.forEach((row, idx) => {
      const qText = row.question || row.question_text || '';
      const sol = row.solution || row.sample_solution || '';
      const subj = row.subject || 'science';
      const chap = row.chapter || 'General Unit';
      const m = Number(row.marks) || 1;

      if (!qText.trim()) {
        errors.push(`Row ${idx + 1}: Missing question text.`);
        return;
      }
      if (!sol.trim()) {
        errors.push(`Row ${idx + 1}: Missing solution text.`);
        return;
      }

      validQuestions.push({
        subject: subj,
        chapter: chap,
        subtopic: row.subtopic || null,
        marks: m,
        question_text: qText.trim(),
        options: [],
        correct_answer: '',
        explanation: sol.trim(),
        difficulty: (row.difficulty || 'medium').toLowerCase(),
        is_published: true,
        is_active: true,
      });
    });

    if (validQuestions.length > 0) {
      const { error: insertError } = await admin
        .from('questions')
        .insert(validQuestions);

      if (insertError) {
        console.warn('Database batch insert notice:', insertError.message);
      }
    }

    return NextResponse.json({
      success: true,
      report: {
        totalRows: records.length,
        importedCount: validQuestions.length,
        errorCount: errors.length,
        errors,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
