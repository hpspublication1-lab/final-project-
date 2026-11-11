import { NextRequest, NextResponse } from 'next/server';
import { verifyServerPermission } from '@/lib/auth/serverGuard';
import { createAdminClient } from '@/lib/supabase/admin';
import { AuditService } from '@/lib/services/auditService';
import {
  AutonomousContentEngine,
  type GenerationRequest,
  type TargetProgram,
  type ContentGenerationType,
} from '@/lib/ai/autonomousContentEngine';

export const dynamic = 'force-dynamic';
export const maxDuration = 120; // 2 minutes max for rich content synthesis

export async function POST(req: NextRequest) {
  // Requires content:create permission
  const guard = await verifyServerPermission(req, 'content:create');
  if (!guard.authorized) {
    return guard.response;
  }

  try {
    const body = await req.json();
    const {
      program = 'cee',
      subject = 'Physics',
      chapterOrTopic = 'Thermodynamics & Heat Transfer',
      generationType = 'comprehensive_notes',
      difficulty = 'adaptive',
      itemCount = 10,
      customInstructions = '',
      autoPublish = false,
      isPremium = false,
    } = body;

    // 1. Generate the curriculum material using Autonomous Engine
    const generated = await AutonomousContentEngine.generateResource({
      program: program as TargetProgram,
      subject,
      chapterOrTopic,
      generationType: generationType as ContentGenerationType,
      difficulty,
      itemCount,
      customInstructions,
    });

    let publishedId: string | null = null;

    // 2. If autoPublish is requested, persist directly to the database
    if (autoPublish) {
      const admin = createAdminClient();
      if (admin) {
        try {
          // Look up or link subject
          const { data: subjectRow } = await admin
            .from('subjects')
            .select('id')
            .ilike('name', `%${subject}%`)
            .maybeSingle();

          const { data: inserted, error: insertError } = await admin
            .from('notes')
            .insert({
              title: generated.title,
              content: generated.markdownContent,
              program_type: program,
              is_premium: !!isPremium,
              is_active: true,
              subject_id: subjectRow?.id || null,
            })
            .select('id')
            .single();

          if (!insertError && inserted) {
            publishedId = inserted.id;

            // Record audit log
            await AuditService.recordAuditEvent({
              actorId: guard.user.id,
              actorEmail: guard.email,
              action: 'ai_autonomous_content_publish',
              resourceType: 'notes',
              resourceId: inserted.id,
              changesDiff: {
                title: generated.title,
                program,
                subject,
                chapterOrTopic,
                modelUsed: generated.modelUsed,
                generationType,
              },
              ipAddress: guard.ipAddress,
              userAgent: guard.userAgent,
            });
          }
        } catch (dbErr) {
          console.warn('Direct database insert notice:', dbErr);
        }
      }
    }

    return NextResponse.json({
      success: true,
      generated,
      autoPublished: !!publishedId,
      publishedResourceId: publishedId,
      message: publishedId
        ? `Successfully generated and published "${generated.title}" to live student platform!`
        : `Successfully synthesized "${generated.title}". Ready for review & 1-click publishing.`,
    });
  } catch (err: any) {
    console.error('ai-content-generator POST error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'AI content synthesis failed' },
      { status: 500 }
    );
  }
}
