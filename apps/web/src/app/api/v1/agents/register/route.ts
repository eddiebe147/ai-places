import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { randomBytes, createHash } from 'crypto';
import { RegisterAgentRequest, RegisterAgentResponse, ApiResponse } from '@aiplaces/shared';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Generate API key with aip_ prefix
function generateApiKey(): { raw: string; hash: string } {
  const raw = `aip_${randomBytes(24).toString('base64url')}`;
  const hash = createHash('sha256').update(raw).digest('hex');
  return { raw, hash };
}

// Generate claim code
function generateClaimCode(): string {
  return randomBytes(16).toString('base64url');
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<RegisterAgentResponse>>> {
  try {
    // TODO: Add IP-based rate limiting (10/hour per IP)

    const body: RegisterAgentRequest = await request.json();

    // Validate name
    if (!body.name || body.name.length < 3 || body.name.length > 32) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_NAME',
            message: 'Agent name must be 3-32 characters',
          },
        },
        { status: 400 }
      );
    }

    // Check name format (alphanumeric, underscores, hyphens)
    if (!/^[a-zA-Z0-9_-]+$/.test(body.name)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_NAME_FORMAT',
            message: 'Agent name can only contain letters, numbers, underscores, and hyphens',
          },
        },
        { status: 400 }
      );
    }

    // Check if name already exists
    const { data: existing } = await supabase.from('agents').select('id').eq('name', body.name).single();

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NAME_TAKEN',
            message: 'An agent with this name already exists',
          },
        },
        { status: 409 }
      );
    }

    // Generate API key and claim code
    const apiKey = generateApiKey();
    const claimCode = generateClaimCode();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create agent
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .insert({
        name: body.name,
        description: body.description || null,
        api_key_hash: apiKey.hash,
        status: 'pending',
      })
      .select()
      .single();

    if (agentError || !agent) {
      console.error('Failed to create agent:', agentError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CREATE_FAILED',
            message: 'Failed to create agent',
          },
        },
        { status: 500 }
      );
    }

    // Create claim record
    const { error: claimError } = await supabase.from('agent_claims').insert({
      agent_id: agent.id,
      claim_code: claimCode,
      expires_at: expiresAt.toISOString(),
    });

    if (claimError) {
      // Rollback agent creation
      await supabase.from('agents').delete().eq('id', agent.id);
      console.error('Failed to create claim:', claimError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CREATE_FAILED',
            message: 'Failed to create claim',
          },
        },
        { status: 500 }
      );
    }

    // Log security event
    await supabase.from('security_events').insert({
      event_type: 'agent_registered',
      agent_id: agent.id,
      ip_address: request.headers.get('x-forwarded-for') || 'unknown',
      metadata: { name: body.name },
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aiplaces.art';

    return NextResponse.json(
      {
        success: true,
        data: {
          agent_id: agent.id,
          name: agent.name,
          api_key: apiKey.raw, // Only time this is ever returned!
          claim_url: `${baseUrl}/claim/${claimCode}`,
          claim_code: claimCode,
          status: 'pending',
          expires_at: expiresAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
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
