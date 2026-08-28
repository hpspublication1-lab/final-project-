import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSpecializedAgents, getAgentsForCourse } from '@/lib/ai/agents/agentRegistry';

/**
 * GET /api/ai/neural/agents
 *
 * Returns the list of available AI agents and their capabilities.
 * Used by the frontend to display agent information in the UI.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');

    const agents = courseId
      ? getAgentsForCourse(courseId)
      : getSpecializedAgents();

    const agentList = agents.map((agent) => ({
      id: agent.id,
      name: agent.name,
      emoji: agent.emoji,
      description: agent.description,
      capabilities: agent.capabilities,
      courseAffinity: agent.courseAffinity,
      priority: agent.priority,
    }));

    return NextResponse.json({
      agents: agentList,
      total: agentList.length,
    });
  } catch (error) {
    console.error('Neural agents API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agents' },
      { status: 500 }
    );
  }
}
