import { NextRequest, NextResponse } from 'next/server';
import { completion } from '@rocketnew/llm-sdk';
import { createClient } from '@/lib/supabase/server';

const API_KEYS: Record<string, string | undefined> = {
  OPEN_AI: process.env.OPENAI_API_KEY,
  ANTHROPIC: process.env.ANTHROPIC_API_KEY,
  GEMINI: process.env.GEMINI_API_KEY,
  PERPLEXITY: process.env.PERPLEXITY_API_KEY,
};

const PROVIDER_DEFAULT_MODEL: Record<string, string> = {
  OPEN_AI: 'gpt-4o',
  ANTHROPIC: 'claude-3-5-sonnet-latest',
  GEMINI: 'gemini-1.5-pro',
  PERPLEXITY: 'sonar',
};
const PROVIDER_PRIORITY = ['OPEN_AI', 'ANTHROPIC', 'GEMINI', 'PERPLEXITY'];

function resolveProvider(
  requestedProvider: string,
  requestedModel: string
): { provider: string; model: string; apiKey: string } | null {
  if (API_KEYS[requestedProvider]) {
    return { provider: requestedProvider, model: requestedModel, apiKey: API_KEYS[requestedProvider]! };
  }
  for (const p of PROVIDER_PRIORITY) {
    if (API_KEYS[p]) {
      return { provider: p, model: PROVIDER_DEFAULT_MODEL[p], apiKey: API_KEYS[p]! };
    }
  }
  return null;
}

async function enforceRateLimit(): Promise<NextResponse | null> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required', details: 'You must be signed in to use AI features.' },
        { status: 401 }
      );
    }

    // Try rate limit RPC if available, but do not block requests if RPC function is missing
    const { data, error } = await supabase.rpc('check_and_increment_ai_usage', {
      p_free_limit: 50,
      p_pro_limit: 500,
    });

    if (error) {
      console.warn('AI rate-limit RPC check skipped:', error.message);
      return null;
    }

    const row = Array.isArray(data) ? data[0] : data;
    if (row && row.allowed === false) {
      return NextResponse.json(
        {
          error: 'Daily AI limit reached',
          details: `You've used all ${row.daily_limit} AI requests for today. Upgrade to Pro for a higher limit, or try again tomorrow.`,
        },
        { status: 429 }
      );
    }

    return null;
  } catch (err) {
    console.warn('AI rate-limit unexpected warning (allowing request):', err);
    return null;
  }
}

function formatErrorResponse(error: unknown, provider?: string) {
  const statusCode = (error as any)?.statusCode || (error as any)?.status || 500;
  const providerName = (error as any)?.llmProvider || provider || 'Unknown';

  return {
    error: `${providerName.toUpperCase()} API error: ${statusCode}`,
    details: error instanceof Error ? error.message : String(error),
    statusCode,
  };
}

export async function POST(request: NextRequest) {
  let body: any = {};

  try {
    body = await request.json();
    const { provider = 'OPEN_AI', model = 'gpt-4o', messages, stream = false, parameters = {} } = body;

    if (!messages?.length) {
      return NextResponse.json(
        { error: 'Missing required field: messages', details: 'Request validation failed' },
        { status: 400 }
      );
    }

    const MAX_MESSAGES = 60;
    const MAX_TOTAL_CHARS = 48_000;
    if (!Array.isArray(messages) || messages.length > MAX_MESSAGES) {
      return NextResponse.json(
        { error: 'Too many messages', details: `A request may contain at most ${MAX_MESSAGES} messages.` },
        { status: 400 }
      );
    }
    const totalChars = messages.reduce(
      (sum: number, m: any) => sum + (typeof m?.content === 'string' ? m.content.length : 0),
      0
    );
    if (totalChars > MAX_TOTAL_CHARS) {
      return NextResponse.json(
        { error: 'Prompt too large', details: 'Your input is too long. Please shorten it and try again.' },
        { status: 413 }
      );
    }

    const resolved = resolveProvider(provider, model);
    const apiKey = resolved?.apiKey || process.env.OPENAI_API_KEY;
    const resolvedModel = resolved?.model || 'gpt-4o';
    const resolvedProvider = resolved?.provider || 'OPEN_AI';

    // Auth + per-user daily quota
    const limited = await enforceRateLimit();
    if (limited) return limited;

    const lastMsg = messages[messages.length - 1]?.content ?? 'question';

    // Inject Realtime Context into System Prompt
    const realtimeInstruction = `\n\n[REALTIME SYSTEM CONTEXT]
- Current Server Time: ${new Date().toISOString()}
- Realtime Platform State: Samyak CEE & SEE Mastery Platform (292 Bunny.net HD Video Lectures, 15,000+ Database MCQs, 2-Player Realtime Battle Arena).`;



    const updatedMessages = messages.map((m: any, idx: number) => {
      if (m.role === 'system' && idx === 0) {
        return { ...m, content: m.content + realtimeInstruction };
      }
      return m;
    });

    if (!updatedMessages.some((m: any) => m.role === 'system')) {
      updatedMessages.unshift({
        role: 'system',
        content: `You are SamyakGURU AI, Nepal's top AI academic assistant.${realtimeInstruction}`,
      });
    }

    // Direct OpenAI API integration if API Key is configured
    if (apiKey && (resolvedProvider === 'OPEN_AI' || apiKey.startsWith('sk-'))) {
      try {
        const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: resolvedModel.includes('gpt') ? resolvedModel : 'gpt-4o',
            messages: updatedMessages,
            stream,
            ...parameters,
          }),
        });


        if (openaiRes.ok && stream && openaiRes.body) {
          // OpenAI streams its OWN SSE shape (`data: {choices:[{delta}]}` +
          // `data: [DONE]`). The browser client only understands this app's
          // protocol (`{type:'chunk', chunk}` / `{type:'done'}`), so transform
          // OpenAI's stream into it — otherwise streamed replies render empty.
          const encoder = new TextEncoder();
          const decoder = new TextDecoder();
          const upstream = openaiRes.body.getReader();

          const readable = new ReadableStream({
            async start(controller) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'start' })}\n\n`));
              let buffer = '';
              try {
                while (true) {
                  const { done, value } = await upstream.read();
                  if (done) break;
                  buffer += decoder.decode(value, { stream: true });
                  const lines = buffer.split('\n');
                  buffer = lines.pop() ?? '';
                  for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed.startsWith('data:')) continue;
                    const payload = trimmed.slice(5).trim();
                    if (payload === '' ) continue;
                    if (payload === '[DONE]') {
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
                      controller.close();
                      return;
                    }
                    try {
                      const chunk = JSON.parse(payload);
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'chunk', chunk })}\n\n`));
                    } catch {
                      // ignore keep-alive / partial lines
                    }
                  }
                }
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
                controller.close();
              } catch (streamErr) {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ type: 'error', error: 'AI stream interrupted. Please try again.' })}\n\n`)
                );
                controller.close();
              }
            },
          });

          return new NextResponse(readable, {
            headers: {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              Connection: 'keep-alive',
            },
          });
        }

        if (openaiRes.ok && !stream) {
          const data = await openaiRes.json();
          return NextResponse.json(data);
        }

        const errJson = await openaiRes.json().catch(() => ({}));
        const openaiErrMsg = errJson?.error?.message || `HTTP ${openaiRes.status}`;
        console.warn('OpenAI API returned error:', openaiErrMsg);

        // Build a helpful student response with a friendly status note. The
        // underlying provider error is logged server-side above — we never leak
        // model/provider details to students.
        const note = `*(SamyakGURU is briefly busy right now. Please try again in a moment.)*`;
        const fallbackText = `Hello! I'm SamyakGURU, your CEE AI tutor.\n\n${note}\n\nRegarding your question on "${lastMsg.slice(0, 60)}...":\n\n1. **Key Concept**: Focus on high-yield CEE topics in Physics, Chemistry, Biology, and MAT.\n2. **High-Yield Tip**: Always memorize standard formulas, reaction conditions, and botanical/zoological definitions.\n3. **Practice Strategy**: Solve past 10-year CEE questions to master time management (54 sec/question).`;

        if (stream) {
          const encoder = new TextEncoder();
          const readable = new ReadableStream({
            async start(controller) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'start' })}\n\n`));
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'chunk', chunk: fallbackText })}\n\n`));
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
              controller.close();
            },
          });
          return new NextResponse(readable, {
            headers: {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              Connection: 'keep-alive',
            },
          });
        }

        return NextResponse.json({
          choices: [{ message: { role: 'assistant', content: fallbackText } }],
        });
      } catch (directErr: any) {
        console.warn('Direct OpenAI fetch error:', directErr?.message);
      }
    }

    // Fallback to llm-sdk completion
    if (apiKey) {
      try {
        if (stream) {
          const responseStream = await completion({
            model: resolvedModel,
            messages,
            stream: true,
            api_key: apiKey,
            ...parameters,
          });

          const encoder = new TextEncoder();
          const readable = new ReadableStream({
            async start(controller) {
              try {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'start' })}\n\n`));
                for await (const chunk of responseStream as unknown as AsyncIterable<unknown>) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'chunk', chunk })}\n\n`));
                }
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
                controller.close();
              } catch (error) {
                const formatted = formatErrorResponse(error, provider);
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', error: formatted.error })}\n\n`));
                controller.close();
              }
            },
          });

          return new NextResponse(readable, {
            headers: {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              Connection: 'keep-alive',
            },
          });
        }

        const response = await completion({
          model: resolvedModel,
          messages,
          stream: false,
          api_key: apiKey,
          ...parameters,
        });
        return NextResponse.json(response);
      } catch (sdkErr: any) {
        console.warn('LLM SDK call failed:', sdkErr?.message);
      }
    }

    // Server-wide default CEE Tutor fallback response
    const defaultText = `Hello! I'm SamyakGURU, your CEE AI tutor.\n\n*(SamyakGURU is being set up. Please try again shortly.)*\n\nRegarding your question on "${lastMsg.slice(0, 60)}...":\n\n1. **Key Concept**: CEE exams test 200 questions across Physics, Chemistry, Biology, and MAT.\n2. **High-Yield Tip**: Focus on previous year questions (PYQs) and high-weightage chapters.\n3. **Action Step**: Use our Practice Section to solve chapterwise MCQs with +1/-0.25 CEE marking!`;

    if (stream) {
      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'start' })}\n\n`));
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'chunk', chunk: defaultText })}\n\n`));
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
          controller.close();
        },
      });
      return new NextResponse(readable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    }

    return NextResponse.json({
      choices: [{ message: { role: 'assistant', content: defaultText } }],
    });
  } catch (error) {
    const formatted = formatErrorResponse(error, body?.provider);
    console.error('API Route Error:', { error: formatted.error, details: formatted.details });
    return NextResponse.json(
      { error: formatted.error, details: formatted.details },
      { status: formatted.statusCode }
    );
  }
}
