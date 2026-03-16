import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create Supabase client - try service role key first, then anon
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl || '', supabaseKey || '');

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const season = searchParams.get('season') || '2025';
    const week = searchParams.get('week') || '1';
    const limit = parseInt(searchParams.get('limit') || '16');

    console.log(`[API] Fetching games: season=${season}, week=${week}, limit=${limit}`);
    console.log(`[API] Supabase URL: ${supabaseUrl}`);
    console.log(`[API] Using key: ${supabaseKey ? 'Present' : 'MISSING'}`);

    // Fetch from Supabase prediction_games table
    const { data, error } = await supabase
      .from('prediction_games')
      .select('*')
      .eq('season_year', parseInt(season))
      .eq('week', parseInt(week))
      .order('kickoff_time', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('[API] Supabase error:', JSON.stringify(error, null, 2));
      return NextResponse.json(
        { 
          error: 'Failed to fetch games', 
          details: error.message,
          code: error.code,
          debugInfo: {
            hasUrl: !!supabaseUrl,
            hasKey: !!supabaseKey,
            season,
            week,
            limit
          }
        },
        { status: 500 }
      );
    }

    console.log(`[API] Successfully fetched ${data?.length || 0} games`);

    // Transform Supabase data to match frontend expectations
    const games = (data || []).map((game: any) => ({
      id: game.external_id,
      date: game.kickoff_time,
      week: game.week,
      status: game.status,
      venue: game.venue,
      broadcast: game.broadcast,
      source: game.source,
      homeTeam: {
        name: game.home_team?.display_name || game.home_team?.name,
        logo: game.home_team?.logo_url,
        record: game.home_team?.record || '0-0',
        score: game.home_team?.score
      },
      awayTeam: {
        name: game.away_team?.display_name || game.away_team?.name,
        logo: game.away_team?.logo_url,
        record: game.away_team?.record || '0-0',
        score: game.away_team?.score
      },
      spread: game.spread,
      overUnder: game.over_under
    }));

    const response = {
      games: games,
      meta: {
        count: games.length,
        season: parseInt(season),
        week: parseInt(week),
        limit: limit
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('[API] Unexpected error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}