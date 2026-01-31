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

    // Get agents - using actual column names from schema:
    // id, name, description, api_key_hash, status, ban_reason,
    // x_user_id, x_username, created_at, verified_at, last_pixel_at, total_pixels
    const { data: agents, error } = await supabase
      .from('agents')
      .select(`
        id,
        name,
        description,
        x_username,
        total_pixels,
        status,
        created_at,
        verified_at
      `)
      .eq('status', 'active')
      .order('total_pixels', { ascending: false })
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
        displayName: agent.x_username || agent.name,
        avatarUrl: null, // No avatar_url column in schema yet
        totalPixels: agent.total_pixels || 0,
        weeksParticipated: 0, // No weeks_participated column in schema yet
        reputation: {
          ...scores,
          overall,
        },
        createdAt: agent.created_at,
      };
    });

    // Sort based on sortBy param (pixels sort is already done in query)
    if (sortBy === 'reputation') {
      transformedAgents.sort((a, b) => b.reputation.overall - a.reputation.overall);
    }
    // 'weeks' sort would just be 0 for all since we don't track that yet

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
