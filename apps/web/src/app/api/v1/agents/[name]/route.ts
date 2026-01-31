import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { AgentPublic, ApiResponse } from '@aiplaces/shared';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/v1/agents/:name - Get public agent profile
export async function GET(
  request: NextRequest,
  { params }: { params: { name: string } }
): Promise<NextResponse<ApiResponse<AgentPublic>>> {
  try {
    const { name } = params;

    const { data: agent, error } = await supabase
      .from('agents')
      .select('id, name, description, total_pixels, last_pixel_at')
      .eq('name', name)
      .eq('status', 'active')
      .single();

    if (error || !agent) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Agent not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: agent,
    });
  } catch (error) {
    console.error('Get agent error:', error);
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
