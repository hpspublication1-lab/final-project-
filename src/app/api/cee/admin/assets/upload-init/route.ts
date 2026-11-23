import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { hasPermission } from '@/lib/auth/rbac';
import { type UserRoleType } from '@/types/lms';
import crypto from 'crypto';

const ALLOWED_MIME_TYPES = [
  'model/gltf-binary', // .glb
  'model/gltf+json',   // .gltf
  'image/svg+xml',     // .svg
  'image/png',         // .png
  'image/jpeg',        // .jpg, .jpeg
  'application/octet-stream', // often returned for .glb
];

const ALLOWED_EXTENSIONS = ['.glb', '.gltf', '.svg', '.png', '.jpg', '.jpeg'];
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB ceiling

/**
 * POST /api/cee/admin/assets/upload-init
 * Issues short-lived upload authorization for quarantine storage.
 * Enforces file size limits, extension allowlists, and visual:author RBAC permission (CEE-003).
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Check user authentication
    if (!user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } },
        { status: 401 }
      );
    }

    // Check user RBAC role & permission
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    const userRole = (profile?.role as UserRoleType) || 'student_free';
    if (!hasPermission(userRole, 'visual:author') && !hasPermission(userRole, 'admin:access')) {
      return NextResponse.json(
        {
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to upload visual assets (visual:author required).',
          },
        },
        { status: 403 }
      );
    }

    // Parse and validate request body
    let body: {
      fileName?: string;
      fileSizeBytes?: number;
      mimeType?: string;
      assetTitle?: string;
      kind?: string;
    };

    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: { code: 'INVALID_REQUEST', message: 'Invalid JSON request body.' } },
        { status: 400 }
      );
    }

    const { fileName, fileSizeBytes, mimeType, assetTitle, kind } = body;

    if (!fileName || !fileSizeBytes || !mimeType) {
      return NextResponse.json(
        { error: { code: 'MISSING_FIELDS', message: 'fileName, fileSizeBytes, and mimeType are required.' } },
        { status: 400 }
      );
    }

    // Enforce 50MB size ceiling
    if (fileSizeBytes > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        {
          error: {
            code: 'FILE_TOO_LARGE',
            message: `File size (${(fileSizeBytes / (1024 * 1024)).toFixed(1)}MB) exceeds maximum allowed ceiling of 50MB.`,
          },
        },
        { status: 413 }
      );
    }

    // Enforce file extension check
    const lowerName = fileName.toLowerCase();
    const hasValidExt = ALLOWED_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
    if (!hasValidExt) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_FILE_EXTENSION',
            message: `File extension not permitted. Allowed extensions: ${ALLOWED_EXTENSIONS.join(', ')}`,
          },
        },
        { status: 422 }
      );
    }

    // Enforce MIME type check
    if (!ALLOWED_MIME_TYPES.includes(mimeType.toLowerCase())) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_MIME_TYPE',
            message: `MIME type '${mimeType}' is not supported for 3D/2D visual assets.`,
          },
        },
        { status: 422 }
      );
    }

    // Generate secure quarantine storage key
    const quarantineId = crypto.randomUUID();
    const sanitizedBaseName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storageKey = `quarantine/${quarantineId}/${sanitizedBaseName}`;
    const uploadTicket = crypto.randomBytes(24).toString('hex');

    return NextResponse.json({
      data: {
        uploadTicket,
        storageKey,
        bucket: 'cee-quarantine',
        maxSizeBytes: MAX_FILE_SIZE_BYTES,
        expiresInSeconds: 900, // 15 minutes
        metadata: {
          assetTitle: assetTitle || fileName,
          kind: kind || 'MODEL_3D',
          uploaderId: user.id,
        },
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message } },
      { status: 500 }
    );
  }
}
