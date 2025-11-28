import { supabase } from '@/utils/supabase';

// Admin emails for validation
const ADMIN_EMAILS = process.env.ADMIN_EMAILS?.split(',') || [];

export async function POST(request) {
  try {
    const { teamName, forums, userEmail } = await request.json();

    // Validate admin user
    if (!ADMIN_EMAILS.includes(userEmail)) {
      return Response.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    // Validate required fields
    if (!teamName || !forums || !Array.isArray(forums)) {
      return Response.json({ error: 'Team name and forums array are required' }, { status: 400 });
    }

    console.log('Updating team forums for:', teamName);
    console.log('Number of forums:', forums.length);

    // First, delete existing forums for this team
    const { error: deleteError } = await supabase
      .from('team_forums')
      .delete()
      .eq('team_name', teamName);

    if (deleteError) {
      console.error('Error deleting existing forums:', deleteError);
      return Response.json({ error: 'Failed to update team forums' }, { status: 500 });
    }

    // Insert new forums
    const forumsToInsert = forums.map(forum => ({
      team_name: teamName,
      name: forum.name,
      url: forum.url,
      created_at: new Date().toISOString()
    }));

    const { data, error } = await supabase
      .from('team_forums')
      .insert(forumsToInsert)
      .select();

    if (error) {
      console.error('Database error:', error);
      return Response.json({ error: 'Failed to update team forums' }, { status: 500 });
    }

    console.log('Team forums updated successfully:', data.length, 'forums');

    // Return the updated data in a format expected by the frontend
    const formattedForums = data.map(forum => ({
      id: forum.id,
      name: forum.name,
      url: forum.url
    }));

    return Response.json({
      success: true,
      forums: formattedForums
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

    // Fetch team forums from Supabase
    const { data, error } = await supabase
      .from('team_forums')
      .select('*')
      .eq('team_name', teamName)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Database error:', error);
      return Response.json({ error: 'Failed to fetch team forums' }, { status: 500 });
    }

    // Return forums or empty array
    const forums = data ? data.map(forum => ({
      id: forum.id,
      name: forum.name,
      url: forum.url
    })) : [];

    return Response.json({ forums });

  } catch (error) {
    console.error('API error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
} 