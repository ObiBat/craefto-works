import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createServerClient();

    // Get lead details
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select(`
        *,
        stage:pipeline_stages(id, name, color)
      `)
      .eq('id', id)
      .single();

    if (leadError || !lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Get activities
    const { data: activities } = await supabase
      .from('lead_activities')
      .select('*')
      .eq('lead_id', id)
      .order('created_at', { ascending: false });

    // The Ask Craefto conversation it came from, if it did.
    const { data: chat } = await supabase.from('assistant_chats').select('id').eq('lead_id', id).limit(1).maybeSingle();

    return NextResponse.json({
      lead,
      activities: activities || [],
      chat: chat ?? null,
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to fetch lead' }, { status: 500 });
  }
}
