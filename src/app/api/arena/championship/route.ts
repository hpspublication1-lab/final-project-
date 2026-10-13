import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

// 15-second in-memory cache for daily championship & top-20 leaderboard
let cachedChampionshipBoard: {
  dateStr: string;
  championship: any;
  leaderboard: any[];
  ts: number;
} | null = null;
const CHAMPIONSHIP_CACHE_TTL_MS = 15_000;

/**
 * Helper to get current date string in Asia/Kathmandu (Nepal Time)
 * Format: YYYY-MM-DD
 */
function getNepalCurrentDate(): { dateStr: string; secondsRemainingToday: number } {
  const now = new Date();
  // Nepal is UTC + 5:45 (345 minutes)
  const nepalOffsetMs = (5 * 60 + 45) * 60 * 1000;
  const nepalNow = new Date(now.getTime() + nepalOffsetMs);

  const yyyy = nepalNow.getUTCFullYear();
  const mm = String(nepalNow.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(nepalNow.getUTCDate()).padStart(2, '0');
  const dateStr = `${yyyy}-${mm}-${dd}`;

  // End of Nepal day in UTC
  const endOfDayNepal = new Date(Date.UTC(yyyy, nepalNow.getUTCMonth(), nepalNow.getUTCDate(), 18, 15, 0)); // 23:59:59 NPT is 18:14:59 UTC
  const secondsRemainingToday = Math.max(0, Math.floor((endOfDayNepal.getTime() - now.getTime()) / 1000));

  return { dateStr, secondsRemainingToday };
}

/**
 * GET /api/arena/championship
 * Fetch active daily championship, live leaderboard, and student's daily standing.
 */
export async function GET(request: NextRequest) {
  try {
    const admin = createAdminClient();
    const { dateStr, secondsRemainingToday } = getNepalCurrentDate();

    // Authenticated user (only call getUser if auth cookie exists)
    let currentUserId: string | null = null;
    try {
      const cookieStore = await cookies();
      const hasAuthCookie = cookieStore.getAll().some((c) => c.name.startsWith('sb-') || c.name.includes('auth-token'));
      if (hasAuthCookie) {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        currentUserId = user?.id ?? null;
      }
    } catch {}

    if (!admin) {
      return NextResponse.json({
        championship: {
          competition_date: dateStr,
          status: 'active',
          prize_amount_npr: 1000,
          seconds_remaining: secondsRemainingToday,
        },
        leaderboard: [],
        myEntry: null,
      });
    }

    let championship: any = null;
    let leaderboard: any[] = [];

    if (
      cachedChampionshipBoard &&
      cachedChampionshipBoard.dateStr === dateStr &&
      Date.now() - cachedChampionshipBoard.ts < CHAMPIONSHIP_CACHE_TTL_MS
    ) {
      championship = cachedChampionshipBoard.championship;
      leaderboard = cachedChampionshipBoard.leaderboard;
    } else {
      // 1. Ensure today's championship row exists
      const { data: existingChamp } = await admin
        .from('daily_championships')
        .select('*')
        .eq('competition_date', dateStr)
        .maybeSingle();

      championship = existingChamp;
      if (!championship) {
        const { data: created } = await admin
          .from('daily_championships')
          .insert({
            competition_date: dateStr,
            status: 'active',
            prize_amount_npr: 1000,
          })
          .select('*')
          .single();
        championship = created;
      }

      // 2. Fetch top 20 daily leaderboard entries
      if (championship?.id) {
        const { data: entries } = await admin
          .from('championship_entries')
          .select(`
            id,
            user_id,
            match_count,
            total_score,
            accuracy_percentage,
            total_time_seconds,
            correct_count,
            incorrect_count,
            disqualified,
            user_profiles:user_id (
              full_name,
              username,
              battle_rating,
              school_or_college
            )
          `)
          .eq('championship_id', championship.id)
          .eq('disqualified', false)
          .order('total_score', { ascending: false })
          .order('accuracy_percentage', { ascending: false })
          .order('total_time_seconds', { ascending: true })
          .limit(20);

        leaderboard = (entries || []).map((e: any, index: number) => ({
          rank: index + 1,
          userId: e.user_id,
          name: e.user_profiles?.full_name || e.user_profiles?.username || 'Championship Aspirant',
          college: e.user_profiles?.school_or_college || 'CEE Ranker',
          eloRating: e.user_profiles?.battle_rating || 1200,
          matchesPlayed: e.match_count,
          totalScore: Number(e.total_score),
          accuracy: Number(e.accuracy_percentage),
          totalTimeSeconds: e.total_time_seconds,
        }));
      }

      cachedChampionshipBoard = {
        dateStr,
        championship,
        leaderboard,
        ts: Date.now(),
      };
    }

    // 3. Fetch student's own entry if logged in
    let myEntry = null;
    if (currentUserId && championship?.id) {
      const { data: entry } = await admin
        .from('championship_entries')
        .select('*')
        .eq('championship_id', championship.id)
        .eq('user_id', currentUserId)
        .maybeSingle();

      if (entry) {
        // Compute user's rank
        const { count: higherCount } = await admin
          .from('championship_entries')
          .select('*', { count: 'exact', head: true })
          .eq('championship_id', championship.id)
          .eq('disqualified', false)
          .gt('total_score', entry.total_score);

        myEntry = {
          rank: (higherCount ?? 0) + 1,
          matchesPlayed: entry.match_count,
          totalScore: Number(entry.total_score),
          accuracy: Number(entry.accuracy_percentage),
          totalTimeSeconds: entry.total_time_seconds,
          correctCount: entry.correct_count,
          incorrectCount: entry.incorrect_count,
          disqualified: entry.disqualified,
          disqualificationReason: entry.disqualification_reason,
          maxMatches: 10,
        };
      }
    }

    return NextResponse.json({
      championship: {
        id: championship?.id,
        competition_date: dateStr,
        status: championship?.status || 'active',
        prize_amount_npr: championship?.prize_amount_npr || 1000,
        total_participants: championship?.total_participants || 0,
        seconds_remaining: secondsRemainingToday,
      },
      leaderboard,
      myEntry,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Championship error' }, { status: 500 });
  }
}

/**
 * POST /api/arena/championship
 * Submit a verified Championship match result.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required to enter championship' }, { status: 401 });
    }

    const admin = createAdminClient();
    if (!admin) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const body = await request.json();
    const {
      roomId,
      correctCount: rawCorrect = 0,
      incorrectCount: rawIncorrect = 0,
      timeTakenSeconds: rawTime = 0,
      tabSwitchCount = 0,
      fastResponseCount = 0,
    } = body;

    let correctCount = Math.min(10, Math.max(0, Number(rawCorrect) || 0));
    let incorrectCount = Math.min(10, Math.max(0, Number(rawIncorrect) || 0));
    let timeTakenSeconds = Math.min(600, Math.max(0, Number(rawTime) || 0));

    if (correctCount + incorrectCount > 10) {
      incorrectCount = Math.max(0, 10 - correctCount);
    }

    // Authoritative room verification if roomId is provided
    if (roomId) {
      const { data: room } = await admin
        .from('battle_rooms')
        .select('id, creator_id, opponent_id, status')
        .eq('id', roomId)
        .maybeSingle();

      if (room) {
        if (room.creator_id !== user.id && room.opponent_id !== user.id) {
          return NextResponse.json({ error: 'Unauthorized: User was not a participant in this room' }, { status: 403 });
        }

        const { data: result } = await admin
          .from('battle_results')
          .select('correct_answers, incorrect_answers, time_taken_seconds')
          .eq('room_id', roomId)
          .eq('player_id', user.id)
          .maybeSingle();

        if (result) {
          correctCount = Math.min(10, Math.max(0, result.correct_answers ?? correctCount));
          incorrectCount = Math.min(10, Math.max(0, result.incorrect_answers ?? incorrectCount));
          timeTakenSeconds = Math.min(600, Math.max(0, result.time_taken_seconds ?? timeTakenSeconds));
        }
      }
    }

    const { dateStr } = getNepalCurrentDate();

    // 1. Get today's championship
    let { data: championship } = await admin
      .from('daily_championships')
      .select('*')
      .eq('competition_date', dateStr)
      .maybeSingle();

    if (!championship) {
      const { data: created } = await admin
        .from('daily_championships')
        .insert({ competition_date: dateStr, prize_amount_npr: 1000, status: 'active' })
        .select('*')
        .single();
      championship = created;
    }

    if (championship.status !== 'active') {
      return NextResponse.json({ error: 'Today\'s championship is currently closed for evaluation' }, { status: 400 });
    }

    // 2. Attempt atomic PostgreSQL RPC (with row-level lock & transaction)
    const accuracyValue = (correctCount + incorrectCount) > 0
      ? (correctCount / (correctCount + incorrectCount)) * 100
      : 0;

    try {
      const { data: rpcRows, error: rpcErr } = await admin.rpc('record_championship_match', {
        p_championship_id: championship.id,
        p_participant_id: user.id,
        p_room_id: roomId || null,
        p_correct_count: correctCount,
        p_incorrect_count: incorrectCount,
        p_time_taken_seconds: timeTakenSeconds,
        p_accuracy: Math.round(accuracyValue * 10) / 10,
        p_anti_cheat_flags: tabSwitchCount + fastResponseCount,
      });

      if (!rpcErr && rpcRows && rpcRows.length > 0) {
        const row = rpcRows[0];
        if (row.capped) {
          return NextResponse.json({
            warning: 'Daily match cap reached',
            details: 'Only your first 10 championship matches count toward the daily cash prize leaderboard.',
            capped: true,
          });
        }

        return NextResponse.json({
          success: row.success,
          idempotent: row.idempotent,
          matchPoints: Number(row.match_points),
          newTotalScore: Number(row.new_total_score),
          cumulativeAccuracy: Number(row.new_accuracy),
          matchesPlayedToday: row.matches_played,
          remainingMatchesToday: row.remaining_matches,
          disqualified: row.disqualified,
          flaggedForReview: row.flagged_for_review,
        });
      }
    } catch {}

    // Fallback: Two-phase application logic if RPC has not been applied yet
    // 3. Fetch existing entry
    const { data: existing } = await admin
      .from('championship_entries')
      .select('*')
      .eq('championship_id', championship.id)
      .eq('user_id', user.id)
      .maybeSingle();

    // Strict Concurrency & Idempotency:
    // Check if match was already recorded in dedicated championship_matches ledger or in processed_room_ids
    let matchAlreadyRecorded = false;
    if (roomId) {
      try {
        const { data: existingMatch } = await admin
          .from('championship_matches')
          .select('id')
          .eq('championship_id', championship.id)
          .eq('participant_id', user.id)
          .eq('room_id', roomId)
          .maybeSingle();

        if (existingMatch) {
          matchAlreadyRecorded = true;
        }
      } catch {}
    }

    if (!matchAlreadyRecorded && roomId && existing?.processed_room_ids && Array.isArray(existing.processed_room_ids)) {
      if (existing.processed_room_ids.includes(roomId)) {
        matchAlreadyRecorded = true;
      }
    }

    if (matchAlreadyRecorded) {
      return NextResponse.json({
        success: true,
        message: 'Match result already recorded for today\'s championship',
        idempotent: true,
        matchPoints: 0,
        newTotalScore: Number(existing?.total_score || 0),
        cumulativeAccuracy: Number(existing?.accuracy_percentage || 0),
        matchesPlayedToday: existing?.match_count || 0,
        remainingMatchesToday: Math.max(0, 10 - (existing?.match_count || 0)),
        disqualified: existing?.disqualified || false,
        flaggedForReview: existing?.flagged_for_review || false,
      });
    }

    const currentMatches = existing?.match_count || 0;
    if (currentMatches >= 10) {
      return NextResponse.json({
        warning: 'Daily match cap reached',
        details: 'Only your first 10 championship matches count toward the daily cash prize leaderboard.',
        capped: true,
      });
    }

    // 3. Anti-cheat check: Behavioral anomalies (tab switches / fast responses)
    // In accordance with production anti-cheat requirements, we avoid unilaterally
    // and permanently disqualifying students on mobile/trackpad blur events.
    // Instead, entries with >= 4 flags are marked flagged_for_review: true for administrative audit
    // prior to cash prize disbursement.
    const isAlreadyDisqualified = existing?.disqualified || false;
    const totalFlags = (existing?.anti_cheat_flags_count || 0) + tabSwitchCount + fastResponseCount;
    const isFlaggedForReview = existing?.flagged_for_review || totalFlags >= 4;
    let reviewReason = existing?.disqualification_reason || null;

    if (!reviewReason && isFlaggedForReview) {
      reviewReason = `Flagged for administrative review: ${totalFlags} security events recorded (window blur / timing anomaly).`;
    }

    // 4. Calculate Server-Authoritative Score for this match
    // CEE formula: +10 pts per correct, -2.5 pts per incorrect
    // Speed bonus up to +5 pts if accuracy >= 80%
    const totalQ = correctCount + incorrectCount;
    const accuracy = totalQ > 0 ? (correctCount / totalQ) * 100 : 0;
    let speedBonus = 0;
    if (accuracy >= 80 && timeTakenSeconds > 0 && timeTakenSeconds < 300) {
      speedBonus = Math.min(5, Math.round((300 - timeTakenSeconds) / 20));
    }
    const matchPoints = Math.max(0, (correctCount * 10) - (incorrectCount * 2.5) + speedBonus);

    // Cumulative stats
    const newMatches = currentMatches + 1;
    const newTotalScore = (Number(existing?.total_score) || 0) + matchPoints;
    const newCorrect = (existing?.correct_count || 0) + correctCount;
    const newIncorrect = (existing?.incorrect_count || 0) + incorrectCount;
    const newTime = (existing?.total_time_seconds || 0) + timeTakenSeconds;
    const totalAnswered = newCorrect + newIncorrect;
    const cumulativeAccuracy = totalAnswered > 0 ? Math.round((newCorrect / totalAnswered) * 1000) / 10 : 0;

    const updatedProcessedRooms = roomId
      ? Array.from(new Set([...(existing?.processed_room_ids || []), roomId]))
      : (existing?.processed_room_ids || []);

    // 5. Atomic ledger insert into championship_matches (if table exists)
    if (roomId) {
      try {
        const { error: matchInsertErr } = await admin
          .from('championship_matches')
          .insert({
            championship_id: championship.id,
            participant_id: user.id,
            room_id: roomId,
            match_points: matchPoints,
            correct_count: correctCount,
            incorrect_count: incorrectCount,
            time_taken_seconds: timeTakenSeconds,
            accuracy: Math.round(accuracy * 10) / 10,
          });

        // If duplicate conflict on (championship_id, participant_id, room_id) - Postgres 23505
        if (matchInsertErr && (matchInsertErr.code === '23505' || matchInsertErr.message?.includes('duplicate'))) {
          return NextResponse.json({
            success: true,
            message: 'Match result already recorded for today\'s championship (concurrent insert handled)',
            idempotent: true,
            matchPoints: 0,
            newTotalScore: Number(existing?.total_score || 0),
            cumulativeAccuracy: Number(existing?.accuracy_percentage || 0),
            matchesPlayedToday: existing?.match_count || 0,
            remainingMatchesToday: Math.max(0, 10 - (existing?.match_count || 0)),
            disqualified: existing?.disqualified || false,
            flaggedForReview: existing?.flagged_for_review || false,
          });
        }
      } catch {}
    }

    // 6. Upsert championship_entries with defensive column fallback
    const updatePayload: Record<string, any> = {
      championship_id: championship.id,
      user_id: user.id,
      match_count: newMatches,
      total_score: newTotalScore,
      accuracy_percentage: cumulativeAccuracy,
      total_time_seconds: newTime,
      correct_count: newCorrect,
      incorrect_count: newIncorrect,
      anti_cheat_flags_count: totalFlags,
      disqualified: isAlreadyDisqualified,
      disqualification_reason: reviewReason,
      updated_at: new Date().toISOString(),
    };

    if (updatedProcessedRooms.length > 0) {
      updatePayload.processed_room_ids = updatedProcessedRooms;
    }
    if (isFlaggedForReview) {
      updatePayload.flagged_for_review = isFlaggedForReview;
    }

    let { data: updatedEntry, error: entryErr } = await admin
      .from('championship_entries')
      .upsert(updatePayload, { onConflict: 'championship_id,user_id' })
      .select('*')
      .single();

    // Defensive fallback if DB schema hasn't run the latest migration columns yet
    if (entryErr && (entryErr.message?.includes('processed_room_ids') || entryErr.message?.includes('flagged_for_review'))) {
      delete updatePayload.processed_room_ids;
      delete updatePayload.flagged_for_review;
      const fallbackResult = await admin
        .from('championship_entries')
        .upsert(updatePayload, { onConflict: 'championship_id,user_id' })
        .select('*')
        .single();
      updatedEntry = fallbackResult.data;
      entryErr = fallbackResult.error;
    }

    if (entryErr) {
      return NextResponse.json({ error: entryErr.message }, { status: 500 });
    }

    // 6. Update master participants count
    if (!existing) {
      await admin
        .from('daily_championships')
        .update({
          total_participants: (championship.total_participants || 0) + 1,
          total_matches: (championship.total_matches || 0) + 1,
        })
        .eq('id', championship.id);
    } else {
      await admin
        .from('daily_championships')
        .update({ total_matches: (championship.total_matches || 0) + 1 })
        .eq('id', championship.id);
    }

    return NextResponse.json({
      success: true,
      matchPoints,
      newTotalScore,
      cumulativeAccuracy,
      matchesPlayedToday: newMatches,
      remainingMatchesToday: Math.max(0, 10 - newMatches),
      disqualified: isAlreadyDisqualified,
      flaggedForReview: isFlaggedForReview,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Submission error' }, { status: 500 });
  }
}
