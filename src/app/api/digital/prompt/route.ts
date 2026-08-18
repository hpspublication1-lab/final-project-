import { NextRequest, NextResponse } from 'next/server';
import { requireUser, createAdminClient } from '@/lib/supabase/route-auth';
import { assertAiQuota, callChatCompletion, parseJsonResponse } from '@/lib/ai/completion';
import { promptPlaygroundSchema, toErrorResponse } from '@/lib/validation/schemas';

const GRADER_PROMPT = `You are teaching prompt engineering to beginners in Nepal.
Evaluate the student's PROMPT (not the topic) on four dimensions, each scored 0-10:
- clarity: is the ask unambiguous?
- specificity: enough detail to produce a useful result?
- context: does it give the model the background it needs?
- constraints: does it specify format, length, tone, or audience?

Be encouraging but honest — a vague prompt scores low even if the topic is good.
Respond with ONLY valid JSON, no markdown fences:
{
  "scores": {"clarity": number, "specificity": number, "context": number, "constraints": number},
  "total": number,
  "critique": string,
  "improved_prompt": string
}`;

interface PromptGrade {
  scores: { clarity: number; specificity: number; context: number; constraints: number };
  total: number;
  critique: string;
  improved_prompt: string;
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const { prompt, gradePrompt } = promptPlaygroundSchema.parse(await req.json());

    await assertAiQuota(user.id);

    const cookie = req.headers.get('cookie') ?? '';

    const [output, grade] = await Promise.all([
      callChatCompletion(req.url, cookie, [
        {
          role: 'system',
          content:
            'You are an AI playground for students learning prompt engineering. Answer their prompt directly and usefully, as ChatGPT or Claude would.',
        },
        { role: 'user', content: prompt },
      ]),
      gradePrompt
        ? callChatCompletion(req.url, cookie, [
            { role: 'system', content: GRADER_PROMPT },
            { role: 'user', content: `Student's prompt:\n${prompt}` },
          ])
            .then((raw) => parseJsonResponse<PromptGrade>(raw))
            .catch(() => null)
        : Promise.resolve(null),
    ]);

    const admin = createAdminClient();
    const { data: attempt } = await admin
      .from('digital_prompt_attempts')
      .insert({
        user_id: user.id,
        prompt_text: prompt,
        ai_output: output,
        prompt_score: grade?.total ?? null,
        score_breakdown: grade?.scores ?? null,
        improved_prompt: grade?.improved_prompt ?? null,
      })
      .select('id')
      .single();

    return NextResponse.json({
      output,
      grade,
      attempt_id: attempt?.id ?? null,
    });
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function GET() {
  try {
    const user = await requireUser();
    const admin = createAdminClient();

    const { data, error } = await admin
      .from('digital_prompt_attempts')
      .select('id, prompt_text, prompt_score, score_breakdown, improved_prompt, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(25);

    if (error) throw error;

    const scored = (data ?? []).filter((a) => a.prompt_score !== null);
    const averageScore = scored.length
      ? Number((scored.reduce((s, a) => s + Number(a.prompt_score), 0) / scored.length).toFixed(1))
      : null;

    return NextResponse.json({ attempts: data, averageScore });
  } catch (err) {
    return toErrorResponse(err);
  }
}
