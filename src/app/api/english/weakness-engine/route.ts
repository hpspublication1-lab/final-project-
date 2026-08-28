import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { computeStudentDualProfile } from '@/lib/ai/agents/weaknessEngine';

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

    const result = await computeStudentDualProfile(user.id);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Weakness engine API error:', error);
    return NextResponse.json(
      { error: 'Failed to compute weakness engine profiles' },
      { status: 500 }
    );
  }
}
