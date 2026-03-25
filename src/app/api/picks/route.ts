import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || '';
const serviceSupabase = createServiceClient(supabaseUrl, supabaseServiceKey);

// GET - Fetch the authenticated user's picks
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const season = parseInt(searchParams.get('season') || '2025');
    const week = searchParams.get('week') ? parseInt(searchParams.get('week')!) : null;

    let query = serviceSupabase
      .from('prediction_picks')
      .select('*')
      .eq('user_id', user.id)
      .eq('season_year', season)
      .order('updated_at', { ascending: false });

    if (week !== null) {
      query = query.eq('week', week);
    }

    const { data: picks, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Fetch corresponding games to show result
    const gameKeys = (picks || []).map((p: any) => p.game_key).filter(Boolean);
    let gamesMap: Record<string, any> = {};
    if (gameKeys.length > 0) {
      const { data: games } = await serviceSupabase
        .from('prediction_games')
        .select('game_key, status, home_team, away_team, kickoff_time')
        .in('game_key', gameKeys);
      for (const g of games || []) {
        gamesMap[g.game_key] = g;
      }
    }

    const enrichedPicks = (picks || []).map((pick: any) => {
      const game = gamesMap[pick.game_key];
      const result = computePickResult(pick.pick_side, game);
      return {
        gameKey: pick.game_key,
        gameExternalId: pick.game_external_id,
        season: pick.season_year,
        week: pick.week,
        pick: pick.pick_side,
        pickedTeam: pick.picked_team,
        result,
        gameStatus: game?.status || 'unknown',
        locked: game ? isGameLocked(game) : false,
        createdAt: pick.created_at,
        updatedAt: pick.updated_at,
      };
    });

    return NextResponse.json({ picks: enrichedPicks });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Submit or update a pick
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'You must be logged in to submit a pick' }, { status: 401 });
    }

    const body = await request.json();
    const { gameKey, gameId, pick } = body;
    const resolvedGameKey = gameKey || gameId;

    if (!resolvedGameKey || !pick) {
      return NextResponse.json({ error: 'gameKey and pick are required' }, { status: 400 });
    }
    if (pick !== 'home' && pick !== 'away') {
      return NextResponse.json({ error: "pick must be 'home' or 'away'" }, { status: 400 });
    }

    // Fetch the game
    const { data: game, error: gameError } = await serviceSupabase
      .from('prediction_games')
      .select('*')
      .eq('game_key', resolvedGameKey)
      .single();

    if (gameError || !game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    if (isGameLocked(game)) {
      return NextResponse.json({ error: 'This game is locked and can no longer be picked' }, { status: 409 });
    }

    const pickedTeam = pick === 'home' ? game.home_team : game.away_team;

    const { data: stored, error: upsertError } = await serviceSupabase
      .from('prediction_picks')
      .upsert({
        user_id: user.id,
        game_key: game.game_key,
        season_year: game.season_year,
        week: game.week,
        game_external_id: game.external_id,
        pick_side: pick,
        picked_team: pickedTeam,
        source: 'nextjs-api',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,game_key' })
      .select()
      .single();

    if (upsertError) {
      console.error('[picks] upsert error:', upsertError);
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }

    return NextResponse.json({ pick: stored });
  } catch (err) {
    console.error('[picks] unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Remove a pick
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const gameKey = searchParams.get('gameKey') || searchParams.get('gameId');
    if (!gameKey) {
      return NextResponse.json({ error: 'gameKey is required' }, { status: 400 });
    }

    // Check lock status before deleting
    const { data: game } = await serviceSupabase
      .from('prediction_games')
      .select('status, kickoff_time')
      .eq('game_key', gameKey)
      .single();

    if (game && isGameLocked(game)) {
      return NextResponse.json({ error: 'This game is locked and can no longer be changed' }, { status: 409 });
    }

    const { error } = await serviceSupabase
      .from('prediction_picks')
      .delete()
      .eq('user_id', user.id)
      .eq('game_key', gameKey);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ deleted: true, gameKey });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// --- Helpers ---

function isGameLocked(game: any): boolean {
  // Only lock when the status explicitly says the game is in progress or over.
  // Do NOT lock on kickoff_time alone — seed/test data often has past dates but status 'scheduled'.
  const lockedStatuses = new Set(['live', 'final', 'postponed', 'cancelled']);
  return lockedStatuses.has((game.status || '').toLowerCase());
}

function computePickResult(pickSide: string, game: any): string {
  if (!game) return 'missing';
  const status = game.status?.toLowerCase();
  if (status === 'final') {
    const homeScore = game.home_team?.score ?? null;
    const awayScore = game.away_team?.score ?? null;
    if (homeScore === null || awayScore === null) return 'pending';
    if (homeScore === awayScore) return 'push';
    const winner = homeScore > awayScore ? 'home' : 'away';
    return pickSide === winner ? 'correct' : 'incorrect';
  }
  if (status === 'live') return 'live';
  if (status === 'postponed') return 'postponed';
  if (status === 'cancelled') return 'cancelled';
  return 'pending';
}
