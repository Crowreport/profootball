import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

export async function POST(request) {
  const { teamName, section, content } = await request.json();

  if (!teamName || !section || !content) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('manual_content')
    .upsert({ team_name: teamName, section, content }, { onConflict: ['team_name', 'section'] });

  if (error) {
    console.error('Error saving content:', error);
    return NextResponse.json({ error: 'Failed to save content' }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const teamName = searchParams.get('teamName');

  if (!teamName) {
    return NextResponse.json({ error: 'Missing teamName parameter' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('manual_content')
    .select('section, content')
    .eq('team_name', teamName);

  if (error) {
    console.error('Error fetching content:', error);
    return NextResponse.json({ error: 'Failed to fetch content' }, { status: 500 });
  }

  const contentMap = data.reduce((acc, { section, content }) => {
    acc[section] = content;
    return acc;
  }, {});

  return NextResponse.json(contentMap);
}
