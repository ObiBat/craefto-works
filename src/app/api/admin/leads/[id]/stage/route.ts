import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { stageId } = await request.json();

    if (!stageId) {
      return NextResponse.json({ error: 'Stage ID required' }, { status: 400 });
    }

    const supabase = createServerClient();

    // Get stage name for activity log
    const { data: stage } = await supabase
      .from('pipeline_stages')
      .select('name')
      .eq('id', stageId)
      .single();

    // Update lead stage
    const { error: updateError } = await supabase
      .from('leads')
      .update({ stage_id: stageId, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (updateError) {
      console.error('Error updating stage:', updateError);
      return NextResponse.json({ error: 'Failed to update stage' }, { status: 500 });
    }

    // The type and title the lead_activities table requires (its type check and NOT NULL title).
    const { error: logError } = await supabase.from('lead_activities').insert({
      lead_id: id,
      type: 'stage_changed',
      title: `Moved to ${stage?.name || 'a new stage'}`,
      actor_type: 'admin',
    });
    if (logError) console.error('Error logging stage change:', logError);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to update stage' }, { status: 500 });
  }
}
