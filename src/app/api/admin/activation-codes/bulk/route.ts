import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/supabase/route-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { mintBulkActivationCodes, verifyCodeChecksum } from '@/lib/billing/bulkActivationCodesEngine';
import { AuditService } from '@/lib/services/auditService';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/activation-codes/bulk
 * Bulk mints between 10 and 10,000 high-entropy, collision-proof cryptographic activation codes.
 * Chunks insertions into PostgreSQL batches and generates downloadable CSV format.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    // Allow admin or superadmin
    if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Admin privileges required.' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const {
      batchName = 'INST-2082',
      count = 1000,
      plan = 'pro',
      durationDays = 365,
      notes = 'Institutional wholesale distribution',
      expiresInDays = 180,
    } = body;

    const validatedCount = Math.min(10000, Math.max(1, Number(count) || 100));
    const validatedPlan = plan === 'student' ? 'student' : 'pro';
    const validatedDuration = Math.max(1, Number(durationDays) || 30);

    // 1. Generate high-entropy cryptographic codes with checksum validation
    const { batchId, totalMinted, codes, csvContent } = mintBulkActivationCodes({
      batchName: String(batchName).trim(),
      count: validatedCount,
      plan: validatedPlan,
      durationDays: validatedDuration,
      notes: String(notes).trim(),
      expiresInDays: Number(expiresInDays) || 180,
    });

    const admin = createAdminClient();
    let dbInsertedCount = 0;

    // 2. Insert into PostgreSQL in optimized chunks of 250 rows
    if (admin) {
      const CHUNK_SIZE = 250;
      for (let i = 0; i < codes.length; i += CHUNK_SIZE) {
        const chunk = codes.slice(i, i + CHUNK_SIZE).map((c) => ({
          code: c.code,
          plan: c.plan,
          duration_days: c.duration_days,
          notes: c.notes,
          expires_at: c.expires_at,
          created_by: user.id,
          is_active: true,
        }));

        const { error: insertError } = await admin.from('activation_codes').insert(chunk);
        if (insertError) {
          console.warn(`[BulkCodes] Chunk ${i}-${i + chunk.length} DB insert warning:`, insertError.message);
        } else {
          dbInsertedCount += chunk.length;
        }
      }
    }

    // 3. Record audit trail
    await AuditService.recordAuditEvent({
      actorId: user.id,
      actorEmail: user.email,
      action: 'BULK_MINT_ACTIVATION_CODES',
      resourceType: 'activation_code',
      resourceId: batchId,
      changesDiff: {
        batchName,
        totalMinted,
        dbInsertedCount,
        plan: validatedPlan,
        durationDays: validatedDuration,
      },
    }).catch(() => null);

    return NextResponse.json({
      success: true,
      batchId,
      totalMinted,
      dbInsertedCount,
      plan: validatedPlan,
      durationDays: validatedDuration,
      csvContent,
      sampleCodes: codes.slice(0, 5).map((c) => c.code),
      message: `Successfully generated ${totalMinted.toLocaleString()} cryptographic activation codes (Batch ${batchId}).`,
    });
  } catch (err: any) {
    console.error('[BulkCodes] Error minting codes:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error while minting activation codes.' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/activation-codes/bulk
 * Retrieves activation codes metrics, active vs redeemed stats, and recent batch summaries.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 403 });
    }

    const admin = createAdminClient();
    if (!admin) {
      return NextResponse.json({
        success: true,
        stats: { total: 0, active: 0, used: 0, expired: 0 },
        recentCodes: [],
      });
    }

    const [totalRes, activeRes, usedRes, recentRes] = await Promise.all([
      admin.from('activation_codes').select('id', { count: 'exact', head: true }),
      admin.from('activation_codes').select('id', { count: 'exact', head: true }).eq('is_active', true).is('used_by', null),
      admin.from('activation_codes').select('id', { count: 'exact', head: true }).not('used_by', 'is', null),
      admin.from('activation_codes').select('id, code, plan, duration_days, is_active, used_by, used_at, expires_at, notes, created_at').order('created_at', { ascending: false }).limit(20),
    ]);

    return NextResponse.json({
      success: true,
      stats: {
        total: totalRes.count ?? 0,
        active: activeRes.count ?? 0,
        used: usedRes.count ?? 0,
      },
      recentCodes: recentRes.data || [],
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
