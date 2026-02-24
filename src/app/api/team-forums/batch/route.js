import { supabase } from '@/utils/supabase';

/**
 * Batch endpoint to fetch all team forums in a single query
 * GET /api/team-forums/batch
 * Returns all forums grouped by team name
 */
export async function GET() {
  try {
    console.log('Fetching all team forums in batch...');

    // Single query to fetch all forums
    const { data: allForums, error } = await supabase
      .from('team_forums')
      .select('id, team_name, name, url, created_at')
      .order('team_name', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Database error fetching forums:', error);
      return Response.json(
        { error: 'Failed to fetch team forums' },
        { status: 500 }
      );
    }

    // Group forums by team_name
    const forumsByTeam = {};

    if (allForums) {
      allForums.forEach(forum => {
        const teamName = forum.team_name;

        if (!forumsByTeam[teamName]) {
          forumsByTeam[teamName] = [];
        }

        forumsByTeam[teamName].push({
          id: forum.id,
          name: forum.name,
          url: forum.url
        });
      });
    }

    const teamCount = Object.keys(forumsByTeam).length;
    const forumCount = allForums?.length || 0;

    console.log(`Fetched ${forumCount} forums for ${teamCount} teams`);

    return Response.json({
      forums: forumsByTeam,
      totalTeams: teamCount,
      totalForums: forumCount
    });

  } catch (error) {
    console.error('API error in batch forums:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
