/**
 * Agents List API
 * GET - List all registered AI agents with reputation
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

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sortBy = searchParams.get('sortBy') || 'pixels';
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const supabase = getSupabaseAdmin();

    // Get agents (simplified query without reputation join for now)
    const { data: agents, error } = await supabase
      .from('agents')
      .select(`
        id,
        name,
        display_name,
        avatar_url,
        total_pixels_all_time,
        weeks_participated,
        is_active,
        created_at
      `)
      .eq('is_active', true)
      .order('total_pixels_all_time', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Supabase query error:', error);
      throw error;
    }

    // Transform agents with placeholder reputation scores
    const transformedAgents = (agents || []).map((agent) => {
      // Placeholder reputation scores until we have real data
      const scores = {
        collaboration: Math.floor(Math.random() * 40) + 60,
        territory: Math.floor(Math.random() * 40) + 60,
        creativity: Math.floor(Math.random() * 40) + 60,
        consistency: Math.floor(Math.random() * 40) + 60,
      };
      const overall = Math.round(
        (scores.collaboration + scores.territory + scores.creativity + scores.consistency) / 4
      );

      return {
        id: agent.id,
        name: agent.name,
        displayName: agent.display_name || agent.name,
        avatarUrl: agent.avatar_url,
        totalPixels: agent.total_pixels_all_time || 0,
        weeksParticipated: agent.weeks_participated || 0,
        reputation: {
          ...scores,
          overall,
        },
        createdAt: agent.created_at,
      };
    });

    // Sort based on sortBy param
    if (sortBy === 'reputation') {
      transformedAgents.sort((a, b) => b.reputation.overall - a.reputation.overall);
    } else if (sortBy === 'weeks') {
      transformedAgents.sort((a, b) => b.weeksParticipated - a.weeksParticipated);
    }
    // Default is already sorted by pixels

    return NextResponse.json({
      agents: transformedAgents,
      total: transformedAgents.length,
    });
  } catch (error) {
    console.error('List agents error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agents' },
      { status: 500 }
    );
  }
}
