import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';
import { checkRateLimit } from '@/utils/ratelimit';

// POST - Submit a vote for a poll
export async function POST(request) {
  try {
    console.log('Received vote submission');
    const { pollId, optionId, userId, userSession } = await request.json();
    console.log('Vote data:', { pollId, optionId, userId: userId ? 'present' : 'null', userSession: userSession ? 'present' : 'null' });

    // Rate limiting: max 20 votes per minute per session/user
    const rateLimitKey = userId ? `vote-user-${userId}` : `vote-session-${userSession}`;
    if (!checkRateLimit(rateLimitKey, 20)) {
      return NextResponse.json(
        { error: 'Too many votes. Please try again later.' },
        { status: 429 }
      );
    }

    if (!pollId || !optionId) {
      console.error('Missing required fields');
      return NextResponse.json({ 
        error: 'Poll ID and option ID are required' 
      }, { status: 400 });
    }

    if (!userId) {
      console.error('User must be logged in to vote');
      return NextResponse.json({ 
        error: 'Please log in to vote on polls' 
      }, { status: 401 });
    }

    // First, verify the poll exists and is active
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .select('id, status, expires_at, allow_multiple_votes')
      .eq('id', pollId)
      .single();

    if (pollError || !poll) {
      console.error('Poll not found:', pollError);
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
    }

    // Check if poll is active
    if (poll.status !== 'active') {
      return NextResponse.json({ error: 'Poll is not active' }, { status: 400 });
    }

    // Check if poll has expired
    if (poll.expires_at && new Date(poll.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Poll has expired' }, { status: 400 });
    }

    // Verify the option exists for this poll
    const { data: option, error: optionError } = await supabase
      .from('poll_options')
      .select('id')
      .eq('id', optionId)
      .eq('poll_id', pollId)
      .single();

    if (optionError || !option) {
      console.error('Option not found:', optionError);
      return NextResponse.json({ error: 'Invalid option for this poll' }, { status: 400 });
    }

    // Check if user has already voted (unless multiple votes are allowed)
    if (!poll.allow_multiple_votes) {
      const { data: existingVote, error: voteCheckError } = await supabase
        .from('poll_votes')
        .select('id')
        .eq('poll_id', pollId)
        .eq('user_id', userId)
        .single();

      if (voteCheckError && voteCheckError.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error checking existing vote:', voteCheckError);
        return NextResponse.json({ error: 'Error checking vote status' }, { status: 500 });
      }

      if (existingVote) {
        return NextResponse.json({ 
          error: 'You have already voted in this poll',
          alreadyVoted: true 
        }, { status: 400 });
      }
    }

    // Submit the vote
    const voteData = {
      poll_id: pollId,
      option_id: optionId,
      user_id: userId
    };

    const { data: newVote, error: voteError } = await supabase
      .from('poll_votes')
      .insert([voteData])
      .select()
      .single();

    if (voteError) {
      console.error('Error submitting vote:', voteError);
      
      // Handle unique constraint violations (duplicate votes)
      if (voteError.code === '23505') {
        return NextResponse.json({ 
          error: 'You have already voted in this poll',
          alreadyVoted: true 
        }, { status: 400 });
      }
      
      return NextResponse.json({ error: 'Failed to submit vote' }, { status: 500 });
    }

    console.log('Vote submitted successfully:', newVote.id);

    // Get updated poll results
    const { data: votes, error: resultsError } = await supabase
      .from('poll_votes')
      .select('option_id')
      .eq('poll_id', pollId);

    if (resultsError) {
      console.error('Error fetching updated results:', resultsError);
      // Still return success since vote was submitted
      return NextResponse.json({ 
        message: 'Vote submitted successfully',
        voteId: newVote.id
      });
    }

    // Calculate updated vote counts
    const optionVotes = {};
    votes.forEach(vote => {
      optionVotes[vote.option_id] = (optionVotes[vote.option_id] || 0) + 1;
    });

    const totalVotes = votes.length;

    return NextResponse.json({ 
      message: 'Vote submitted successfully',
      voteId: newVote.id,
      results: {
        totalVotes,
        optionVotes,
        voted: true,
        votedOptionId: optionId
      }
    });
  } catch (error) {
    console.error('Error submitting vote:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 });
  }
}

// GET - Check if user has voted in a poll
export async function GET(request) {
  try {
    const url = new URL(request.url);
    const pollId = url.searchParams.get('pollId');
    const userId = url.searchParams.get('userId');
    const userSession = url.searchParams.get('userSession');

    if (!pollId) {
      return NextResponse.json({ error: 'Poll ID is required' }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'Please log in to check vote status' }, { status: 401 });
    }

    // Check if user has voted
    const { data: votes, error } = await supabase
      .from('poll_votes')
      .select('option_id, voted_at')
      .eq('poll_id', pollId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error checking vote status:', error);
      return NextResponse.json({ error: 'Error checking vote status' }, { status: 500 });
    }

    const hasVoted = votes && votes.length > 0;
    const votedOptions = hasVoted ? votes.map(vote => vote.option_id) : [];

    return NextResponse.json({ 
      hasVoted,
      votedOptions,
      voteCount: votes ? votes.length : 0
    });
  } catch (error) {
    console.error('Error checking vote status:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 });
  }
}