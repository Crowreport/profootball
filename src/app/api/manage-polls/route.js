import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/utils/supabase';
import { checkRateLimit } from '@/utils/ratelimit';
import { checkAdminRole } from '@/utils/checkAdminRole';

// POST - Create a new poll with options
export async function POST(request) {
  try {
    console.log('Received POST request to create poll');
    const { title, question, description, status, allowMultipleVotes, expiresAt, options, userId } = await request.json();
    console.log('Request data:', { title, question, description, status, allowMultipleVotes, expiresAt, options: options?.length });

    // Rate limiting: max 10 poll creations per minute per user
    if (!checkRateLimit(`poll-post-${userId}`, 10)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    if (!title || !question || !options || !Array.isArray(options) || options.length < 2 || !userId) {
      console.error('Missing required fields');
      return NextResponse.json({
        error: 'Title, question, at least 2 options, and userId are required'
      }, { status: 400 });
    }

    // Check if user is admin
    const isAdmin = await checkAdminRole(userId);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 });
    }

    console.log('Creating poll for admin user:', userId);

    // Create authenticated Supabase client with secret key for admin operations
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SECRET_KEY
    );

    // First, create the poll
    const { data: newPoll, error: pollError } = await adminSupabase
      .from('polls')
      .insert([{
        title: title.trim(),
        question: question.trim(),
        description: description?.trim() || null,
        status: status || 'active',
        allow_multiple_votes: allowMultipleVotes || false,
        expires_at: expiresAt || null
      }])
      .select()
      .single();

    if (pollError) {
      console.error('Database poll insert error:', pollError);
      return NextResponse.json({ error: 'Failed to create poll' }, { status: 500 });
    }

    console.log('Poll created:', newPoll.id);

    // Then, create the poll options
    const optionsToInsert = options.map((option, index) => ({
      poll_id: newPoll.id,
      option_text: option.text?.trim() || option,
      option_order: index
    }));

    const { data: newOptions, error: optionsError } = await adminSupabase
      .from('poll_options')
      .insert(optionsToInsert)
      .select();

    if (optionsError) {
      console.error('Database options insert error:', optionsError);
      // Clean up the poll if options failed
      await adminSupabase.from('polls').delete().eq('id', newPoll.id);
      return NextResponse.json({ error: 'Failed to create poll options' }, { status: 500 });
    }

    console.log('Poll options created:', newOptions.length);

    return NextResponse.json({ 
      message: 'Poll created successfully', 
      poll: {
        ...newPoll,
        options: newOptions
      }
    });
  } catch (error) {
    console.error('Error creating poll:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 });
  }
}

// PUT - Update existing poll
export async function PUT(request) {
  try {
    console.log('Received PUT request to update poll');
    const { pollId, title, question, description, status, allowMultipleVotes, expiresAt, options, userId } = await request.json();
    console.log('Request data:', { pollId, title, question, status });

    if (!pollId || !title || !question || !userId) {
      console.error('Missing required fields for update');
      return NextResponse.json({ error: 'Poll ID, title, question, and userId are required' }, { status: 400 });
    }

    // Check if user is admin
    const isAdmin = await checkAdminRole(userId);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 });
    }

    // Create authenticated Supabase client with secret key for admin operations
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SECRET_KEY
    );

    // Update the poll
    const { data: updatedPoll, error: updateError } = await adminSupabase
      .from('polls')
      .update({
        title: title.trim(),
        question: question.trim(),
        description: description?.trim() || null,
        status: status || 'active',
        allow_multiple_votes: allowMultipleVotes || false,
        expires_at: expiresAt || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', pollId)
      .select()
      .single();

    if (updateError) {
      console.error('Database poll update error:', updateError);
      return NextResponse.json({ error: 'Failed to update poll' }, { status: 500 });
    }

    if (!updatedPoll) {
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
    }

    // If options are provided, update them
    if (options && Array.isArray(options)) {
      // Delete existing options
      await adminSupabase
        .from('poll_options')
        .delete()
        .eq('poll_id', pollId);

      // Insert new options
      const optionsToInsert = options.map((option, index) => ({
        poll_id: pollId,
        option_text: option.text?.trim() || option,
        option_order: index
      }));

      const { data: newOptions, error: optionsError } = await adminSupabase
        .from('poll_options')
        .insert(optionsToInsert)
        .select();

      if (optionsError) {
        console.error('Database options update error:', optionsError);
        return NextResponse.json({ error: 'Failed to update poll options' }, { status: 500 });
      }

      return NextResponse.json({ 
        message: 'Poll updated successfully', 
        poll: {
          ...updatedPoll,
          options: newOptions
        }
      });
    }

    console.log('Poll updated successfully');
    return NextResponse.json({ 
      message: 'Poll updated successfully', 
      poll: updatedPoll
    });
  } catch (error) {
    console.error('Error updating poll:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 });
  }
}

// DELETE - Remove poll
export async function DELETE(request) {
  try {
    console.log('Received DELETE request to remove poll');
    const { pollId, userId } = await request.json();
    console.log('Request data:', { pollId, userId });

    if (!pollId || !userId) {
      console.error('Missing required fields for delete');
      return NextResponse.json({ error: 'Poll ID and userId are required' }, { status: 400 });
    }

    // Check if user is admin
    const isAdmin = await checkAdminRole(userId);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 });
    }

    // Create authenticated Supabase client with secret key for admin operations
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SECRET_KEY
    );

    // Delete the poll (options and votes will cascade delete)
    const { data: deletedPoll, error: deleteError } = await adminSupabase
      .from('polls')
      .delete()
      .eq('id', pollId)
      .select()
      .single();

    if (deleteError) {
      console.error('Database delete error:', deleteError);
      return NextResponse.json({ error: 'Failed to delete poll' }, { status: 500 });
    }

    if (!deletedPoll) {
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
    }

    console.log('Poll deleted successfully');
    return NextResponse.json({ message: 'Poll deleted successfully' });
  } catch (error) {
    console.error('Error deleting poll:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 });
  }
}

// GET - Get all polls for admin management
export async function GET() {
  try {
    console.log('Fetching all polls for admin');
    
    // Use regular supabase client for public read access
    const { data: polls, error: pollsError } = await supabase
      .from('polls')
      .select(`
        *,
        poll_options (
          id,
          option_text,
          option_order
        )
      `)
      .order('created_at', { ascending: false });

    if (pollsError) {
      console.error('Database fetch error:', pollsError);
      return NextResponse.json({ error: 'Failed to fetch polls' }, { status: 500 });
    }

    // Get vote counts for each poll
    const pollsWithVotes = await Promise.all(polls.map(async (poll) => {
      const { data: votes, error: votesError } = await supabase
        .from('poll_votes')
        .select('option_id')
        .eq('poll_id', poll.id);

      if (votesError) {
        console.error('Error fetching votes for poll:', poll.id, votesError);
        return { ...poll, totalVotes: 0, optionVotes: {} };
      }

      // Count votes per option
      const optionVotes = {};
      votes.forEach(vote => {
        optionVotes[vote.option_id] = (optionVotes[vote.option_id] || 0) + 1;
      });

      return {
        ...poll,
        totalVotes: votes.length,
        optionVotes
      };
    }));

    console.log('Successfully fetched polls:', pollsWithVotes.length);
    
    return NextResponse.json({ polls: pollsWithVotes });
  } catch (error) {
    console.error('Error fetching polls:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 });
  }
}