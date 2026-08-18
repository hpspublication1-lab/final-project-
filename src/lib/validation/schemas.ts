import { z } from 'zod';
import { NextResponse } from 'next/server';
import { AiLimitError, AiServiceError } from '@/lib/ai/completion';
import { UnauthorizedError } from '@/lib/supabase/route-auth';

export const promptPlaygroundSchema = z.object({
  prompt: z.string().trim().min(3, 'Prompt is too short').max(4000, 'Prompt is too long'),
  gradePrompt: z.boolean().optional().default(true),
});

export const moduleCompletionSchema = z.object({
  moduleId: z.string().uuid('Invalid module id'),
  completed: z.boolean().default(true),
});

export const projectSubmissionSchema = z.object({
  trackId: z.string().uuid('Invalid track id'),
  title: z.string().trim().min(3).max(200),
  submissionUrl: z.string().url('Must be a valid URL').optional(),
  description: z.string().trim().max(2000).optional(),
});

export const englishPracticeSchema = z.object({
  taskTypeSlug: z.string().trim().min(1),
  promptText: z.string().trim().min(3).max(2000),
  responseText: z.string().trim().min(10, 'Write a bit more before submitting').max(8000),
});

export const certificateSchema = z.object({
  trackId: z.string().uuid('Invalid track id'),
});

export function toErrorResponse(err: unknown): NextResponse {
  if (err instanceof UnauthorizedError) {
    return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
  }
  if (err instanceof AiLimitError) {
    return NextResponse.json(
      { error: 'Daily AI limit reached', code: 'AI_LIMIT' },
      { status: 429 }
    );
  }
  if (err instanceof z.ZodError) {
    const message = err.issues?.[0]?.message ?? 'Invalid input';
    return NextResponse.json(
      { error: message, code: 'VALIDATION' },
      { status: 400 }
    );
  }
  if (err instanceof AiServiceError) {
    return NextResponse.json(
      { error: 'The AI service is unavailable right now. Please try again.', code: 'AI_UNAVAILABLE' },
      { status: 502 }
    );
  }

  console.error('Unhandled route error:', err);
  return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
}
