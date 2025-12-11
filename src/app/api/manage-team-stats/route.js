import { checkAdminRole } from '@/utils/checkAdminRole';
import { supabase } from '@/utils/supabase';

// Admin emails for validation

export async function POST(request) {
  try {
    const { teamName, wins, losses, ties, divisionPosition, userEmail } = await request.json();

    // Validate admin user
    const isAdmin = await checkAdminRole(userEmail);
    if (!isAdmin) {
      return Response.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    // Validate required fields
    if (!teamName || wins === undefined || losses === undefined || ties === undefined || !divisionPosition) {
      return Response.json({ error: 'All fields are required' }, { status: 400 });
    }

    console.log('Updating team stats for:', teamName);
    console.log('Data:', { wins, losses, ties, divisionPosition });

    // Create record string (e.g., "12-5-0")
    const record = `${wins}-${losses}-${ties}`;

    // Insert or update team stats in Supabase
    const { data, error } = await supabase
      .from('team_stats')
      .upsert(
        {
          team_name: teamName,
          wins: parseInt(wins),
          losses: parseInt(losses),
          ties: parseInt(ties),
          record: record,
          division_position: divisionPosition,
          updated_at: new Date().toISOString()
        },
        {
          onConflict: 'team_name'
        }
      )
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return Response.json({ error: 'Failed to update team stats' }, { status: 500 });
    }

    console.log('Team stats updated successfully:', data);

    // Return the updated data in a format expected by the frontend
    return Response.json({
      success: true,
      teamStats: {
        teamName: data.team_name,
        record: data.record,
        divisionPosition: data.division_position,
        wins: data.wins,
        losses: data.losses,
        ties: data.ties
      }
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

    // Fetch team stats from Supabase
    const { data, error } = await supabase
      .from('team_stats')
      .select('*')
      .eq('team_name', teamName)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Database error:', error);
      return Response.json({ error: 'Failed to fetch team stats' }, { status: 500 });
    }

    // Return team stats or defaults
    const teamStats = data ? {
      teamName: data.team_name,
      record: data.record,
      divisionPosition: data.division_position,
      wins: data.wins,
      losses: data.losses,
      ties: data.ties
    } : {
      teamName: teamName,
      record: 'W-L-T',
      divisionPosition: 'Division Position',
      wins: 0,
      losses: 0,
      ties: 0
    };

    return Response.json({ teamStats });

  } catch (error) {
    console.error('API error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
} 