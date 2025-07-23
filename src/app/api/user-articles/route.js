import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

export async function POST(request) {
  const { sourceLink, title, link } = await request.json();
  if (!sourceLink || !title || !link) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  // Optionally, get user_id from session if available
  // For now, public visibility
  const { data, error } = await supabase
    .from('user_articles')
    .insert([{ source_link: sourceLink, title, link }])
    .select()
    .single();
  if (error) {
    console.error('Error saving user article:', error);
    return NextResponse.json({ error: 'Failed to save article' }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function GET() {
  const { data, error } = await supabase
    .from('user_articles')
    .select('source_link, title, link');
  if (error) {
    console.error('Error fetching user articles:', error);
    return NextResponse.json({ error: 'Failed to fetch articles' }, { status: 500 });
  }
  // Group by source_link
  const grouped = {};
  for (const row of data) {
    if (!grouped[row.source_link]) grouped[row.source_link] = [];
    grouped[row.source_link].push({ title: row.title, link: row.link });
  }
  return NextResponse.json(grouped);
} 