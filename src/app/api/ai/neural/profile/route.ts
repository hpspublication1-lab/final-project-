import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * GET /api/ai/neural/profile
 *
 * Returns the authenticated student's AI-built learning profile:
 * weak topics, strong topics, misconceptions, preferences, and interaction stats.
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
    const courseId = searchParams.get('courseId') || undefined;

    const admin = createAdminClient();

    // Call the RPC to get the student's learning context
    const { data: profile, error } = await admin.rpc('get_student_learning_context', {
      p_user_id: user.id,
      p_course_id: courseId || null,
    });

    if (error) {
      console.warn('Failed to fetch learning context:', error.message);
      // Return empty profile rather than error
      return NextResponse.json({
        profile: {
          weakTopics: [],
          strongTopics: [],
          misconceptions: [],
          preferences: {},
          recentInteractions: 0,
          totalInteractions: 0,
        },
      });
    }

    // Get recent conversation history summary
    const { data: recentConversations } = await admin
      .from('agent_conversations')
      .select('intent_class, routed_agents, response_quality, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    // Get interaction breakdown by agent
    const { data: agentStats } = await admin
      .from('agent_conversations')
      .select('routed_agents')
      .eq('user_id', user.id);

    const agentUsage: Record<string, number> = {};
    if (agentStats) {
      for (const conv of agentStats) {
        const agents = conv.routed_agents as string[];
        if (agents) {
          for (const agent of agents) {
            agentUsage[agent] = (agentUsage[agent] || 0) + 1;
          }
        }
      }
    }

    return NextResponse.json({
      profile: profile || {
        weakTopics: [],
        strongTopics: [],
        misconceptions: [],
        preferences: {},
        recentInteractions: 0,
        totalInteractions: 0,
      },
      recentConversations: recentConversations || [],
      agentUsage,
    });
  } catch (error) {
    console.error('Neural profile API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch learning profile' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ai/neural/profile
 *
 * Allows manual profile updates (e.g., student setting preferences).
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { courseId = 'cee_medical', preferences } = body;

    if (!preferences || typeof preferences !== 'object') {
      return NextResponse.json(
        { error: 'Missing preferences object' },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Upsert each preference
    for (const [key, value] of Object.entries(preferences)) {
      await admin
        .from('agent_memory')
        .upsert(
          {
            user_id: user.id,
            course_id: courseId,
            memory_type: 'preference',
            memory_key: key,
            memory_value: typeof value === 'object' ? value : { value },
            source_agent: 'user',
            confidence_score: 1.0,
            last_reinforced: new Date().toISOString(),
            is_active: true,
          },
          { onConflict: 'user_id,course_id,memory_type,memory_key' }
        );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Neural profile update error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
