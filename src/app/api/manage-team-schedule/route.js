import { supabase } from '@/utils/supabase';

// Admin emails for validation
const ADMIN_EMAILS = process.env.ADMIN_EMAILS?.split(',') || [];

export async function POST(request) {
  try {
    const { teamName, schedules, userEmail } = await request.json();

    // Validate admin user
    if (!ADMIN_EMAILS.includes(userEmail)) {
      return Response.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    // Validate required fields
    if (!teamName || !schedules || !Array.isArray(schedules)) {
      return Response.json({ error: 'Team name and schedules array are required' }, { status: 400 });
    }

    console.log('Updating team schedule for:', teamName);
    console.log('Number of games:', schedules.length);

    // First, delete existing schedules for this team
    const { error: deleteError } = await supabase
      .from('team_schedule')
      .delete()
      .eq('team_name', teamName);

    if (deleteError) {
      console.error('Error deleting existing schedules:', deleteError);
      return Response.json({ error: 'Failed to update team schedule' }, { status: 500 });
    }

    // Insert new schedules
    const schedulesToInsert = schedules.map(schedule => ({
      team_name: teamName,
      home_team: schedule.homeTeam,
      away_team: schedule.awayTeam,
      location: schedule.location,
      game_date: schedule.gameDate,
      game_time: schedule.gameTime,
      created_at: new Date().toISOString()
    }));

    const { data, error } = await supabase
      .from('team_schedule')
      .insert(schedulesToInsert)
      .select();

    if (error) {
      console.error('Database error:', error);
      return Response.json({ error: 'Failed to update team schedule' }, { status: 500 });
    }

    console.log('Team schedule updated successfully:', data.length, 'games');

    // Return the updated data in a format expected by the frontend
    const formattedSchedules = data.map(schedule => ({
      id: schedule.id,
      homeTeam: schedule.home_team,
      awayTeam: schedule.away_team,
      location: schedule.location,
      gameDate: schedule.game_date,
      gameTime: schedule.game_time
    }));

    return Response.json({
      success: true,
      schedules: formattedSchedules
    });

  } catch (error) {
    console.error('API error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const teamName = url.searchParams.get('teamName');

    if (!teamName) {
      return Response.json({ error: 'Team name is required' }, { status: 400 });
    }

    // Fetch team schedule from Supabase
    const { data, error } = await supabase
      .from('team_schedule')
      .select('*')
      .eq('team_name', teamName)
      .order('game_date', { ascending: true });

    if (error) {
      console.error('Database error:', error);
      return Response.json({ error: 'Failed to fetch team schedule' }, { status: 500 });
    }

    // Return schedules or empty array
    const schedules = data ? data.map(schedule => ({
      id: schedule.id,
      homeTeam: schedule.home_team,
      awayTeam: schedule.away_team,
      location: schedule.location,
      gameDate: schedule.game_date,
      gameTime: schedule.game_time
    })) : [];

    return Response.json({ schedules });

  } catch (error) {
    console.error('API error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
} 