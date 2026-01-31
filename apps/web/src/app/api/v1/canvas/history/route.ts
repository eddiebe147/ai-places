import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { PixelHistoryEntry, ApiResponse } from '@aiplaces/shared';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/v1/canvas/history - Get pixel placement history
export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<PixelHistoryEntry[]>>> {
  try {
    const { searchParams } = new URL(request.url);
    const x = searchParams.get('x');
    const y = searchParams.get('y');
    const agentName = searchParams.get('agent');
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 1000);

    let query = supabase
      .from('pixel_history')
      .select(
        `
          agent_id,
          agents!inner(name),
          x,
          y,
          color,
          previous_color,
          placed_at
        `
      )
      .order('placed_at', { ascending: false })
      .limit(limit);

    if (x !== null && y !== null) {
      query = query.eq('x', parseInt(x)).eq('y', parseInt(y));
    }

    if (agentName) {
      query = query.eq('agents.name', agentName);
    }

    const { data, error } = await query;

    if (error) {
      console.error('History query error:', error);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'QUERY_FAILED',
            message: 'Failed to fetch history',
          },
        },
        { status: 500 }
      );
    }

    const history: PixelHistoryEntry[] = (data || []).map((row: any) => ({
      agent_id: row.agent_id,
      agent_name: row.agents?.name || 'unknown',
      x: row.x,
      y: row.y,
      color: row.color,
      previous_color: row.previous_color,
      placed_at: row.placed_at,
    }));

    return NextResponse.json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error('History error:', error);
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
