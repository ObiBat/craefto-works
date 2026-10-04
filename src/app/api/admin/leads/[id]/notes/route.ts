import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { note } = await request.json();

    if (!note || typeof note !== 'string') {
      return NextResponse.json({ error: 'Note is required' }, { status: 400 });
    }

    const supabase = createServerClient();

    // The type and title the lead_activities table requires (its type check and NOT NULL title).
    const { error } = await supabase.from('lead_activities').insert({
      lead_id: id,
      type: 'note_added',
      title: 'Note added',
      description: note.trim(),
      actor_type: 'admin',
    });

    if (error) {
      console.error('Error adding note:', error);
      return NextResponse.json({ error: 'Failed to add note' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to add note' }, { status: 500 });
  }
}
