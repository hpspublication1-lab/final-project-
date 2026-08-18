import { callAIEndpoint } from './aiClient';

const ENDPOINT = '/api/ai/chat-completion';

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

function isRateLimitError(error: Error): boolean {
  return error.message.includes('429') || error.message.toLowerCase().includes('rate limit') || error.message.toLowerCase().includes('too many requests');
}

function getRateLimitMessage(): string {
  return 'The AI service is currently busy (rate limit reached). Please wait a moment and try again.';
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getChatCompletion(
  provider: string,
  model: string,
  messages: object[],
  parameters: object = {}
) {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await callAIEndpoint(ENDPOINT, {
        provider,
        model,
        messages,
        stream: false,
        parameters,
      });
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (isRateLimitError(lastError) && attempt < MAX_RETRIES - 1) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt);
        console.warn(`Rate limit hit, retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})`);
        await sleep(delay);
        continue;
      }
      throw isRateLimitError(lastError) ? new Error(getRateLimitMessage()) : lastError;
    }
  }

  throw lastError ?? new Error('Request failed after retries');
}

export async function getStreamingChatCompletion(
  provider: string,
  model: string,
  messages: object[],
  onChunk: (chunk: any) => void,
  onComplete: () => void,
  onError: (error: Error) => void,
  parameters: object = {}
) {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, model, messages, stream: true, parameters }),
      });

      if (!response.ok) {
        const data = await response.json();
        const errMsg = data.error || `HTTP error: ${response.status}`;
        const err = new Error(errMsg);

        if (response.status === 429 && attempt < MAX_RETRIES - 1) {
          const delay = BASE_DELAY_MS * Math.pow(2, attempt);
          console.warn(`Rate limit hit, retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})`);
          await sleep(delay);
          continue;
        }

        throw response.status === 429 ? new Error(getRateLimitMessage()) : err;
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('Response body is not readable');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === 'chunk' && data.chunk) {
                onChunk(data.chunk);
              } else if (data.type === 'done') {
                onComplete();
              } else if (data.type === 'error') {
                const streamErr = new Error(data.error);
                if (isRateLimitError(streamErr) && attempt < MAX_RETRIES - 1) {
                  const delay = BASE_DELAY_MS * Math.pow(2, attempt);
                  console.warn(`Rate limit hit in stream, retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})`);
                  await sleep(delay);
                  break;
                }
                onError(isRateLimitError(streamErr) ? new Error(getRateLimitMessage()) : streamErr);
                return;
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }

      // Success — exit retry loop
      return;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (isRateLimitError(lastError) && attempt < MAX_RETRIES - 1) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt);
        console.warn(`Rate limit hit, retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})`);
        await sleep(delay);
        continue;
      }

      const finalError = isRateLimitError(lastError) ? new Error(getRateLimitMessage()) : lastError;
      console.error('Streaming error:', finalError);
      onError(finalError);
      return;
    }
  }

  // All retries exhausted
  const finalError = lastError && isRateLimitError(lastError)
    ? new Error(getRateLimitMessage())
    : (lastError ?? new Error('Request failed after retries'));
  console.error('All retries exhausted:', finalError);
  onError(finalError);
}
