import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { AGENT_REGISTRY, AgentId, getAgent } from '@/lib/ai/agents/agentRegistry';

/**
 * POST /api/ai/neural/chat
 *
 * Main entry point for the AI Neural Schema.
 * Accepts a student message, routes through the Orchestrator Brain,
 * and returns the coordinated multi-agent response.
 *
 * Supports both streaming and non-streaming modes.
 */

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

interface RoutingDecision {
  intent: string;
  agents: string[];
  reasoning: string;
  isGeneral: boolean;
  directResponse: string | null;
}

interface AgentResponse {
  agent: string;
  agentName: string;
  agentEmoji: string;
  response: string;
  latencyMs: number;
  model: string;
}

async function callOpenAI(
  messages: Array<{ role: string; content: string }>,
  model: string = 'gpt-4o',
  temperature: number = 0.5,
  maxTokens: number = 2000,
  jsonMode: boolean = false
): Promise<{ content: string; tokens: number }> {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  const body: Record<string, unknown> = {
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
  };
  if (jsonMode) {
    body.response_format = { type: 'json_object' };
  }

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `OpenAI error ${res.status}`);
  }

  const data = await res.json();
  return {
    content: data.choices?.[0]?.message?.content || '',
    tokens: data.usage?.total_tokens || 0,
  };
}

async function enforceRateLimit(supabase: Awaited<ReturnType<typeof createClient>>): Promise<NextResponse | null> {
  try {
    const { data, error } = await supabase.rpc('check_and_increment_ai_usage', {
      p_free_limit: 50,
      p_pro_limit: 500,
    });
    if (error) return null;
    const row = Array.isArray(data) ? data[0] : data;
    if (row && row.allowed === false) {
      return NextResponse.json(
        {
          error: 'Daily AI limit reached',
          details: `You've used all ${row.daily_limit} AI requests for today. Upgrade to Pro for a higher limit.`,
        },
        { status: 429 }
      );
    }
    return null;
  } catch {
    return null;
  }
}

function parseRoutingDecision(raw: string): RoutingDecision {
  try {
    const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start !== -1 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1));
    }
    return JSON.parse(cleaned);
  } catch {
    return {
      intent: 'general',
      agents: [],
      reasoning: 'Failed to parse routing decision',
      isGeneral: true,
      directResponse: null,
    };
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // 1. Authenticate
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // 2. Rate limit
    const limited = await enforceRateLimit(supabase);
    if (limited) return limited;

    // 3. Parse request
    const body = await request.json();
    const {
      message,
      courseId = 'cee_medical',
      sessionId,
      conversationHistory = [],
      stream = false,
    } = body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // 4. Load student learning context
    let learningContext: Record<string, unknown> = {};
    try {
      const { data } = await admin.rpc('get_student_learning_context', {
        p_user_id: user.id,
        p_course_id: courseId,
      });
      if (data) learningContext = data as Record<string, unknown>;
    } catch {
      // Continue without learning context
    }

    // 5. Route via Orchestrator
    const orchestratorAgent = getAgent('orchestrator');
    const routingMessages = [
      { role: 'system', content: orchestratorAgent.systemPrompt },
      ...(conversationHistory.length > 0
        ? [{ role: 'user', content: `Recent conversation context:\n${conversationHistory.slice(-3).map((m: { role: string; content: string }) => `${m.role}: ${m.content}`).join('\n')}` }]
        : []),
      {
        role: 'user',
        content: `Student's course: ${courseId}\nStudent's learning profile: ${JSON.stringify(learningContext)}\n\nStudent's message: ${message}`,
      },
    ];

    const routingResult = await callOpenAI(
      routingMessages,
      orchestratorAgent.model,
      orchestratorAgent.temperature,
      orchestratorAgent.maxTokens,
      true
    );

    const routing = parseRoutingDecision(routingResult.content);
    let totalTokens = routingResult.tokens;

    // 6. Handle general/greeting queries directly
    if (routing.isGeneral && routing.directResponse) {
      // Save conversation
      await admin.from('agent_conversations').insert({
        user_id: user.id,
        session_id: sessionId || undefined,
        course_id: courseId,
        user_message: message,
        intent_class: routing.intent,
        routed_agents: [],
        routing_reasoning: routing.reasoning,
        agent_responses: [],
        final_response: routing.directResponse,
        total_latency_ms: Date.now() - startTime,
        total_tokens: totalTokens,
        model_used: orchestratorAgent.model,
        is_multi_agent: false,
      });

      if (stream) {
        return streamResponse(routing.directResponse, [], routing.intent);
      }

      return NextResponse.json({
        response: routing.directResponse,
        intent: routing.intent,
        agents: [],
        isMultiAgent: false,
        sessionId,
        latencyMs: Date.now() - startTime,
      });
    }

    // 7. Route to specialized agents
    const validAgents = routing.agents
      .filter((id: string) => id in AGENT_REGISTRY && id !== 'orchestrator')
      .slice(0, 3) as AgentId[];

    // Fallback: if no agents matched, use science_tutor for academic or content_recommender for general
    if (validAgents.length === 0) {
      const fallbackAgent = ['cee_medical', 'see_class_10'].includes(courseId) ? 'science_tutor' : 'content_recommender';
      validAgents.push(fallbackAgent as AgentId);
    }

    // 8. Call agents in parallel
    const agentPromises = validAgents.map(async (agentId): Promise<AgentResponse> => {
      const agentStart = Date.now();
      const agent = getAgent(agentId);

      // Build context-enriched system prompt
      const contextBlock = Object.keys(learningContext).length > 0
        ? `\n\n[STUDENT LEARNING PROFILE]\n${JSON.stringify(learningContext, null, 0)}`
        : '';

      const agentMessages = [
        {
          role: 'system',
          content: agent.systemPrompt + contextBlock +
            `\n\n[PLATFORM CONTEXT]\n- Course: ${courseId}\n- Current Time: ${new Date().toISOString()}\n- Platform: Samyak Guru (samyakcee.com)`,
        },
        ...conversationHistory.slice(-4),
        { role: 'user', content: message },
      ];

      try {
        const result = await callOpenAI(
          agentMessages,
          agent.model,
          agent.temperature,
          agent.maxTokens
        );
        totalTokens += result.tokens;

        return {
          agent: agent.id,
          agentName: agent.name,
          agentEmoji: agent.emoji,
          response: result.content,
          latencyMs: Date.now() - agentStart,
          model: agent.model,
        };
      } catch (err) {
        return {
          agent: agent.id,
          agentName: agent.name,
          agentEmoji: agent.emoji,
          response: `I apologize, but I encountered an issue processing your request. Please try again.`,
          latencyMs: Date.now() - agentStart,
          model: agent.model,
        };
      }
    });

    const agentResponses = await Promise.all(agentPromises);

    // 9. Merge responses if multi-agent
    let finalResponse: string;
    const isMultiAgent = agentResponses.length > 1;

    if (isMultiAgent) {
      const mergePrompt = `You are the SamyakGURU response synthesizer. Multiple specialist agents have answered a student's question. Merge their responses into a single coherent, well-structured answer.

DO NOT mention that multiple agents answered. Present it as one unified, expert response.
Preserve all mathematical notation ($...$, $$...$$) exactly as-is.
Preserve all formatting (headers, lists, bold, code blocks).
If agents covered different aspects, organize by topic with clear headings.
If agents agree, synthesize without repetition.
If agents disagree, present the most accurate/complete view.

Student's question: ${message}

Agent responses:
${agentResponses.map((r) => `--- ${r.agentEmoji} ${r.agentName} ---\n${r.response}`).join('\n\n')}

Provide the merged response:`;

      try {
        const mergeResult = await callOpenAI(
          [{ role: 'user', content: mergePrompt }],
          'gpt-4o',
          0.3,
          3000
        );
        finalResponse = mergeResult.content;
        totalTokens += mergeResult.tokens;
      } catch {
        // Fallback: concatenate with headers
        finalResponse = agentResponses
          .map((r) => `${r.agentEmoji} **${r.agentName}**\n\n${r.response}`)
          .join('\n\n---\n\n');
      }
    } else {
      finalResponse = agentResponses[0]?.response || 'I could not generate a response. Please try again.';
    }

    // 10. Save conversation to database
    const totalLatency = Date.now() - startTime;
    await admin.from('agent_conversations').insert({
      user_id: user.id,
      session_id: sessionId || undefined,
      course_id: courseId,
      user_message: message,
      intent_class: routing.intent,
      routed_agents: validAgents,
      routing_reasoning: routing.reasoning,
      agent_responses: agentResponses,
      final_response: finalResponse,
      total_latency_ms: totalLatency,
      total_tokens: totalTokens,
      model_used: isMultiAgent ? 'gpt-4o (multi)' : agentResponses[0]?.model || 'gpt-4o',
      is_multi_agent: isMultiAgent,
    });

    // 11. Extract learning signals asynchronously (fire-and-forget)
    extractLearningSignals(admin, user.id, courseId, message, finalResponse, routing.intent).catch(() => {});

    // 12. Return response
    if (stream) {
      return streamResponse(finalResponse, agentResponses, routing.intent);
    }

    return NextResponse.json({
      response: finalResponse,
      intent: routing.intent,
      agents: agentResponses.map((r) => ({
        id: r.agent,
        name: r.agentName,
        emoji: r.agentEmoji,
        latencyMs: r.latencyMs,
      })),
      isMultiAgent,
      sessionId,
      latencyMs: totalLatency,
      totalTokens,
    });
  } catch (error) {
    console.error('Neural chat error:', error);
    return NextResponse.json(
      {
        error: 'AI Neural Schema error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/** Stream the final response as SSE (matches the existing chat-completion SSE protocol) */
function streamResponse(
  text: string,
  agents: AgentResponse[],
  intent: string
): NextResponse {
  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      // Emit metadata event
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({
            type: 'start',
            meta: {
              intent,
              agents: agents.map((a) => ({
                id: a.agent,
                name: a.agentName,
                emoji: a.agentEmoji,
              })),
            },
          })}\n\n`
        )
      );

      // Stream the text in chunks for natural feel
      const CHUNK_SIZE = 20;
      for (let i = 0; i < text.length; i += CHUNK_SIZE) {
        const chunk = text.slice(i, i + CHUNK_SIZE);
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: 'chunk',
              chunk: {
                choices: [{ delta: { content: chunk } }],
              },
            })}\n\n`
          )
        );
        // Small delay for natural streaming feel
        await new Promise((r) => setTimeout(r, 15));
      }

      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`)
      );
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

/**
 * Extract learning signals from the conversation and update the student's
 * memory profile. Runs asynchronously (fire-and-forget).
 */
async function extractLearningSignals(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  courseId: string,
  userMessage: string,
  aiResponse: string,
  intent: string
): Promise<void> {
  if (!OPENAI_API_KEY) return;

  try {
    const extractionPrompt = `Analyze this student-AI interaction and extract learning signals.

Student's question: ${userMessage.slice(0, 500)}
AI response topic: ${intent}
Course: ${courseId}

Extract ONLY if clearly identifiable. Respond with valid JSON:
{
  "weakTopics": [{"topic": "string", "subject": "string", "confidence": 0.0-1.0}],
  "misconceptions": [{"concept": "string", "correction": "string"}],
  "strongTopics": []
}

If nothing is clearly identifiable, return empty arrays. Be conservative.`;

    const result = await callOpenAI(
      [{ role: 'user', content: extractionPrompt }],
      'gpt-4o-mini',
      0.2,
      500,
      true
    );

    let signals: { weakTopics?: Array<{ topic: string; subject: string; confidence: number }>; misconceptions?: Array<{ concept: string; correction: string }>; strongTopics?: Array<{ topic: string; subject: string }> };
    try {
      signals = JSON.parse(result.content);
    } catch {
      return;
    }

    // Upsert weak topics
    if (signals.weakTopics) {
      for (const wt of signals.weakTopics.slice(0, 3)) {
        const memoryKey = `${wt.subject || 'general'}.${wt.topic.toLowerCase().replace(/\s+/g, '_')}`;
        await admin.from('agent_memory').upsert(
          {
            user_id: userId,
            course_id: courseId,
            memory_type: 'weak_topic',
            memory_key: memoryKey,
            memory_value: { topic: wt.topic, subject: wt.subject, confidence: wt.confidence, lastTested: new Date().toISOString() },
            source_agent: 'orchestrator',
            confidence_score: wt.confidence,
            last_reinforced: new Date().toISOString(),
            is_active: true,
          },
          { onConflict: 'user_id,course_id,memory_type,memory_key' }
        );
      }
    }

    // Upsert misconceptions
    if (signals.misconceptions) {
      for (const mc of signals.misconceptions.slice(0, 2)) {
        const memoryKey = `misconception.${mc.concept.toLowerCase().replace(/\s+/g, '_').slice(0, 100)}`;
        await admin.from('agent_memory').upsert(
          {
            user_id: userId,
            course_id: courseId,
            memory_type: 'misconception',
            memory_key: memoryKey,
            memory_value: { concept: mc.concept, correction: mc.correction, occurrences: 1 },
            source_agent: 'orchestrator',
            confidence_score: 0.7,
            last_reinforced: new Date().toISOString(),
            is_active: true,
          },
          { onConflict: 'user_id,course_id,memory_type,memory_key' }
        );
      }
    }
  } catch (err) {
    console.warn('Learning signal extraction failed (non-critical):', err);
  }
}
