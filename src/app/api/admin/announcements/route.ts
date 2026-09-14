import { NextRequest, NextResponse } from 'next/server';
import { verifyServerPermission } from '@/lib/auth/serverGuard';
import { createAdminClient } from '@/lib/supabase/admin';
import { AuditService, AUDIT_ACTIONS } from '@/lib/services/auditService';

// In-memory persistent announcements storage
interface AnnouncementRecord {
  id: string;
  title: string;
  content: string;
  target_audience: 'all' | 'see' | 'cee' | 'batch';
  batch_id?: string;
  is_pinned: boolean;
  is_archived: boolean;
  author_id: string;
  created_at: string;
}

const memoryAnnouncements: AnnouncementRecord[] = [
  {
    id: 'ann_1',
    title: 'CEE Grand Mock Examination Window Open',
    content: 'All Medical entrance aspirants can now attempt Grand Mock 1 under synchronized examination timer rules.',
    target_audience: 'cee',
    is_pinned: true,
    is_archived: false,
    author_id: 'admin_root',
    created_at: new Date(Date.now() - 24 * 3600000).toISOString(),
  },
  {
    id: 'ann_2',
    title: 'SEE Class 10 Model Paper Answer Keys Published',
    content: 'Comprehensive step-by-step solutions for Group A-D now available in the Solutions section.',
    target_audience: 'see',
    is_pinned: false,
    is_archived: false,
    author_id: 'admin_root',
    created_at: new Date(Date.now() - 48 * 3600000).toISOString(),
  },
];

export async function GET(req: NextRequest) {
  const guard = await verifyServerPermission(req, 'admin:access');
  if (!guard.authorized) return guard.response;

  try {
    const admin = createAdminClient();
    if (admin) {
      const { data, error } = await admin
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        return NextResponse.json({ success: true, announcements: data });
      }
    }
  } catch (err) {
    // fallback
  }

  return NextResponse.json({
    success: true,
    announcements: memoryAnnouncements.filter((a) => !a.is_archived),
  });
}

export async function POST(req: NextRequest) {
  const guard = await verifyServerPermission(req, 'announcements:manage');
  if (!guard.authorized) return guard.response;

  try {
    const body = await req.json();
    const { title, content, targetAudience = 'all', isPinned = false, batchId } = body;

    if (!title || !content) {
      return NextResponse.json({ success: false, error: 'Title and content are required.' }, { status: 400 });
    }

    const newRecord: AnnouncementRecord = {
      id: `ann_${Date.now()}`,
      title,
      content,
      target_audience: targetAudience,
      batch_id: batchId,
      is_pinned: Boolean(isPinned),
      is_archived: false,
      author_id: guard.user.id,
      created_at: new Date().toISOString(),
    };

    memoryAnnouncements.unshift(newRecord);

    // Try Supabase insert
    try {
      const admin = createAdminClient();
      if (admin) {
        await admin.from('announcements').insert({
          title: newRecord.title,
          content: newRecord.content,
          is_pinned: newRecord.is_pinned,
          author_id: guard.user.id,
          batch_id: newRecord.batch_id,
        });
      }
    } catch {}

    // Audit log
    await AuditService.recordAuditEvent({
      actorId: guard.user.id,
      actorEmail: guard.email,
      action: AUDIT_ACTIONS.ANNOUNCEMENT_BROADCAST,
      resourceType: 'announcement',
      resourceId: newRecord.id,
      changesDiff: {
        title,
        targetAudience,
        isPinned,
      },
      ipAddress: guard.ipAddress,
      userAgent: guard.userAgent,
    });

    return NextResponse.json({ success: true, announcement: newRecord });
  } catch (err: any) {
    console.error('admin/announcements POST error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const guard = await verifyServerPermission(req, 'announcements:manage');
  if (!guard.authorized) return guard.response;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'Announcement ID required' }, { status: 400 });

    const item = memoryAnnouncements.find((a) => a.id === id);
    if (item) {
      item.is_archived = true;
    }

    await AuditService.recordAuditEvent({
      actorId: guard.user.id,
      actorEmail: guard.email,
      action: 'announcement_archive',
      resourceType: 'announcement',
      resourceId: id,
      ipAddress: guard.ipAddress,
      userAgent: guard.userAgent,
    });

    return NextResponse.json({ success: true, message: 'Announcement archived successfully.' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
