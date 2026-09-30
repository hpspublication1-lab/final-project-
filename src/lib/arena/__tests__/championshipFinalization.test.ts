import { describe, it, expect, vi } from 'vitest';
import {
  evaluateChampionship,
  getChampionshipDates,
  finalizeDailyChampionship,
  type ChampionshipEntryRow,
} from '../championshipService';

describe('Championship Finalization Engine & Deterministic Ranking', () => {
  const mockEntries: ChampionshipEntryRow[] = [
    {
      id: 'entry-1',
      championship_id: 'champ-1',
      user_id: 'user-alice',
      match_count: 10,
      total_score: 85,
      accuracy_percentage: 90,
      total_time_seconds: 400,
      anti_cheat_flags_count: 0,
      disqualified: false,
      user_profiles: { full_name: 'Alice Sharma', battle_rating: 1400 },
    },
    {
      id: 'entry-2',
      championship_id: 'champ-1',
      user_id: 'user-bob',
      match_count: 10,
      total_score: 95, // Higher score -> Rank 1
      accuracy_percentage: 88,
      total_time_seconds: 420,
      anti_cheat_flags_count: 1,
      disqualified: false,
      user_profiles: { full_name: 'Bob Thapa', battle_rating: 1350 },
    },
    {
      id: 'entry-3',
      championship_id: 'champ-1',
      user_id: 'user-cheater',
      match_count: 10,
      total_score: 100, // Highest score but disqualified
      accuracy_percentage: 100,
      total_time_seconds: 100,
      anti_cheat_flags_count: 5,
      disqualified: true,
      disqualification_reason: 'Automated script detected',
      user_profiles: { full_name: 'Cheater User', battle_rating: 1600 },
    },
  ];

  it('1. filters out disqualified entries and ranks by total_score descending', () => {
    const result = evaluateChampionship(mockEntries);

    expect(result.totalParticipants).toBe(3);
    expect(result.qualifiedParticipants).toBe(2);
    expect(result.disqualifiedCount).toBe(1);

    // Rank 1 must be Bob Thapa (score 95), Cheater must be omitted
    expect(result.rankedLeaderboard.length).toBe(2);
    expect(result.rankedLeaderboard[0].userId).toBe('user-bob');
    expect(result.rankedLeaderboard[0].rank).toBe(1);
    expect(result.rankedLeaderboard[0].totalScore).toBe(95);

    expect(result.provisionalWinner?.userId).toBe('user-bob');
    expect(result.winnerFlaggedForReview).toBe(false);
  });

  it('2. deterministic tie-breaking: resolves identical score via accuracy_percentage', () => {
    const tiedScoreEntries: ChampionshipEntryRow[] = [
      {
        id: 'entry-10',
        championship_id: 'champ-1',
        user_id: 'user-low-acc',
        match_count: 10,
        total_score: 90,
        accuracy_percentage: 82, // lower accuracy
        total_time_seconds: 300,
        disqualified: false,
      },
      {
        id: 'entry-11',
        championship_id: 'champ-1',
        user_id: 'user-high-acc',
        match_count: 10,
        total_score: 90,
        accuracy_percentage: 92, // higher accuracy -> Winner
        total_time_seconds: 350,
        disqualified: false,
      },
    ];

    const result = evaluateChampionship(tiedScoreEntries);
    expect(result.provisionalWinner?.userId).toBe('user-high-acc');
    expect(result.rankedLeaderboard[0].rank).toBe(1);
    expect(result.rankedLeaderboard[1].rank).toBe(2);
  });

  it('3. deterministic tie-breaking: resolves identical score & accuracy via total_time_seconds (speed)', () => {
    const tiedTimeEntries: ChampionshipEntryRow[] = [
      {
        id: 'entry-20',
        championship_id: 'champ-1',
        user_id: 'user-slow',
        match_count: 10,
        total_score: 90,
        accuracy_percentage: 85,
        total_time_seconds: 450, // slower
        disqualified: false,
      },
      {
        id: 'entry-21',
        championship_id: 'champ-1',
        user_id: 'user-fast',
        match_count: 10,
        total_score: 90,
        accuracy_percentage: 85,
        total_time_seconds: 280, // faster -> Winner
        disqualified: false,
      },
    ];

    const result = evaluateChampionship(tiedTimeEntries);
    expect(result.provisionalWinner?.userId).toBe('user-fast');
    expect(result.rankedLeaderboard[0].userId).toBe('user-fast');
  });

  it('4. deterministic tie-breaking: resolves identical score, accuracy & time via updated_at timestamp', () => {
    const tiedTimestampEntries: ChampionshipEntryRow[] = [
      {
        id: 'entry-30',
        championship_id: 'champ-1',
        user_id: 'user-later',
        match_count: 10,
        total_score: 90,
        accuracy_percentage: 85,
        total_time_seconds: 300,
        updated_at: '2026-09-20T16:30:00Z',
        disqualified: false,
      },
      {
        id: 'entry-31',
        championship_id: 'champ-1',
        user_id: 'user-earlier',
        match_count: 10,
        total_score: 90,
        accuracy_percentage: 85,
        total_time_seconds: 300,
        updated_at: '2026-09-20T14:15:00Z', // earlier -> Winner
        disqualified: false,
      },
    ];

    const result = evaluateChampionship(tiedTimestampEntries);
    expect(result.provisionalWinner?.userId).toBe('user-earlier');
  });

  it('5. flags winner for administrative review if anti-cheat events >= 4', () => {
    const flaggedEntries: ChampionshipEntryRow[] = [
      {
        id: 'entry-40',
        championship_id: 'champ-1',
        user_id: 'user-suspect',
        match_count: 10,
        total_score: 98,
        accuracy_percentage: 95,
        total_time_seconds: 300,
        anti_cheat_flags_count: 4, // >= 4 threshold
        flagged_for_review: true,
        disqualified: false,
      },
    ];

    const result = evaluateChampionship(flaggedEntries);
    expect(result.provisionalWinner?.userId).toBe('user-suspect');
    expect(result.winnerFlaggedForReview).toBe(true);
    expect(result.auditNotes).toContain('CAUTION: Entry flagged with 4 anti-cheat flags');
  });

  it('6. safely handles zero eligible participants without errors', () => {
    const emptyResult = evaluateChampionship([]);
    expect(emptyResult.totalParticipants).toBe(0);
    expect(emptyResult.qualifiedParticipants).toBe(0);
    expect(emptyResult.provisionalWinner).toBeNull();
    expect(emptyResult.auditNotes).toContain('zero eligible participants');
  });

  it('7. computes accurate Nepal Timezone (UTC+5:45) calendar boundaries', () => {
    // Test midday UTC (e.g. 12:00:00 UTC = 17:45:00 NPT same day)
    const middayUtc = new Date('2026-09-20T12:00:00.000Z');
    const middayDates = getChampionshipDates(middayUtc);
    expect(middayDates.todayStr).toBe('2026-09-20');
    expect(middayDates.yesterdayStr).toBe('2026-09-19');

    // Test late evening UTC (e.g. 19:00:00 UTC = 00:45:00 NPT next day)
    const lateUtc = new Date('2026-09-20T19:00:00.000Z');
    const lateDates = getChampionshipDates(lateUtc);
    expect(lateDates.todayStr).toBe('2026-09-21');
    expect(lateDates.yesterdayStr).toBe('2026-09-20');
  });
});

describe('finalizeDailyChampionship Database Orchestration & Idempotency', () => {
  it('8. returns gracefully when championship for target date does not exist', async () => {
    const mockAdmin: any = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      }),
    };

    const result = await finalizeDailyChampionship(mockAdmin, '2026-01-01');
    expect(result.success).toBe(false);
    expect(result.message).toContain('No championship record exists');
  });

  it('9. provides strict idempotency: skips re-finalizing if status is already finalized', async () => {
    const mockAdmin: any = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'daily_championships') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: {
                    id: 'champ-already-done',
                    competition_date: '2026-09-19',
                    status: 'finalized',
                    winner_user_id: 'user-bob',
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'championship_payouts') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { id: 'payout-123' },
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      }),
    };

    const result = await finalizeDailyChampionship(mockAdmin, '2026-09-19');
    expect(result.success).toBe(true);
    expect(result.alreadyFinalized).toBe(true);
    expect(result.payoutId).toBe('payout-123');
    expect(result.message).toContain('already finalized. Idempotent exit');
  });

  it('10. records winner in championship_payouts strictly in pending_verification status', async () => {
    const insertedPayouts: any[] = [];
    const updatedChampionships: any[] = [];

    const mockAdmin: any = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'daily_championships') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockImplementation(async () => ({
                  data: {
                    id: 'champ-active-99',
                    competition_date: '2026-09-19',
                    status: 'active',
                    prize_amount_npr: 1000,
                  },
                  error: null,
                })),
              }),
            }),
            update: vi.fn().mockImplementation((payload: any) => ({
              eq: vi.fn().mockImplementation(async () => {
                updatedChampionships.push(payload);
                return { error: null };
              }),
            })),
            insert: vi.fn().mockResolvedValue({ error: null }),
          };
        }
        if (table === 'championship_entries') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [
                  {
                    id: 'entry-win',
                    championship_id: 'champ-active-99',
                    user_id: 'winner-student-id',
                    match_count: 10,
                    total_score: 94,
                    accuracy_percentage: 88,
                    total_time_seconds: 310,
                    anti_cheat_flags_count: 0,
                    disqualified: false,
                    user_profiles: { full_name: 'Bishal Sharma' },
                  },
                ],
                error: null,
              }),
            }),
          };
        }
        if (table === 'championship_payouts') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
            insert: vi.fn().mockImplementation((payload: any) => {
              insertedPayouts.push(payload);
              return {
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { id: 'new-payout-uuid' },
                    error: null,
                  }),
                }),
              };
            }),
          };
        }
        return {};
      }),
    };

    const result = await finalizeDailyChampionship(mockAdmin, '2026-09-19');

    expect(result.success).toBe(true);
    expect(result.alreadyFinalized).toBe(false);
    expect(result.winnerUserId).toBe('winner-student-id');
    expect(result.payoutId).toBe('new-payout-uuid');

    // Verify payout row inserted
    expect(insertedPayouts.length).toBe(1);
    const payout = insertedPayouts[0];
    expect(payout.winner_user_id).toBe('winner-student-id');
    expect(payout.amount_npr).toBe(1000);
    // CRITICAL: Payout status MUST be pending_verification, NEVER completed or auto-disbursed
    expect(payout.payout_status).toBe('pending_verification');
    expect(payout.payout_method).toBe('esewa');

    // Verify championship marked finalized
    const finalUpdate = updatedChampionships.find((u) => u.status === 'finalized');
    expect(finalUpdate).toBeDefined();
    expect(finalUpdate.winner_user_id).toBe('winner-student-id');
    expect(finalUpdate.finalized_at).toBeDefined();
  });
});
