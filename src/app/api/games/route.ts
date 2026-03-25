import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create Supabase client - try service role key first, then anon
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl || '', supabaseKey || '');

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '16');

    // Auto-detect most relevant season + week if not provided.
    // Strategy: find the earliest season that has at least one non-final game;
    // if everything is final, fall back to the latest season / latest week.
    let season: number;
    let week: number;

    if (searchParams.get('season')) {
      season = parseInt(searchParams.get('season')!);
    } else {
      // Prefer the season that has upcoming/scheduled games
      const { data: scheduledGame } = await supabase
        .from('prediction_games')
        .select('season_year, week')
        .in('status', ['scheduled', 'live'])
        .order('season_year', { ascending: true })
        .order('week', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (scheduledGame) {
        season = scheduledGame.season_year;
      } else {
        // All games are final — pick the latest season
        const { data: latestGame } = await supabase
          .from('prediction_games')
          .select('season_year')
          .order('season_year', { ascending: false })
          .limit(1)
          .maybeSingle();
        season = latestGame?.season_year ?? parseInt(process.env.NFL_SEASON_YEAR || '2025');
      }
    }

    if (searchParams.get('week')) {
      week = parseInt(searchParams.get('week')!);
    } else {
      // Within the season: prefer earliest week with scheduled/live games
      const { data: scheduledWeek } = await supabase
        .from('prediction_games')
        .select('week')
        .eq('season_year', season)
        .in('status', ['scheduled', 'live'])
        .order('week', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (scheduledWeek) {
        week = scheduledWeek.week;
      } else {
        // All final — show the last week of the season
        const { data: lastWeek } = await supabase
          .from('prediction_games')
          .select('week')
          .eq('season_year', season)
          .order('week', { ascending: false })
          .limit(1)
          .maybeSingle();
        week = lastWeek?.week ?? 1;
      }
    }

    console.log(`[API] Fetching games: season=${season}, week=${week}, limit=${limit}`);

    // Fetch from Supabase prediction_games table
    const { data, error } = await supabase
      .from('prediction_games')
      .select('*')
      .eq('season_year', season)
      .eq('week', week)
      .order('kickoff_time', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('[API] Supabase error:', JSON.stringify(error, null, 2));
      return NextResponse.json(
        { error: 'Failed to fetch games', details: error.message },
        { status: 500 }
      );
    }

    console.log(`[API] Successfully fetched ${data?.length || 0} games`);

    // Derive a reliable ESPN logo URL from the team abbreviation.
    // Stored logo_url may have wrong paths (e.g. /scoreboard/); abbreviation is always clean.
    const espnLogo = (team: any): string => {
      const abbr = team?.abbreviation;
      if (abbr) return `https://a.espncdn.com/i/teamlogos/nfl/500/${abbr.toLowerCase()}.png`;
      // Fallback: strip any /scoreboard/ segment from whatever is stored
      return (team?.logo_url || '').replace('/scoreboard/', '/');
    };

    // Transform Supabase data to match frontend expectations
    const games = (data || []).map((game: any) => ({
      id: game.external_id,
      gameKey: game.game_key,
      seasonYear: game.season_year,
      date: game.kickoff_time,
      week: game.week,
      status: game.status,
      venue: game.venue,
      broadcast: game.broadcast,
      source: game.source,
      homeTeam: {
        name: game.home_team?.display_name || game.home_team?.name,
        abbreviation: game.home_team?.abbreviation,
        logo: espnLogo(game.home_team),
        record: game.home_team?.record || '0-0',
        score: game.home_team?.score
      },
      awayTeam: {
        name: game.away_team?.display_name || game.away_team?.name,
        abbreviation: game.away_team?.abbreviation,
        logo: espnLogo(game.away_team),
        record: game.away_team?.record || '0-0',
        score: game.away_team?.score
      },
      spread: game.spread,
      overUnder: game.over_under
    }));

    return NextResponse.json({
      games,
      meta: { count: games.length, season, week, limit }
    });

  } catch (error) {
    console.error('[API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}