import { supabase } from '@/utils/supabase';

// Admin emails for validation
const ADMIN_EMAILS = process.env.ADMIN_EMAILS?.split(',') || [];

export async function POST(request) {
  try {
    const { teamName, headCoach, stadium, established, userEmail } = await request.json();

    // Validate admin user
    if (!ADMIN_EMAILS.includes(userEmail)) {
      return Response.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    // Validate required fields
    if (!teamName || !headCoach || !stadium || !established) {
      return Response.json({ error: 'All fields are required' }, { status: 400 });
    }

    console.log('Updating team info for:', teamName);
    console.log('Data:', { headCoach, stadium, established });

    // Insert or update team info in Supabase
    const { data, error } = await supabase
      .from('team_info')
      .upsert(
        {
          team_name: teamName,
          head_coach: headCoach,
          stadium: stadium,
          established: parseInt(established),
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
      return Response.json({ error: 'Failed to update team information' }, { status: 500 });
    }

    console.log('Team info updated successfully:', data);

    // Return the updated data in a format expected by the frontend
    return Response.json({
      success: true,
      teamInfo: {
        teamName: data.team_name,
        headCoach: data.head_coach,
        stadium: data.stadium,
        established: data.established
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

    // Fetch team info from Supabase
    const { data, error } = await supabase
      .from('team_info')
      .select('*')
      .eq('team_name', teamName)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Database error:', error);
      return Response.json({ error: 'Failed to fetch team information' }, { status: 500 });
    }

    // Return team info or defaults
    const teamInfo = data ? {
      teamName: data.team_name,
      headCoach: data.head_coach,
      stadium: data.stadium,
      established: data.established
    } : {
      teamName: teamName,
      headCoach: 'Coach Name',
      stadium: 'Stadium Name',
      established: 'Year'
    };

    return Response.json({ teamInfo });

  } catch (error) {
    console.error('API error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
} 