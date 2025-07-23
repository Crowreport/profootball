import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

// Helper to extract YouTube video ID from various URL formats
const getYouTubeVideoId = (url) => {
  let videoId = null;
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname === 'youtu.be') {
      videoId = urlObj.pathname.slice(1);
    } else if (urlObj.hostname.includes('youtube.com')) {
      videoId = urlObj.searchParams.get('v');
    }
  } catch (error) {
    console.error('Invalid URL for YouTube ID extraction:', error);
  }
  return videoId;
};

export async function GET() {
  const { data, error } = await supabase
    .from('featured_videos')
    .select('*');
  if (error) {
    console.error('Error fetching featured videos:', error);
    return NextResponse.json({ error: 'Failed to fetch featured videos' }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function POST(request) {
  const { title, link } = await request.json();
  if (!title || !link) {
    return NextResponse.json({ error: 'Title and link are required' }, { status: 400 });
  }

  const videoId = getYouTubeVideoId(link);
  if (!videoId) {
    return NextResponse.json({ error: 'Invalid YouTube link provided' }, { status: 400 });
  }
  const thumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

  const { data, error } = await supabase
    .from('featured_videos')
    .insert([{ title, link, thumbnail }])
    .select()
    .single();
  if (error) {
    console.error('Error creating featured video:', error);
    return NextResponse.json({ error: 'Failed to create featured video' }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function PUT(request) {
  const { id, title, link } = await request.json();
  if (!id || !title || !link) {
    return NextResponse.json({ error: 'ID, title, and link are required' }, { status: 400 });
  }

  const videoId = getYouTubeVideoId(link);
  if (!videoId) {
    return NextResponse.json({ error: 'Invalid YouTube link provided' }, { status: 400 });
  }
  const thumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

  const { data, error } = await supabase
    .from('featured_videos')
    .update({ title, link, thumbnail })
    .eq('id', id)
    .select()
    .single();
  if (error) {
    console.error('Error updating featured video:', error);
    return NextResponse.json({ error: 'Failed to update featured video' }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function DELETE(request) {
  const { id } = await request.json();
  if (!id) {
    return NextResponse.json({ error: 'Missing video ID' }, { status: 400 });
  }
  const { error } = await supabase
    .from('featured_videos')
    .delete()
    .eq('id', id);
  if (error) {
    console.error('Error deleting featured video:', error);
    return NextResponse.json({ error: 'Failed to delete featured video' }, { status: 500 });
  }
  return new Response(null, { status: 204 });
}
