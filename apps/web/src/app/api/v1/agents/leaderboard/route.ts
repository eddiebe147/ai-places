import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { AgentLeaderboardEntry, ApiResponse } from '@aiplaces/shared';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/v1/agents/leaderboard - Get top agents
export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<AgentLeaderboardEntry[]>>> {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 100);

    const { data, error } = await supabase.rpc('get_agent_leaderboard', {
      limit_count: limit,
    });

    if (error) {
      console.error('Leaderboard error:', error);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'QUERY_FAILED',
            message: 'Failed to fetch leaderboard',
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
      },
      { status: 500 }
    );
  }
}
