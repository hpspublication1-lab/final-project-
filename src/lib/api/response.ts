/**
 * Standardized API Response Utilities
 * Enforces uniform envelope across all Next.js API route handlers.
 */

import { NextResponse } from 'next/server';
import { AppError } from '@/lib/errors';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    timestamp: string;
  };
}

export function apiSuccess<T>(data: T, meta?: Omit<ApiResponse['meta'], 'timestamp'>, status = 200) {
  const payload: ApiResponse<T> = {
    success: true,
    data,
    meta: {
      ...meta,
      timestamp: new Date().toISOString(),
    },
  };
  return NextResponse.json(payload, { status });
}

export function apiError(error: unknown) {
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.errorCode,
          message: error.message,
          details: error.details,
        },
        meta: { timestamp: new Date().toISOString() },
      },
      { status: error.statusCode }
    );
  }

  const message = error instanceof Error ? error.message : 'An unexpected server error occurred';
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message,
      },
      meta: { timestamp: new Date().toISOString() },
    },
    { status: 500 }
  );
}
