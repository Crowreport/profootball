import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

// GET - Fetch active polls for public display
export async function GET(request) {
  try {
    console.log('Fetching active polls');
    
    const url = new URL(request.url);
    const status = url.searchParams.get('status') || 'active';
    const limit = parseInt(url.searchParams.get('limit')) || 10;
    
    // Use regular supabase client for public read access
    let query = supabase
      .from('polls')
      .select(`
        id,
        title,
        question,
        description,
        status,
        allow_multiple_votes,
        expires_at,
        created_at,
        poll_options (
          id,
          option_text,
          option_order
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Filter by status if specified
    if (status !== 'all') {
      query = query.eq('status', status);
    }

    // Only show non-expired polls (unless specifically requesting all)
    if (status === 'active') {
      query = query.or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);
    }

    const { data: polls, error: pollsError } = await query;

    if (pollsError) {
      console.error('Database fetch error:', pollsError);
      return NextResponse.json({ error: 'Failed to fetch polls' }, { status: 500 });
    }

    // Get vote counts for each poll without revealing individual votes
    const pollsWithStats = await Promise.all(polls.map(async (poll) => {
      const { data: votes, error: votesError } = await supabase
        .from('poll_votes')
        .select('option_id')
        .eq('poll_id', poll.id);

      if (votesError) {
        console.error('Error fetching votes for poll:', poll.id, votesError);
        return { 
          ...poll, 
          totalVotes: 0, 
          options: poll.poll_options.map(option => ({
            ...option,
            votes: 0,
            percentage: 0
          }))
        };
      }

      // Count votes per option
      const optionVotes = {};
      votes.forEach(vote => {
        optionVotes[vote.option_id] = (optionVotes[vote.option_id] || 0) + 1;
      });

      const totalVotes = votes.length;

      // Add vote counts and percentages to options
      const optionsWithStats = poll.poll_options
        .sort((a, b) => a.option_order - b.option_order)
        .map(option => {
          const voteCount = optionVotes[option.id] || 0;
          const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
          
          return {
            id: option.id,
            text: option.option_text,
            order: option.option_order,
            votes: voteCount,
            percentage
          };
        });

      // Remove the poll_options field and replace with processed options
      const { poll_options, ...pollData } = poll;
      
      return {
        ...pollData,
        totalVotes,
        options: optionsWithStats,
        isExpired: poll.expires_at ? new Date(poll.expires_at) < new Date() : false
      };
    }));

    console.log('Successfully fetched polls:', pollsWithStats.length);
    
    return NextResponse.json({ 
      polls: pollsWithStats,
      count: pollsWithStats.length
    });
  } catch (error) {
    console.error('Error fetching polls:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 });
  }
}