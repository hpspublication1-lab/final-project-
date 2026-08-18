import { createAdminClient } from '@/lib/supabase/route-auth';

export class AiLimitError extends Error {
  constructor() {
    super('Daily AI limit reached');
    this.name = 'AiLimitError';
  }
}

export class AiServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AiServiceError';
  }
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function assertAiQuota(userId: string): Promise<void> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc('check_and_increment_ai_usage', {
      p_free_limit: 50,
      p_pro_limit: 500,
    });

    if (error) {
      console.warn('Quota RPC check skipped:', error.message);
      return;
    }
    const row = Array.isArray(data) ? data[0] : data;
    if (row && row.allowed === false) {
      throw new AiLimitError();
    }
  } catch (err) {
    if (err instanceof AiLimitError) throw err;
    console.warn('Quota check error (proceeding):', err);
  }
}

function extractText(payload: unknown): string {
  if (typeof payload === 'string') return payload;
  if (!payload || typeof payload !== 'object') return '';

  const p = payload as Record<string, any>;
  if (typeof p.message === 'string') return p.message;
  if (typeof p.content === 'string') return p.content;
  if (typeof p.text === 'string') return p.text;
  if (typeof p.output === 'string') return p.output;

  if (Array.isArray(p.content)) {
    return p.content
      .filter((b: any) => b?.type === 'text' && typeof b.text === 'string')
      .map((b: any) => b.text)
      .join('\n');
  }
  if (Array.isArray(p.choices) && p.choices[0]?.message?.content) {
    return String(p.choices[0].message.content);
  }
  if (typeof p.message?.content === 'string') return p.message.content;

  return '';
}

export async function callChatCompletion(
  baseUrl: string,
  cookie: string,
  messages: ChatMessage[],
  { retries = 2 }: { retries?: number } = {}
): Promise<string> {
  let lastError = '';

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const targetUrl = new URL('/api/ai/chat-completion', baseUrl);
      const res = await fetch(targetUrl.toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(cookie ? { cookie } : {}) },
        body: JSON.stringify({ messages }),
      });

      if (res.status === 429) throw new AiLimitError();

      if (!res.ok) {
        lastError = `Upstream returned ${res.status}`;
        if (res.status < 500) break;
      } else {
        const text = extractText(await res.json());
        if (text) return text;
        lastError = 'Empty response from AI service';
      }
    } catch (err) {
      if (err instanceof AiLimitError) throw err;
      lastError = err instanceof Error ? err.message : 'Unknown error';
    }

    if (attempt < retries) {
      await new Promise((r) => setTimeout(r, 400 * Math.pow(2, attempt)));
    }
  }

  throw new AiServiceError(lastError || 'AI service unavailable');
}

export function parseJsonResponse<T>(raw: string): T {
  const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start !== -1 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1)) as T;
      } catch {
        /* fall through */
      }
    }
    throw new AiServiceError('Could not parse a structured response from the AI service');
  }
}
