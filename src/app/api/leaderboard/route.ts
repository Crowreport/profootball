import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || '';
const serviceSupabase = createServiceClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const season = parseInt(searchParams.get('season') || '2025');
    const week = searchParams.get('week') ? parseInt(searchParams.get('week')!) : null;
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 100);

    // 1. Fetch all picks for the given season (and optional week)
    let picksQuery = serviceSupabase
      .from('prediction_picks')
      .select('user_id, game_key, season_year, week, pick_side')
      .eq('season_year', season);
    if (week !== null) {
      picksQuery = picksQuery.eq('week', week);
    }
    const { data: picks, error: picksError } = await picksQuery;
    if (picksError) {
      return NextResponse.json({ error: picksError.message }, { status: 500 });
    }

    // 2. Fetch all games for the same scope — include kickoff_time for streak ordering
    // When week filter is set, only that week's games; otherwise all season games for streak
    const allGamesQuery = serviceSupabase
      .from('prediction_games')
      .select('game_key, status, home_team, away_team, week, season_year, kickoff_time')
      .eq('season_year', season);
    const { data: games, error: gamesError } = await allGamesQuery;
    if (gamesError) {
      return NextResponse.json({ error: gamesError.message }, { status: 500 });
    }

    // 3. Build game lookup
    const gameMap: Record<string, any> = {};
    for (const g of games || []) {
      gameMap[g.game_key] = g;
    }

    // Filter picks to requested week if supplied
    const filteredPicks = week !== null
      ? (picks || []).filter((p: any) => p.week === week)
      : (picks || []);

    // 4. Determine pick result per pick and aggregate by user
    const userStats: Record<string, { correct: number; incorrect: number; pending: number; total: number }> = {};
    const picksByUser: Record<string, any[]> = {};

    for (const pick of filteredPicks) {
      if (!userStats[pick.user_id]) {
        userStats[pick.user_id] = { correct: 0, incorrect: 0, pending: 0, total: 0 };
      }
      if (!picksByUser[pick.user_id]) picksByUser[pick.user_id] = [];
      picksByUser[pick.user_id].push(pick);

      const stats = userStats[pick.user_id];
      stats.total += 1;
      const result = computePickResult(pick.pick_side, gameMap[pick.game_key]);
      if (result === 'correct') stats.correct += 1;
      else if (result === 'incorrect') stats.incorrect += 1;
      else stats.pending += 1;
    }

    if (Object.keys(userStats).length === 0) {
      return NextResponse.json({
        entries: [],
        meta: { season, week, total: 0 },
      });
    }

    // 5. Fetch user info for display names
    const userIds = Object.keys(userStats);
    const { data: users } = await serviceSupabase
      .from('users')
      .select('id, username, first_name, last_name')
      .in('id', userIds);

    const userMap: Record<string, any> = {};
    for (const u of users || []) {
      userMap[u.id] = u;
    }

    // 6. Compute streak per user (most recent consecutive result in completed games)
    const streakMap: Record<string, { type: 'W' | 'L'; count: number } | null> = {};
    for (const [userId, userPicks] of Object.entries(picksByUser)) {
      const completed = userPicks
        .filter((p: any) => gameMap[p.game_key]?.status?.toLowerCase() === 'final')
        .sort((a: any, b: any) => {
          const ta = gameMap[a.game_key]?.kickoff_time || '';
          const tb = gameMap[b.game_key]?.kickoff_time || '';
          return tb.localeCompare(ta); // most recent first
        });

      if (completed.length === 0) { streakMap[userId] = null; continue; }

      const firstResult = computePickResult(completed[0].pick_side, gameMap[completed[0].game_key]);
      if (firstResult !== 'correct' && firstResult !== 'incorrect') { streakMap[userId] = null; continue; }

      let count = 1;
      for (let i = 1; i < completed.length; i++) {
        if (computePickResult(completed[i].pick_side, gameMap[completed[i].game_key]) === firstResult) count++;
        else break;
      }
      streakMap[userId] = { type: firstResult === 'correct' ? 'W' : 'L', count };
    }

    // 7. Build ranked entries
    const entries = Object.entries(userStats).map(([userId, stats]) => {
      const userInfo = userMap[userId] || {};
      const displayName =
        userInfo.username ||
        [userInfo.first_name, userInfo.last_name].filter(Boolean).join(' ') ||
        `Player${userId.slice(0, 6)}`;
      return {
        userId,
        displayName,
        points: stats.correct,
        correct: stats.correct,
        incorrect: stats.incorrect,
        pending: stats.pending,
        total: stats.total,
        streak: streakMap[userId] || null,
      };
    });

    // 8. Sort: most points first, then fewest incorrect, then alphabetical
    entries.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (a.incorrect !== b.incorrect) return a.incorrect - b.incorrect;
      return a.displayName.localeCompare(b.displayName);
    });

    // 9. Assign ranks (ties share rank) and build final shape
    let prevRank = 1;
    const ranked = entries.slice(0, limit).map((entry, i, arr) => {
      let rank = i + 1;
      if (i > 0 && entry.points === arr[i - 1].points && entry.incorrect === arr[i - 1].incorrect) {
        rank = prevRank;
      } else {
        prevRank = rank;
      }
      const record = `${entry.correct}-${entry.incorrect}`;
      return {
        rank,
        user: { id: entry.userId, displayName: entry.displayName },
        points: entry.points,
        record,
        correct: entry.correct,
        incorrect: entry.incorrect,
        pending: entry.pending,
        total: entry.total,
        streak: entry.streak, // { type: 'W'|'L', count: number } | null
      };
    });

    return NextResponse.json({
      entries: ranked,
      meta: { season, week, total: entries.length },
    });
  } catch (err) {
    console.error('[leaderboard] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// --- Helpers ---

function computePickResult(pickSide: string, game: any): string {
  if (!game) return 'pending';
  const status = game.status?.toLowerCase();
  if (status === 'final') {
    const homeScore = game.home_team?.score ?? null;
    const awayScore = game.away_team?.score ?? null;
    if (homeScore === null || awayScore === null) return 'pending';
    if (homeScore === awayScore) return 'push';
    const winner = homeScore > awayScore ? 'home' : 'away';
    return pickSide === winner ? 'correct' : 'incorrect';
  }
  return 'pending'; // live, scheduled, postponed all count as pending for leaderboard
}
