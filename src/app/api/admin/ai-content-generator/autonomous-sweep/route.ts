import { NextRequest, NextResponse } from 'next/server';
import { verifyServerPermission } from '@/lib/auth/serverGuard';
import { createAdminClient } from '@/lib/supabase/admin';
import { AuditService } from '@/lib/services/auditService';
import {
  AutonomousContentEngine,
  CANONICAL_AUTONOMOUS_TARGETS,
  type TargetProgram,
} from '@/lib/ai/autonomousContentEngine';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max for full curriculum sweeps

export async function GET(req: NextRequest) {
  const guard = await verifyServerPermission(req, 'content:read');
  if (!guard.authorized) return guard.response;

  const admin = createAdminClient();
  let publishedCount = 0;

  if (admin) {
    try {
      const { count } = await admin
        .from('notes')
        .select('id', { count: 'exact', head: true });
      publishedCount = count || 0;
    } catch (e) {
      console.warn('DB notes count check notice:', e);
    }
  }

  return NextResponse.json({
    success: true,
    availableTargets: CANONICAL_AUTONOMOUS_TARGETS,
    totalTargetsCount: CANONICAL_AUTONOMOUS_TARGETS.length,
    programs: ['cee', 'see', 'ielts'],
    currentNotesCount: publishedCount,
  });
}

export async function POST(req: NextRequest) {
  // Requires content:create permission
  const guard = await verifyServerPermission(req, 'content:create');
  if (!guard.authorized) return guard.response;

  try {
    const body = await req.json().catch(() => ({}));
    const program = (body.program || 'all') as TargetProgram | 'all';
    const maxItems = Math.min(20, Math.max(1, Number(body.maxItems) || 6));
    const autoPublish = body.autoPublish !== false;

    const admin = createAdminClient();
    const publishedRecords: { title: string; program: string; id: string; status: string }[] = [];

    // Run the autonomous sweep
    const sweepResult = await AutonomousContentEngine.runAutonomousCurriculumSweep({
      program,
      maxItems,
    });

    // If autoPublish is enabled and database is available, persist each generated item
    if (autoPublish && admin) {
      for (const entry of sweepResult.items) {
        try {
          const { data: subjectRow } = await admin
            .from('subjects')
            .select('id')
            .ilike('name', `%${entry.item.subject}%`)
            .maybeSingle();

          const { data: inserted, error: insertError } = await admin
            .from('notes')
            .insert({
              title: entry.result.title,
              content: entry.result.markdownContent,
              content_markdown: entry.result.markdownContent,
              summary_key_points: entry.result.summaryKeyPoints,
              formula_sheet_latex: entry.result.formulaLatex || null,
              is_premium: false,
              is_active: true,
              subject_id: subjectRow?.id || null,
            })
            .select('id')
            .single();

          if (!insertError && inserted) {
            entry.publishedId = inserted.id;
            publishedRecords.push({
              title: entry.result.title,
              program: entry.result.program,
              id: inserted.id,
              status: 'published_live',
            });
          }
        } catch (dbErr) {
          console.warn('Database note insert notice:', dbErr);
        }
      }

      // Record audit log for the entire autonomous sweep
      await AuditService.recordAuditEvent({
        actorId: guard.user.id,
        actorEmail: guard.email,
        action: 'ai_autonomous_curriculum_sweep',
        resourceType: 'notes_curriculum_sweep',
        resourceId: `sweep_${Date.now()}`,
        changesDiff: {
          program,
          itemsProcessed: sweepResult.totalProcessed,
          durationMs: sweepResult.durationMs,
          publishedCount: publishedRecords.length,
        },
        ipAddress: guard.ipAddress,
        userAgent: guard.userAgent,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Autonomous Curriculum Auto-Pilot processed ${sweepResult.totalProcessed} topics across ${program.toUpperCase()} in ${(sweepResult.durationMs / 1000).toFixed(1)}s.`,
      totalProcessed: sweepResult.totalProcessed,
      durationMs: sweepResult.durationMs,
      items: sweepResult.items,
      publishedRecords,
    });
  } catch (err: any) {
    console.error('autonomous-sweep POST error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Curriculum sweep failed' },
      { status: 500 }
    );
  }
}
