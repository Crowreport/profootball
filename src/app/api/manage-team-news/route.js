import { checkAdminRole } from '@/utils/checkAdminRole';
import { supabase } from '@/utils/supabase';

// Admin emails for validation

export async function POST(request) {
  try {
    const { teamName, title, link, userEmail } = await request.json();

    // Validate admin user
    const isAdmin = await checkAdminRole(userEmail);
    if (!isAdmin) {
      return Response.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    // Validate required fields
    if (!teamName || !title || !link) {
      return Response.json({ error: 'Team name, title, and link are required' }, { status: 400 });
    }

    console.log('Adding team news for:', teamName);
    console.log('Title:', title);

    // Check current count of news articles for this team
    const { data: existingNews, error: countError } = await supabase
      .from('team_news')
      .select('id')
      .eq('team_name', teamName);

    if (countError) {
      console.error('Error checking existing news count:', countError);
      return Response.json({ error: 'Failed to check existing news' }, { status: 500 });
    }

    // If we already have 5 articles, delete the oldest one
    if (existingNews && existingNews.length >= 5) {
      const { error: deleteError } = await supabase
        .from('team_news')
        .delete()
        .eq('team_name', teamName)
        .order('created_at', { ascending: true })
        .limit(1);

      if (deleteError) {
        console.error('Error deleting oldest news:', deleteError);
        return Response.json({ error: 'Failed to manage news limit' }, { status: 500 });
      }
    }

    // Insert new team news into Supabase
    const { data, error } = await supabase
      .from('team_news')
      .insert({
        team_name: teamName,
        title: title,
        link: link,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return Response.json({ error: 'Failed to add team news' }, { status: 500 });
    }

    console.log('Team news added successfully:', data);

    // Return all news articles for this team
    const { data: allNews, error: fetchError } = await supabase
      .from('team_news')
      .select('*')
      .eq('team_name', teamName)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching all news:', fetchError);
      return Response.json({ error: 'Failed to fetch updated news list' }, { status: 500 });
    }

    const newsArticles = allNews.map(article => ({
      id: article.id,
      teamName: article.team_name,
      title: article.title,
      link: article.link,
      createdAt: article.created_at,
      updatedAt: article.updated_at
    }));

    return Response.json({
      success: true,
      newsArticles
    });

  } catch (error) {
    console.error('API error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const { teamName, title, link, originalTitle, userEmail } = await request.json();

    // Validate admin user
    const isAdmin = await checkAdminRole(userEmail);
    if (!isAdmin) {
      return Response.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    // Validate required fields
    if (!teamName || !title || !link || !originalTitle) {
      return Response.json({ error: 'All fields are required for update' }, { status: 400 });
    }

    console.log('Updating team news for:', teamName);
    console.log('Original title:', originalTitle);
    console.log('New title:', title);

    // Update team news in Supabase
    const { data, error } = await supabase
      .from('team_news')
      .update({
        title: title,
        link: link,
        updated_at: new Date().toISOString()
      })
      .eq('team_name', teamName)
      .eq('title', originalTitle)
      .select()
      .maybeSingle();

    if (error) {
      console.error('Database error:', error);
      return Response.json({ error: 'Failed to update team news' }, { status: 500 });
    }

    if (!data) {
      return Response.json({ error: 'News article not found' }, { status: 404 });
    }

    console.log('Team news updated successfully:', data);

    // Return all news articles for this team
    const { data: allNews, error: fetchError } = await supabase
      .from('team_news')
      .select('*')
      .eq('team_name', teamName)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching all news:', fetchError);
      return Response.json({ error: 'Failed to fetch updated news list' }, { status: 500 });
    }

    const newsArticles = allNews.map(article => ({
      id: article.id,
      teamName: article.team_name,
      title: article.title,
      link: article.link,
      createdAt: article.created_at,
      updatedAt: article.updated_at
    }));

    return Response.json({
      success: true,
      newsArticles
    });

  } catch (error) {
    console.error('API error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { teamName, title, userEmail } = await request.json();

    // Validate admin user
    const isAdmin = await checkAdminRole(userEmail);
    if (!isAdmin) {
      return Response.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    // Validate required fields
    if (!teamName || !title) {
      return Response.json({ error: 'Team name and title are required' }, { status: 400 });
    }

    console.log('Deleting team news for:', teamName);
    console.log('Title:', title);

    // Delete team news from Supabase
    const { error } = await supabase
      .from('team_news')
      .delete()
      .eq('team_name', teamName)
      .eq('title', title);

    if (error) {
      console.error('Database error:', error);
      return Response.json({ error: 'Failed to delete team news' }, { status: 500 });
    }

    console.log('Team news deleted successfully');

    // Return all remaining news articles for this team
    const { data: allNews, error: fetchError } = await supabase
      .from('team_news')
      .select('*')
      .eq('team_name', teamName)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching remaining news:', fetchError);
      return Response.json({ error: 'Failed to fetch updated news list' }, { status: 500 });
    }

    const newsArticles = allNews.map(article => ({
      id: article.id,
      teamName: article.team_name,
      title: article.title,
      link: article.link,
      createdAt: article.created_at,
      updatedAt: article.updated_at
    }));

    return Response.json({
      success: true,
      newsArticles
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

    // Fetch all team news from Supabase (up to 5)
    const { data, error } = await supabase
      .from('team_news')
      .select('*')
      .eq('team_name', teamName)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Database error:', error);
      return Response.json({ error: 'Failed to fetch team news' }, { status: 500 });
    }

    // Return team news array
    const newsArticles = data ? data.map(article => ({
      id: article.id,
      teamName: article.team_name,
      title: article.title,
      link: article.link,
      createdAt: article.created_at,
      updatedAt: article.updated_at
    })) : [];

    return Response.json({ newsArticles });

  } catch (error) {
    console.error('API error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
} 