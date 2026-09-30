import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Representation of a Championship Entry from the database
 */
export interface ChampionshipEntryRow {
  id: string;
  championship_id: string;
  user_id: string;
  match_count: number;
  total_score: number | string;
  accuracy_percentage: number | string;
  total_time_seconds: number;
  correct_count?: number;
  incorrect_count?: number;
  anti_cheat_flags_count?: number;
  flagged_for_review?: boolean;
  disqualified?: boolean;
  disqualification_reason?: string | null;
  updated_at?: string;
  user_profiles?: {
    full_name?: string | null;
    username?: string | null;
    school_or_college?: string | null;
    battle_rating?: number | null;
  } | null;
}

export interface EvaluatedRank {
  rank: number;
  userId: string;
  name: string;
  college: string;
  eloRating: number;
  matchCount: number;
  totalScore: number;
  accuracy: number;
  totalTimeSeconds: number;
  antiCheatFlags: number;
  flaggedForReview: boolean;
  disqualified: boolean;
}

export interface ChampionshipEvaluationResult {
  totalParticipants: number;
  qualifiedParticipants: number;
  disqualifiedCount: number;
  rankedLeaderboard: EvaluatedRank[];
  provisionalWinner: EvaluatedRank | null;
  winnerFlaggedForReview: boolean;
  auditNotes: string;
}

/**
 * Calculate Nepal Time (Asia/Kathmandu: UTC+5:45) dates.
 * Returns ISO strings formatted as YYYY-MM-DD.
 */
export function getChampionshipDates(referenceDate?: Date): {
  todayStr: string;
  yesterdayStr: string;
  secondsRemainingToday: number;
} {
  const now = referenceDate || new Date();
  const nepalOffsetMs = (5 * 60 + 45) * 60 * 1000;
  const nepalNow = new Date(now.getTime() + nepalOffsetMs);

  const yyyy = nepalNow.getUTCFullYear();
  const mm = String(nepalNow.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(nepalNow.getUTCDate()).padStart(2, '0');
  const todayStr = `${yyyy}-${mm}-${dd}`;

  // Yesterday in Nepal Time
  const yesterdayNepal = new Date(nepalNow.getTime() - 24 * 60 * 60 * 1000);
  const yYyyy = yesterdayNepal.getUTCFullYear();
  const yMm = String(yesterdayNepal.getUTCMonth() + 1).padStart(2, '0');
  const yDd = String(yesterdayNepal.getUTCDate()).padStart(2, '0');
  const yesterdayStr = `${yYyyy}-${yMm}-${yDd}`;

  // End of today in UTC: 23:59:59 NPT is 18:14:59.999 UTC
  const endOfDayNepal = new Date(Date.UTC(yyyy, nepalNow.getUTCMonth(), nepalNow.getUTCDate(), 18, 14, 59, 999));
  const secondsRemainingToday = Math.max(0, Math.floor((endOfDayNepal.getTime() - now.getTime()) / 1000));

  return { todayStr, yesterdayStr, secondsRemainingToday };
}

/**
 * Pure, deterministic evaluation of championship entries.
 * Applies multi-tier tie-breaking:
 *   1. total_score DESC
 *   2. accuracy_percentage DESC
 *   3. total_time_seconds ASC (faster total completion time wins)
 *   4. updated_at ASC (earlier completion timestamp wins)
 *   5. id ASC (deterministic fallback)
 */
export function evaluateChampionship(entries: ChampionshipEntryRow[]): ChampionshipEvaluationResult {
  const totalParticipants = entries.length;
  let disqualifiedCount = 0;

  // 1. Filter out disqualified candidates
  const eligible = entries.filter((e) => {
    if (e.disqualified) {
      disqualifiedCount++;
      return false;
    }
    return true;
  });

  // 2. Deterministic sort
  eligible.sort((a, b) => {
    const scoreA = Number(a.total_score) || 0;
    const scoreB = Number(b.total_score) || 0;
    if (scoreB !== scoreA) return scoreB - scoreA;

    const accA = Number(a.accuracy_percentage) || 0;
    const accB = Number(b.accuracy_percentage) || 0;
    if (accB !== accA) return accB - accA;

    const timeA = a.total_time_seconds || 0;
    const timeB = b.total_time_seconds || 0;
    if (timeA !== timeB) return timeA - timeB;

    const updatedA = a.updated_at ? new Date(a.updated_at).getTime() : 0;
    const updatedB = b.updated_at ? new Date(b.updated_at).getTime() : 0;
    if (updatedA !== updatedB) return updatedA - updatedB;

    return String(a.id || '').localeCompare(String(b.id || ''));
  });

  // 3. Build ranked leaderboard
  const rankedLeaderboard: EvaluatedRank[] = eligible.map((e, idx) => {
    const antiCheatFlags = e.anti_cheat_flags_count || 0;
    const flaggedForReview = Boolean(e.flagged_for_review) || antiCheatFlags >= 4;

    return {
      rank: idx + 1,
      userId: e.user_id,
      name: e.user_profiles?.full_name || e.user_profiles?.username || 'Championship Aspirant',
      college: e.user_profiles?.school_or_college || 'CEE Ranker',
      eloRating: e.user_profiles?.battle_rating || 1200,
      matchCount: e.match_count || 0,
      totalScore: Number(e.total_score) || 0,
      accuracy: Number(e.accuracy_percentage) || 0,
      totalTimeSeconds: e.total_time_seconds || 0,
      antiCheatFlags,
      flaggedForReview,
      disqualified: false,
    };
  });

  const provisionalWinner = rankedLeaderboard[0] || null;
  const winnerFlaggedForReview = provisionalWinner ? provisionalWinner.flaggedForReview : false;

  // 4. Build audit trail note
  let auditNotes = '';
  if (provisionalWinner) {
    auditNotes = `Finalized Winner: ${provisionalWinner.name} (User: ${provisionalWinner.userId}) with Score: ${provisionalWinner.totalScore} pts, Accuracy: ${provisionalWinner.accuracy}%, Total Time: ${provisionalWinner.totalTimeSeconds}s across ${provisionalWinner.matchCount} matches.`;
    if (winnerFlaggedForReview) {
      auditNotes += ` [CAUTION: Entry flagged with ${provisionalWinner.antiCheatFlags} anti-cheat flags. Manual verification required before disbursement.]`;
    } else {
      auditNotes += ` [Anti-cheat verification passed: ${provisionalWinner.antiCheatFlags} flags recorded.]`;
    }
  } else {
    auditNotes = 'Championship finalized with zero eligible participants. No winner awarded.';
  }

  return {
    totalParticipants,
    qualifiedParticipants: eligible.length,
    disqualifiedCount,
    rankedLeaderboard,
    provisionalWinner,
    winnerFlaggedForReview,
    auditNotes,
  };
}

/**
 * Orchestrates full daily championship finalization against the Supabase database.
 * Completely idempotent: running repeatedly on the same date will not duplicate
 * payouts or corrupt championship state.
 */
export async function finalizeDailyChampionship(
  admin: SupabaseClient,
  targetDateStr?: string
): Promise<{
  success: boolean;
  alreadyFinalized?: boolean;
  dateStr: string;
  championshipId?: string;
  winnerUserId?: string | null;
  payoutId?: string | null;
  evaluation?: ChampionshipEvaluationResult;
  message: string;
}> {
  const { yesterdayStr, todayStr } = getChampionshipDates();
  const dateStr = targetDateStr || yesterdayStr;

  // 1. Fetch the targeted championship record
  const { data: championship, error: champErr } = await admin
    .from('daily_championships')
    .select('*')
    .eq('competition_date', dateStr)
    .maybeSingle();

  if (champErr) {
    throw new Error(`Database error fetching championship for ${dateStr}: ${champErr.message}`);
  }

  if (!championship) {
    return {
      success: false,
      dateStr,
      message: `No championship record exists for date ${dateStr}.`,
    };
  }

  // 2. Check idempotency: If already finalized, exit early safely
  if (championship.status === 'finalized') {
    // Check if payout record exists
    const { data: existingPayout } = await admin
      .from('championship_payouts')
      .select('id')
      .eq('championship_id', championship.id)
      .maybeSingle();

    return {
      success: true,
      alreadyFinalized: true,
      dateStr,
      championshipId: championship.id,
      winnerUserId: championship.winner_user_id,
      payoutId: existingPayout?.id || null,
      message: `Championship for ${dateStr} is already finalized. Idempotent exit.`,
    };
  }

  // 3. Mark championship status as 'evaluating'
  await admin
    .from('daily_championships')
    .update({ status: 'evaluating' })
    .eq('id', championship.id);

  // 4. Fetch all entries for this championship
  const { data: rawEntries, error: entriesErr } = await admin
    .from('championship_entries')
    .select(`
      id,
      championship_id,
      user_id,
      match_count,
      total_score,
      accuracy_percentage,
      total_time_seconds,
      correct_count,
      incorrect_count,
      anti_cheat_flags_count,
      flagged_for_review,
      disqualified,
      disqualification_reason,
      updated_at,
      user_profiles:user_id (
        full_name,
        username,
        school_or_college,
        battle_rating
      )
    `)
    .eq('championship_id', championship.id);

  if (entriesErr) {
    // Rollback status to active if fetch fails
    await admin.from('daily_championships').update({ status: 'active' }).eq('id', championship.id);
    throw new Error(`Failed to fetch championship entries: ${entriesErr.message}`);
  }

  // 5. Evaluate rankings and winner
  const evaluation = evaluateChampionship((rawEntries || []) as ChampionshipEntryRow[]);
  const winner = evaluation.provisionalWinner;

  let payoutId: string | null = null;

  // 6. Record provisional winner payout in championship_payouts (if winner exists)
  if (winner) {
    // Verify payout doesn't already exist for this championship (defensive check)
    const { data: existingPayout } = await admin
      .from('championship_payouts')
      .select('id')
      .eq('championship_id', championship.id)
      .maybeSingle();

    if (existingPayout) {
      payoutId = existingPayout.id;
    } else {
      const prizeAmount = championship.prize_amount_npr || 1000;
      const { data: newPayout, error: payoutErr } = await admin
        .from('championship_payouts')
        .insert({
          championship_id: championship.id,
          winner_user_id: winner.userId,
          amount_npr: prizeAmount,
          payout_method: 'esewa',
          payout_status: 'pending_verification', // ALWAYS pending_verification; never auto-disbursed
          admin_notes: evaluation.auditNotes,
        })
        .select('id')
        .single();

      if (payoutErr) {
        console.error('Warning: could not insert championship payout:', payoutErr);
      } else {
        payoutId = newPayout?.id || null;
      }
    }
  }

  // 7. Update championship row to finalized
  const finalizeTimestamp = new Date().toISOString();
  await admin
    .from('daily_championships')
    .update({
      status: 'finalized',
      winner_user_id: winner ? winner.userId : null,
      finalized_at: finalizeTimestamp,
    })
    .eq('id', championship.id);

  // 8. Ensure today's championship row is open and active
  const { data: todayChamp } = await admin
    .from('daily_championships')
    .select('id')
    .eq('competition_date', todayStr)
    .maybeSingle();

  if (!todayChamp) {
    await admin.from('daily_championships').insert({
      competition_date: todayStr,
      status: 'active',
      prize_amount_npr: 1000,
    });
  }

  return {
    success: true,
    alreadyFinalized: false,
    dateStr,
    championshipId: championship.id,
    winnerUserId: winner ? winner.userId : null,
    payoutId,
    evaluation,
    message: winner
      ? `Successfully finalized championship for ${dateStr}. Winner: ${winner.name} (NPR 1,000 pending verification).`
      : `Finalized championship for ${dateStr} with 0 participants.`,
  };
}
