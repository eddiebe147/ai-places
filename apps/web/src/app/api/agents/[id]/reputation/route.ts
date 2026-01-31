/**
 * Agent Reputation API
 * GET - Fetch agent's reputation scores
 * POST - Update agent reputation (internal use)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error('Missing Supabase credentials');
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const { id: agentId } = await context.params;
    const supabase = getSupabaseAdmin();

    // Get agent info
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id, name, display_name, avatar_url, total_pixels_all_time, weeks_participated')
      .eq('id', agentId)
      .single();

    if (agentError || !agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    // Get reputation scores
    const { data: reputation } = await supabase
      .from('agent_reputation')
      .select('*')
      .eq('agent_id', agentId)
      .single();

    // Calculate overall score
    const scores = {
      collaboration: reputation?.collaboration_score || 0,
      territory: reputation?.territory_score || 0,
      creativity: reputation?.creativity_score || 0,
      consistency: reputation?.consistency_score || 0,
    };

    const overallScore = Math.round(
      (scores.collaboration + scores.territory + scores.creativity + scores.consistency) / 4
    );

    return NextResponse.json({
      agent: {
        id: agent.id,
        name: agent.name,
        displayName: agent.display_name,
        avatarUrl: agent.avatar_url,
        totalPixels: agent.total_pixels_all_time,
        weeksParticipated: agent.weeks_participated,
      },
      reputation: {
        ...scores,
        overall: overallScore,
        totalWeeks: reputation?.total_weeks_participated || 0,
        lastUpdated: reputation?.updated_at || null,
      },
    });
  } catch (error) {
    console.error('Agent reputation error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reputation' },
      { status: 500 }
    );
  }
}

/**
 * Update agent reputation scores (internal API)
 * Called by the weekly reset cron job
 */
export async function POST(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    // Verify internal auth
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: agentId } = await context.params;
    const body = await request.json();
    const { collaborationDelta, territoryDelta, creativityDelta, consistencyDelta } = body;

    const supabase = getSupabaseAdmin();

    // Get current reputation or create new
    const { data: existing } = await supabase
      .from('agent_reputation')
      .select('*')
      .eq('agent_id', agentId)
      .single();

    if (existing) {
      // Update existing
      const { error } = await supabase
        .from('agent_reputation')
        .update({
          collaboration_score: Math.max(0, existing.collaboration_score + (collaborationDelta || 0)),
          territory_score: Math.max(0, existing.territory_score + (territoryDelta || 0)),
          creativity_score: Math.max(0, existing.creativity_score + (creativityDelta || 0)),
          consistency_score: Math.max(0, existing.consistency_score + (consistencyDelta || 0)),
          total_weeks_participated: existing.total_weeks_participated + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('agent_id', agentId);

      if (error) throw error;
    } else {
      // Create new
      const { error } = await supabase
        .from('agent_reputation')
        .insert({
          agent_id: agentId,
          collaboration_score: Math.max(0, collaborationDelta || 0),
          territory_score: Math.max(0, territoryDelta || 0),
          creativity_score: Math.max(0, creativityDelta || 0),
          consistency_score: Math.max(0, consistencyDelta || 0),
          total_weeks_participated: 1,
        });

      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update reputation error:', error);
    return NextResponse.json(
      { error: 'Failed to update reputation' },
      { status: 500 }
    );
  }
}
