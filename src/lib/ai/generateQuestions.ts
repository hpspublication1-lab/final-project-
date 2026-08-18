import 'server-only';

/**
 * Shared CEE MCQ generator. Calls OpenAI to produce exam-accurate multiple-choice
 * questions and returns them normalised to the `questions` table shape
 * (options[] + correct_answer letter). Used by the admin generate route and
 * the bulk seed. Generates in chunks (OpenAI can't reliably emit 200 at once).
 */
export interface GeneratedQuestion {
  question_text: string;
  options: string[];      // exactly 4
  correct_answer: string; // 'A' | 'B' | 'C' | 'D'
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

const SUBJECT_PROMPT: Record<string, string> = {
  biology: 'Biology (Botany & Zoology) for the Nepal MEC CEE medical entrance exam',
  chemistry: 'Chemistry (physical, organic, inorganic) for the Nepal MEC CEE medical entrance exam',
  physics: 'Physics for the Nepal MEC CEE medical entrance exam',
  mental_agility: 'Mental Agility Test (MAT): logical reasoning, number/letter series, analogies, coding-decoding, and basic quantitative aptitude for the Nepal MEC CEE',
};

const CHUNK = 20; // questions per OpenAI call

async function generateChunk(subjectKey: string, n: number, avoid: string[]): Promise<GeneratedQuestion[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY is not configured on the server.');

  const subjectLabel = SUBJECT_PROMPT[subjectKey] ?? subjectKey;
  const avoidNote = avoid.length
    ? `\nDo NOT repeat or paraphrase any of these already-used questions:\n- ${avoid.slice(0, 40).join('\n- ')}`
    : '';

  const prompt =
    `Generate ${n} high-quality, factually-correct, exam-accurate multiple-choice questions for ${subjectLabel}. ` +
    `Each question must have exactly 4 distinct options and exactly one correct answer. Mix difficulty (easy/medium/hard). ` +
    `Return ONLY valid JSON: an object {"questions":[ ... ]} where each item is ` +
    `{"question":"...","options":["opt1","opt2","opt3","opt4"],"correct":"A","explanation":"why the answer is correct","difficulty":"easy|medium|hard"}. ` +
    `"correct" is the letter (A/B/C/D) of the correct option.${avoidNote}`;

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      response_format: { type: 'json_object' },
    }),
    cache: 'no-store',
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e?.error?.message ?? `OpenAI error ${res.status}`);
  }
  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content ?? '{}';
  let arr: any[] = [];
  try {
    const parsed = JSON.parse(raw);
    arr = Array.isArray(parsed) ? parsed : (parsed.questions || parsed.mcqs || parsed.items || Object.values(parsed).find(Array.isArray) || []);
  } catch {
    arr = [];
  }

  const out: GeneratedQuestion[] = [];
  for (const q of arr) {
    if (!q?.question || !Array.isArray(q.options) || q.options.length < 4) continue;
    const letter = String(q.correct ?? q.answer ?? '').trim().toUpperCase().replace(/[^A-D]/g, '').slice(0, 1);
    if (!['A', 'B', 'C', 'D'].includes(letter)) continue;
    out.push({
      question_text: String(q.question).trim(),
      options: q.options.slice(0, 4).map((o: any) => String(o)),
      correct_answer: letter,
      explanation: String(q.explanation ?? '').trim(),
      difficulty: ['easy', 'medium', 'hard'].includes(q.difficulty) ? q.difficulty : 'medium',
    });
  }
  return out;
}

/** Generate `count` questions for a subject, in chunks, de-duped against `existing` texts. */
export async function generateQuestions(subjectKey: string, count: number, existing: string[] = []): Promise<GeneratedQuestion[]> {
  const seen = new Set(existing.map((t) => t.trim().toLowerCase()));
  const results: GeneratedQuestion[] = [];
  let safety = 0;
  while (results.length < count && safety < Math.ceil(count / CHUNK) + 3) {
    safety++;
    const need = Math.min(CHUNK, count - results.length);
    const avoid = [...existing.slice(-20), ...results.slice(-20).map((r) => r.question_text)];
    let chunk: GeneratedQuestion[] = [];
    try {
      chunk = await generateChunk(subjectKey, need, avoid);
    } catch {
      break; // stop on API error; caller inserts what we have
    }
    for (const q of chunk) {
      const key = q.question_text.trim().toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      results.push(q);
    }
    if (chunk.length === 0) break;
  }
  return results.slice(0, count);
}
