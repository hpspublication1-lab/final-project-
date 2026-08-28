-- ============================================================
-- Migration: 20260824_ai_neural_schema.sql
-- AI Neural Schema: Multi-Agent Coordination System
-- Tables: agent_conversations, agent_memory, agent_tasks
-- ============================================================

-- 1. agent_conversations — Tracks every multi-turn agent interaction
CREATE TABLE IF NOT EXISTS public.agent_conversations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  session_id        UUID NOT NULL DEFAULT gen_random_uuid(),
  course_id         VARCHAR(50) NOT NULL DEFAULT 'cee_medical',

  -- The student's original message
  user_message      TEXT NOT NULL,

  -- Orchestrator routing decision
  intent_class      VARCHAR(100),  -- e.g. 'math_problem', 'science_concept', 'essay_evaluation'
  routed_agents     TEXT[] NOT NULL DEFAULT '{}', -- e.g. {'science_tutor', 'math_solver'}
  routing_reasoning TEXT, -- why the orchestrator chose these agents

  -- Individual agent responses (JSONB array)
  agent_responses   JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Example: [{"agent":"science_tutor","response":"...","latency_ms":1200,"model":"gpt-4o"}]

  -- Final merged response sent to student
  final_response    TEXT NOT NULL,
  response_quality  SMALLINT, -- 1-5 rating if student provides feedback

  -- Metadata
  total_latency_ms  INTEGER DEFAULT 0,
  total_tokens      INTEGER DEFAULT 0,
  model_used        VARCHAR(50) DEFAULT 'gpt-4o',
  is_multi_agent    BOOLEAN NOT NULL DEFAULT false,

  created_at        TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_agent_conv_user ON public.agent_conversations(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_conv_session ON public.agent_conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_agent_conv_course ON public.agent_conversations(course_id);
CREATE INDEX IF NOT EXISTS idx_agent_conv_intent ON public.agent_conversations(intent_class);

-- 2. agent_memory — Long-term student learning profile built by agents
CREATE TABLE IF NOT EXISTS public.agent_memory (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  course_id         VARCHAR(50) NOT NULL DEFAULT 'cee_medical',
  memory_type       VARCHAR(50) NOT NULL, -- 'weak_topic', 'strong_topic', 'misconception', 'preference', 'performance'

  -- Memory content (flexible JSONB)
  memory_key        VARCHAR(200) NOT NULL, -- e.g. 'physics.force_and_gravity', 'explanation_style'
  memory_value      JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Examples:
  --   weak_topic: {"topic":"Pressure","subject":"physics","confidence":0.3,"lastTested":"2026-08-24","occurrences":5}
  --   misconception: {"concept":"Mass equals weight","correction":"Mass is scalar, weight is force","occurrences":3}
  --   preference: {"style":"step-by-step","vocabularyLevel":"intermediate"}
  --   performance: {"accuracyPhysics":0.72,"accuracyChemistry":0.85}

  -- Source agent that created/updated this memory
  source_agent      VARCHAR(50) NOT NULL DEFAULT 'orchestrator',
  confidence_score  NUMERIC(3,2) DEFAULT 0.50, -- 0.00 to 1.00

  -- Lifecycle
  last_reinforced   TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  reinforcement_count INTEGER NOT NULL DEFAULT 1,
  expires_at        TIMESTAMPTZ, -- NULL = never expires
  is_active         BOOLEAN NOT NULL DEFAULT true,

  created_at        TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(user_id, course_id, memory_type, memory_key)
);

CREATE INDEX IF NOT EXISTS idx_agent_memory_user ON public.agent_memory(user_id, course_id, is_active);
CREATE INDEX IF NOT EXISTS idx_agent_memory_type ON public.agent_memory(memory_type, memory_key);
CREATE INDEX IF NOT EXISTS idx_agent_memory_source ON public.agent_memory(source_agent);

-- 3. agent_tasks — Inter-agent task delegation queue
CREATE TABLE IF NOT EXISTS public.agent_tasks (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id   UUID REFERENCES public.agent_conversations(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,

  -- Task routing
  from_agent        VARCHAR(50) NOT NULL, -- requesting agent
  to_agent          VARCHAR(50) NOT NULL, -- target agent
  task_type         VARCHAR(50) NOT NULL DEFAULT 'consultation', -- 'consultation', 'delegation', 'context_share', 'memory_update'

  -- Task payload
  task_input        JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- e.g. {"query":"Explain the physics behind hydraulic pressure","context":{"chapter":"Pressure","subject":"physics"}}

  task_output       JSONB, -- The responding agent's result
  -- e.g. {"response":"Hydraulic pressure works by Pascal's Law...","confidence":0.95}

  -- Status
  status            VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed', 'cancelled'
  priority          VARCHAR(10) NOT NULL DEFAULT 'normal', -- 'low', 'normal', 'high', 'critical'

  -- Timing
  started_at        TIMESTAMPTZ,
  completed_at      TIMESTAMPTZ,
  timeout_at        TIMESTAMPTZ DEFAULT (CURRENT_TIMESTAMP + INTERVAL '30 seconds'),

  created_at        TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_agent_tasks_conv ON public.agent_tasks(conversation_id);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_to ON public.agent_tasks(to_agent, status);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_user ON public.agent_tasks(user_id);

-- ============================================================
-- 4. Row Level Security
-- ============================================================

ALTER TABLE public.agent_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_tasks ENABLE ROW LEVEL SECURITY;

-- Conversations: students can read their own
DROP POLICY IF EXISTS "Students view own conversations" ON public.agent_conversations;
CREATE POLICY "Students view own conversations"
ON public.agent_conversations FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Memory: students can read their own learning profile
DROP POLICY IF EXISTS "Students view own memory" ON public.agent_memory;
CREATE POLICY "Students view own memory"
ON public.agent_memory FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Tasks: students can read tasks from their conversations
DROP POLICY IF EXISTS "Students view own tasks" ON public.agent_tasks;
CREATE POLICY "Students view own tasks"
ON public.agent_tasks FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- ============================================================
-- 5. Helper function: Get student learning context for agents
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_student_learning_context(
  p_user_id UUID,
  p_course_id VARCHAR(50) DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'weakTopics', COALESCE((
      SELECT jsonb_agg(memory_value ORDER BY confidence_score ASC)
      FROM public.agent_memory
      WHERE user_id = p_user_id
        AND memory_type = 'weak_topic'
        AND is_active = true
        AND (p_course_id IS NULL OR course_id = p_course_id)
      LIMIT 10
    ), '[]'::jsonb),
    'strongTopics', COALESCE((
      SELECT jsonb_agg(memory_value ORDER BY confidence_score DESC)
      FROM public.agent_memory
      WHERE user_id = p_user_id
        AND memory_type = 'strong_topic'
        AND is_active = true
        AND (p_course_id IS NULL OR course_id = p_course_id)
      LIMIT 10
    ), '[]'::jsonb),
    'misconceptions', COALESCE((
      SELECT jsonb_agg(memory_value ORDER BY (memory_value->>'occurrences')::int DESC)
      FROM public.agent_memory
      WHERE user_id = p_user_id
        AND memory_type = 'misconception'
        AND is_active = true
        AND (p_course_id IS NULL OR course_id = p_course_id)
      LIMIT 5
    ), '[]'::jsonb),
    'preferences', COALESCE((
      SELECT jsonb_object_agg(memory_key, memory_value)
      FROM public.agent_memory
      WHERE user_id = p_user_id
        AND memory_type = 'preference'
        AND is_active = true
    ), '{}'::jsonb),
    'recentInteractions', (
      SELECT COUNT(*)
      FROM public.agent_conversations
      WHERE user_id = p_user_id
        AND created_at > CURRENT_TIMESTAMP - INTERVAL '7 days'
    ),
    'totalInteractions', (
      SELECT COUNT(*)
      FROM public.agent_conversations
      WHERE user_id = p_user_id
    )
  ) INTO result;

  RETURN result;
END;
$$;
