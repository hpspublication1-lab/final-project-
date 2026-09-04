import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Query recent battle results or user profiles
    const { data: prof } = await supabaseAdmin
      .from('user_profiles')
      .select('bio_rating, chem_rating, phy_rating, ma_rating')
      .eq('id', userId)
      .maybeSingle();

    const ratings = [
      { subject: 'Biology', icon: '🧬', rating: prof?.bio_rating ?? 1000, accuracy: 82, targetTopic: 'Genetics & Cell Biology' },
      { subject: 'Chemistry', icon: '🧪', rating: prof?.chem_rating ?? 1000, accuracy: 71, targetTopic: 'Organic Reaction Mechanisms' },
      { subject: 'Physics', icon: '⚡', rating: prof?.phy_rating ?? 1000, accuracy: 58, targetTopic: 'Current Electricity & Magnetism' },
    ];

    // Sort to find lowest performing subject
    ratings.sort((a, b) => a.rating - b.rating);
    const weakest = ratings[0];

    return NextResponse.json({
      weakness: weakest,
      recommendation: {
        title: `Targeted ${weakest.subject} Practice`,
        topic: weakest.targetTopic,
        mcqCount: 20,
        estimatedTimeMin: 15,
        actionUrl: `/practice?subject=${weakest.subject.toLowerCase()}&topic=${encodeURIComponent(weakest.targetTopic)}`,
      },
      subjectBreakdown: ratings,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch weakness diagnostics' }, { status: 500 });
  }
}
