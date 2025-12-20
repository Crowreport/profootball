import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/utils/supabase';
import { checkRateLimit } from '@/utils/ratelimit';
import { checkAdminRole } from '@/utils/checkAdminRole';

// POST - Add custom video to a specific section
export async function POST(request) {
  try {
    console.log('Received POST request to add custom video');
    const { sectionType, title, link, thumbnail, userEmail } = await request.json();
    console.log('Request data:', { sectionType, title, link, thumbnail, userEmail });

    // Rate limiting: max 20 video creations per minute per user
    if (!checkRateLimit(`video-post-${userEmail}`, 20)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    if (!sectionType || !title || !link || !userEmail) {
      console.error('Missing required fields');
      return NextResponse.json({ error: 'Section type, title, link, and user email are required' }, { status: 400 });
    }

    // Check if user is admin
    const isAdmin = await checkAdminRole(userEmail);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 });
    }

    console.log('Adding video for admin user:', userEmail);

    // Create authenticated Supabase client with secret key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SECRET_KEY
    );

    // Insert the new custom video into the database
    const { data: newVideo, error: insertError } = await supabase
      .from('custom_videos')
      .insert([{
        section_type: sectionType,
        title: title.trim(),
        link: link.trim(),
        thumbnail: thumbnail || null
      }])
      .select()
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
      return NextResponse.json({ error: 'Failed to save custom video' }, { status: 500 });
    }

    console.log('Successfully added custom video:', newVideo);
    
    // Return the video with isCustom flag for frontend compatibility
    const responseVideo = {
      title: newVideo.title,
      link: newVideo.link,
      thumbnail: newVideo.thumbnail,
      pubDate: newVideo.created_at,
      isCustom: true
    };

    return NextResponse.json({ 
      message: 'Custom video added successfully', 
      video: responseVideo
    });
  } catch (error) {
    console.error('Error adding custom video:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 });
  }
}

// PUT - Edit existing custom video
export async function PUT(request) {
  try {
    console.log('Received PUT request to edit custom video');
    const { sectionType, originalTitle, title, link, thumbnail, userEmail } = await request.json();
    console.log('Request data:', { sectionType, originalTitle, title, link, thumbnail, userEmail });

    if (!sectionType || !originalTitle || !title || !link || !userEmail) {
      console.error('Missing required fields for edit');
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    // Check if user is admin
    const isAdmin = await checkAdminRole(userEmail);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 });
    }

    // Create authenticated Supabase client with secret key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SECRET_KEY
    );

    // Update the video
    const { data: updatedVideo, error: updateError } = await supabase
      .from('custom_videos')
      .update({
        title: title.trim(),
        link: link.trim(),
        thumbnail: thumbnail || null,
        updated_at: new Date().toISOString()
      })
      .eq('section_type', sectionType)
      .eq('title', originalTitle)
      .select()
      .maybeSingle();

    if (updateError) {
      console.error('Database update error:', updateError);
      return NextResponse.json({ error: 'Failed to update custom video' }, { status: 500 });
    }

    if (!updatedVideo) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    console.log('Successfully updated custom video');
    
    const responseVideo = {
      title: updatedVideo.title,
      link: updatedVideo.link,
      thumbnail: updatedVideo.thumbnail,
      pubDate: updatedVideo.created_at,
      isCustom: true
    };

    return NextResponse.json({ 
      message: 'Custom video updated successfully', 
      video: responseVideo
    });
  } catch (error) {
    console.error('Error updating custom video:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 });
  }
}

// DELETE - Remove custom video
export async function DELETE(request) {
  try {
    console.log('Received DELETE request to remove custom video');
    const { sectionType, title, userEmail } = await request.json();
    console.log('Request data:', { sectionType, title, userEmail });

    if (!sectionType || !title || !userEmail) {
      console.error('Missing required fields for delete');
      return NextResponse.json({ error: 'Section type, title, and user email are required' }, { status: 400 });
    }

    // Check if user is admin
    const isAdmin = await checkAdminRole(userEmail);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 });
    }

    // Create authenticated Supabase client with secret key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SECRET_KEY
    );

    // Delete the video
    const { data: deletedVideo, error: deleteError } = await supabase
      .from('custom_videos')
      .delete()
      .eq('section_type', sectionType)
      .eq('title', title)
      .select()
      .maybeSingle();

    if (deleteError) {
      console.error('Database delete error:', deleteError);
      return NextResponse.json({ error: 'Failed to delete custom video' }, { status: 500 });
    }

    if (!deletedVideo) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    console.log('Successfully deleted custom video');
    return NextResponse.json({ message: 'Custom video deleted successfully' });
  } catch (error) {
    console.error('Error deleting custom video:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 });
  }
}

// GET - Get custom videos for all sections
export async function GET() {
  try {
    console.log('Fetching all custom videos');
    
    // Use regular supabase client for public read access
    const { data: videos, error } = await supabase
      .from('custom_videos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch custom videos' }, { status: 500 });
    }

    // Group videos by section type (maintain compatibility with existing frontend)
    const groupedVideos = {};
    
    videos.forEach(video => {
      if (!groupedVideos[video.section_type]) {
        groupedVideos[video.section_type] = [];
      }
      
      // Transform database video to match frontend expectations
      groupedVideos[video.section_type].push({
        title: video.title,
        link: video.link,
        thumbnail: video.thumbnail,
        pubDate: video.created_at,
        isCustom: true
      });
    });

    console.log('Successfully fetched custom videos:', Object.keys(groupedVideos).length, 'sections');
    
    return NextResponse.json({ videos: groupedVideos });
  } catch (error) {
    console.error('Error fetching custom videos:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 });
  }
} 