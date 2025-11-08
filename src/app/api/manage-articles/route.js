import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';
import { checkRateLimit } from '@/utils/ratelimit';

// Admin emails (same as in AuthContext)
const ADMIN_EMAILS = [
  'minseo7532@gmail.com', 
  'robcroley@gmail.com',
];

// POST - Add custom article to a specific source
export async function POST(request) {
  try {
    console.log('Received POST request to add custom article');
    const { sourceUrl, title, link, userEmail } = await request.json();
    console.log('Request data:', { sourceUrl, title, link, userEmail });

    // Rate limiting: max 20 article creations per minute per user
    if (!checkRateLimit(`article-post-${userEmail}`, 20)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    if (!sourceUrl || !title || !link || !userEmail) {
      console.error('Missing required fields');
      return NextResponse.json({ error: 'Source URL, title, link, and user email are required' }, { status: 400 });
    }

    // Check if user is admin
    if (!ADMIN_EMAILS.includes(userEmail)) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 });
    }

    console.log('Adding article for admin user:', userEmail);

    // Insert the new custom article into the database
    const { data: newArticle, error: insertError } = await supabase
      .from('custom_articles')
      .insert([{
        source_url: sourceUrl,
        title: title.trim(),
        link: link.trim()
        // created_by field is optional - we're using email-based admin validation
      }])
      .select()
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
      return NextResponse.json({ error: 'Failed to save custom article' }, { status: 500 });
    }

    console.log('Successfully added custom article:', newArticle);
    
    // Return the article with isCustom flag for frontend compatibility
    const responseArticle = {
      title: newArticle.title,
      link: newArticle.link,
      pubDate: newArticle.created_at,
      isCustom: true
    };

    return NextResponse.json({ 
      message: 'Custom article added successfully', 
      article: responseArticle
    });
  } catch (error) {
    console.error('Error adding custom article:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 });
  }
}

// PUT - Edit existing custom article
export async function PUT(request) {
  try {
    console.log('Received PUT request to edit custom article');
    const { sourceUrl, originalTitle, title, link, userEmail } = await request.json();
    console.log('Request data:', { sourceUrl, originalTitle, title, link, userEmail });

    if (!sourceUrl || !originalTitle || !title || !link || !userEmail) {
      console.error('Missing required fields for edit');
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    // Check if user is admin
    if (!ADMIN_EMAILS.includes(userEmail)) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 });
    }

    // Update the article
    const { data: updatedArticle, error: updateError } = await supabase
      .from('custom_articles')
      .update({
        title: title.trim(),
        link: link.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('source_url', sourceUrl)
      .eq('title', originalTitle)
      .select()
      .maybeSingle(); // Use maybeSingle to handle case where no rows match

    if (updateError) {
      console.error('Database update error:', updateError);
      return NextResponse.json({ error: 'Failed to update custom article' }, { status: 500 });
    }

    if (!updatedArticle) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    console.log('Successfully updated custom article');
    
    const responseArticle = {
      title: updatedArticle.title,
      link: updatedArticle.link,
      pubDate: updatedArticle.created_at,
      isCustom: true
    };

    return NextResponse.json({ 
      message: 'Custom article updated successfully', 
      article: responseArticle
    });
  } catch (error) {
    console.error('Error updating custom article:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 });
  }
}

// DELETE - Remove custom article
export async function DELETE(request) {
  try {
    console.log('Received DELETE request to remove custom article');
    const { sourceUrl, title, userEmail } = await request.json();
    console.log('Request data:', { sourceUrl, title, userEmail });

    if (!sourceUrl || !title || !userEmail) {
      console.error('Missing required fields for delete');
      return NextResponse.json({ error: 'Source URL, title, and user email are required' }, { status: 400 });
    }

    // Check if user is admin
    if (!ADMIN_EMAILS.includes(userEmail)) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 });
    }

    // Delete the article
    const { data: deletedArticle, error: deleteError } = await supabase
      .from('custom_articles')
      .delete()
      .eq('source_url', sourceUrl)
      .eq('title', title)
      .select()
      .maybeSingle(); // Use maybeSingle to handle case where no rows match

    if (deleteError) {
      console.error('Database delete error:', deleteError);
      return NextResponse.json({ error: 'Failed to delete custom article' }, { status: 500 });
    }

    if (!deletedArticle) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    console.log('Successfully deleted custom article');
    return NextResponse.json({ message: 'Custom article deleted successfully' });
  } catch (error) {
    console.error('Error deleting custom article:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 });
  }
}

// GET - Get custom articles for all sources
export async function GET() {
  try {
    console.log('Fetching all custom articles');
    
    // Fetch all custom articles from the database
    const { data: articles, error } = await supabase
      .from('custom_articles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch custom articles' }, { status: 500 });
    }

    // Group articles by source URL (maintain compatibility with existing frontend)
    const groupedArticles = {};
    
    articles.forEach(article => {
      if (!groupedArticles[article.source_url]) {
        groupedArticles[article.source_url] = [];
      }
      
      // Transform database article to match frontend expectations
      groupedArticles[article.source_url].push({
        title: article.title,
        link: article.link,
        pubDate: article.created_at,
        isCustom: true
      });
    });

    console.log('Successfully fetched custom articles:', Object.keys(groupedArticles).length, 'sources');
    
    return NextResponse.json({ articles: groupedArticles });
  } catch (error) {
    console.error('Error fetching custom articles:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 });
  }
} 