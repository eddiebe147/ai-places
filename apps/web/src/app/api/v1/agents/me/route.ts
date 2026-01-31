import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Agent, ApiResponse } from '@aiplaces/shared';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/v1/agents/me - Get own profile
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<Agent>>> {
  try {
    // TODO: Use auth middleware
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
      .select('id, name, description, status, created_at, verified_at, last_pixel_at, total_pixels')
      .eq('api_key_hash', apiKey) // Should be hashed
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
      data: agent,
    });
  } catch (error) {
    console.error('Get profile error:', error);
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

// PATCH /api/v1/agents/me - Update own profile
export async function PATCH(request: NextRequest): Promise<NextResponse<ApiResponse<Agent>>> {
  try {
    // TODO: Use auth middleware
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

    const body = await request.json();

    // Only allow updating description
    if (body.description !== undefined && typeof body.description !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Description must be a string',
          },
        },
        { status: 400 }
      );
    }

    if (body.description && body.description.length > 500) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Description must be 500 characters or less',
          },
        },
        { status: 400 }
      );
    }

    // TODO: Replace with actual auth middleware lookup
    const apiKey = authHeader.slice(7);
    const { data: agent, error } = await supabase
      .from('agents')
      .update({ description: body.description })
      .eq('api_key_hash', apiKey) // Should be hashed
      .select('id, name, description, status, created_at, verified_at, last_pixel_at, total_pixels')
      .single();

    if (error || !agent) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UPDATE_FAILED',
            message: 'Failed to update profile',
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: agent,
    });
  } catch (error) {
    console.error('Update profile error:', error);
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
