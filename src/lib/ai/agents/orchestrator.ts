import 'server-only';
import { getAgent, AgentId, getSpecializedAgents } from './agentRegistry';
import { sendAgentMessage, completeTask } from './neuralBus';
import { getStudentProfile, updateStudentMemory } from './studentProfile';
import { callChatCompletion, parseJsonResponse } from '@/lib/ai/completion';
import { createAdminClient } from '@/lib/supabase/admin';

export interface OrchestratorResult {
  sessionId: string;
  intent: string;
  routedAgents: AgentId[];
  agentResponses: Record<AgentId, string>;
  finalResponse: string;
  isMultiAgent: boolean;
  totalLatencyMs: number;
  totalTokens: number;
}

interface OrchestratorClassification {
  intent: string;
  agents: AgentId[];
  reasoning: string;
  isGeneral: boolean;
  directResponse: string | null;
}

export async function orchestrate(
  userId: string,
  courseId: string,
  userMessage: string,
  conversationHistory: { role: string, content: string }[] = []
): Promise<OrchestratorResult> {
  const startTime = Date.now();
  const sessionId = crypto.randomUUID();
  let totalTokens = 0;

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const orchestratorAgent = getAgent('orchestrator');

  // 1. Load student profile
  const profile = await getStudentProfile(userId);

  const contextStr = profile ? `
Student Context:
- Weak Topics: ${profile.weak_topics?.join(', ') || 'None'}
- Strong Topics: ${profile.strong_topics?.join(', ') || 'None'}
- Misconceptions: ${profile.misconceptions?.join(', ') || 'None'}
` : '';

  // 2. Call orchestrator
  const systemMessage = {
    role: 'system' as const,
    content: orchestratorAgent.systemPrompt + '\n' + contextStr
  };

  const history = conversationHistory.map(h => ({
    role: h.role as 'system' | 'user' | 'assistant',
    content: h.content
  }));

  const messages = [
    systemMessage,
    ...history,
    { role: 'user' as const, content: userMessage }
  ];

  let classification: OrchestratorClassification;
  try {
    const rawResponse = await callChatCompletion(baseUrl, '', messages);
    classification = parseJsonResponse<OrchestratorClassification>(rawResponse);
  } catch (error) {
    console.error('Orchestrator failed:', error);
    classification = {
      intent: 'general',
      agents: [],
      reasoning: 'Fallback',
      isGeneral: true,
      directResponse: "I'm having trouble thinking right now. Could you rephrase that?"
    };
  }

  // 3. Handle general query
  if (classification.isGeneral || classification.agents.length === 0) {
    const response = classification.directResponse || "How can I help you?";
    await saveConversation(userId, courseId, sessionId, userMessage, response, 'orchestrator');
    return {
      sessionId,
      intent: classification.intent,
      routedAgents: [],
      agentResponses: {} as Record<AgentId, string>,
      finalResponse: response,
      isMultiAgent: false,
      totalLatencyMs: Date.now() - startTime,
      totalTokens
    };
  }

  // 4. Call routed agents in parallel (Direct OpenAI call)
  const agentPromises = classification.agents.map(async (agentId) => {
    const agent = getAgent(agentId);
    if (!agent) return null;

    const agentSysMessage = {
      role: 'system' as const,
      content: agent.systemPrompt + '\n' + contextStr
    };

    const agentMessages = [
      agentSysMessage,
      ...history,
      { role: 'user' as const, content: userMessage }
    ];

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: agent.model || 'gpt-4o',
          messages: agentMessages,
          temperature: agent.temperature || 0.5,
          max_tokens: agent.maxTokens || 2000
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API returned ${response.status}`);
      }

      const data = await response.json();
      return {
        id: agentId,
        response: data.choices[0]?.message?.content || ''
      };
    } catch (err) {
      console.error(`Error calling agent ${agentId}:`, err);
      return { id: agentId, response: "I encountered an error while processing your request." };
    }
  });

  const results = (await Promise.all(agentPromises)).filter(Boolean) as { id: AgentId, response: string }[];
  const agentResponses: Record<AgentId, string> = {} as Record<AgentId, string>;
  results.forEach(r => agentResponses[r.id] = r.response);

  // 5. Merge responses if multiple agents
  let finalResponse = '';
  if (results.length > 1) {
    const mergeMessages = [
      { role: 'system' as const, content: 'You are an AI orchestrator. Combine the following agent responses into a single, cohesive, and natural response for the student. Do not contradict them.' },
      { role: 'user' as const, content: `User Question: ${userMessage}\n\nAgent Responses:\n${results.map(r => `${r.id}: ${r.response}`).join('\n\n')}` }
    ];
    try {
      finalResponse = await callChatCompletion(baseUrl, '', mergeMessages);
    } catch (err) {
      finalResponse = results.map(r => `**${r.id}**:\n${r.response}`).join('\n\n');
    }
  } else if (results.length === 1) {
    finalResponse = results[0].response;
  } else {
    finalResponse = "I'm sorry, none of my agents could process that.";
  }

  // 6. Save conversation
  await saveConversation(userId, courseId, sessionId, userMessage, finalResponse, classification.agents.join(','));

  // 7. Extract learning signals (simplified)
  // Example update: await updateStudentMemory(userId, { ... });

  return {
    sessionId,
    intent: classification.intent,
    routedAgents: classification.agents,
    agentResponses,
    finalResponse,
    isMultiAgent: results.length > 1,
    totalLatencyMs: Date.now() - startTime,
    totalTokens
  };
}

async function saveConversation(userId: string, courseId: string, sessionId: string, userMsg: string, aiMsg: string, agentsUsed: string) {
  const admin = createAdminClient();
  await admin.from('agent_conversations').insert({
    user_id: userId,
    course_id: courseId,
    session_id: sessionId,
    user_message: userMsg,
    ai_response: aiMsg,
    agents_used: agentsUsed,
    created_at: new Date().toISOString()
  });
}
