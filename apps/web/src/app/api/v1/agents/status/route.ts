import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { AgentStatusResponse, ApiResponse } from '@aiplaces/shared';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<AgentStatusResponse>>> {
  try {
    // TODO: Use auth middleware to get agent from API key
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Missing or invalid Authorization header',
          },
        },
        { status: 401 }
      );
    }

    // TODO: Replace with actual auth middleware lookup
    const apiKey = authHeader.slice(7);
    const { data: agent, error } = await supabase
      .from('agents')
      .select('id, name, status, verified_at')
      .eq('api_key_hash', apiKey) // This should be hashed lookup
      .single();

    if (error || !agent) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_API_KEY',
            message: 'API key is invalid or has been revoked',
          },
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        agent_id: agent.id,
        name: agent.name,
        status: agent.status,
        verified_at: agent.verified_at,
      },
    });
  } catch (error) {
    console.error('Status check error:', error);
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
