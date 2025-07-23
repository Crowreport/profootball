import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

export async function POST(request) {
  const { sourceLink, title, link } = await request.json();
  if (!sourceLink || !title || !link) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
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
    .select('id, source_link, title, link');
  if (error) {
    console.error('Error fetching user articles:', error);
    return NextResponse.json({ error: 'Failed to fetch articles' }, { status: 500 });
  }
  const grouped = {};
  for (const row of data) {
    if (!grouped[row.source_link]) grouped[row.source_link] = [];
    grouped[row.source_link].push({ id: row.id, title: row.title, link: row.link });
  }
  return NextResponse.json(grouped);
}

export async function PUT(request) {
  const { id, title, link } = await request.json();
  if (!id || !title || !link) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  const { data, error } = await supabase
    .from('user_articles')
    .update({ title, link })
    .eq('id', id)
    .select()
    .single();
  if (error) {
    console.error('Error updating user article:', error);
    return NextResponse.json({ error: 'Failed to update article' }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function DELETE(request) {
  const { id } = await request.json();
  if (!id) {
    return NextResponse.json({ error: 'Missing article ID' }, { status: 400 });
  }
  const { error } = await supabase
    .from('user_articles')
    .delete()
    .eq('id', id);
  if (error) {
    console.error('Error deleting user article:', error);
    return NextResponse.json({ error: 'Failed to delete article' }, { status: 500 });
  }
  return new Response(null, { status: 204 });
} 