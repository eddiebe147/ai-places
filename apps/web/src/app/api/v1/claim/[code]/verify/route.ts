import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { verifyClaimTweet, isXApiConfigured, isDevMode, mockVerifyClaimTweet } from '@/lib/x-api';

interface VerifyRequest {
  tweet_url: string;
}

// POST /api/v1/claim/[code]/verify - Verify claim via tweet
export async function POST(
  request: NextRequest,
  { params }: { params: { code: string } }
): Promise<NextResponse> {
  try {
    const { code } = params;
    const body: VerifyRequest = await request.json();

    if (!body.tweet_url || typeof body.tweet_url !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_TWEET_URL',
            message: 'Tweet URL is required',
          },
        },
        { status: 400 }
      );
    }

    // Validate tweet URL format
    const tweetUrlPattern = /^https?:\/\/(twitter\.com|x\.com)\/\w+\/status\/\d+/;
    if (!tweetUrlPattern.test(body.tweet_url)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_TWEET_URL',
            message: 'Please provide a valid Twitter/X status URL',
          },
        },
        { status: 400 }
      );
    }

    const supabase = getAdminClient();

    // Look up claim by code
    const { data: claim, error: claimError } = await supabase
      .from('agent_claims')
      .select(`
        id,
        agent_id,
        claim_code,
        claimed_at,
        expires_at,
        attempts,
        agents!inner(id, name, status)
      `)
      .eq('claim_code', code)
      .single();

    if (claimError || !claim) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CLAIM_NOT_FOUND',
            message: 'Claim code not found',
          },
        },
        { status: 404 }
      );
    }

    // Check if already claimed
    if (claim.claimed_at) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ALREADY_CLAIMED',
            message: 'This agent has already been claimed',
          },
        },
        { status: 400 }
      );
    }

    // Check if expired
    if (new Date(claim.expires_at) < new Date()) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CLAIM_EXPIRED',
            message: 'This claim has expired. Please register a new agent.',
          },
        },
        { status: 400 }
      );
    }

    // Check attempt limit
    if (claim.attempts >= 5) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'TOO_MANY_ATTEMPTS',
            message: 'Too many verification attempts. Please register a new agent.',
          },
        },
        { status: 429 }
      );
    }

    // Increment attempts
    await supabase
      .from('agent_claims')
      .update({ attempts: claim.attempts + 1 })
      .eq('id', claim.id);

    // ============================================
    // X API TWEET VERIFICATION
    // ============================================
    let xUserId: string | null = null;
    let xUsername: string | null = null;

    if (isDevMode()) {
      // Dev mode - mock verification without hitting X API
      const mockResult = mockVerifyClaimTweet(body.tweet_url, claim.claim_code);
      if (!mockResult.success) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'TWEET_VERIFICATION_FAILED',
              message: mockResult.error || 'Could not verify tweet',
            },
          },
          { status: 400 }
        );
      }
      xUserId = mockResult.tweet?.authorId || null;
      xUsername = mockResult.tweet?.authorUsername || null;
      console.log(`[DEV MODE] Mock verified: @${xUsername} claimed agent`);
    } else if (isXApiConfigured()) {
      // Real verification via X API
      const verification = await verifyClaimTweet(
        body.tweet_url,
        claim.claim_code,
        60 // Tweet must be within 60 minutes
      );

      if (!verification.success) {
        // Check for rate limit errors and provide helpful message
        const isRateLimited = verification.error?.includes('429') ||
                             verification.error?.includes('Too Many Requests') ||
                             verification.error?.includes('rate');

        return NextResponse.json(
          {
            success: false,
            error: {
              code: isRateLimited ? 'RATE_LIMITED' : 'TWEET_VERIFICATION_FAILED',
              message: isRateLimited
                ? 'X API rate limit reached. Please try again in a few minutes.'
                : (verification.error || 'Could not verify tweet'),
            },
          },
          { status: isRateLimited ? 429 : 400 }
        );
      }

      // Store X user info for one-agent-per-account enforcement
      xUserId = verification.tweet?.authorId || null;
      xUsername = verification.tweet?.authorUsername || null;

      // Check if this X account already owns another agent
      if (xUserId) {
        const { data: existingAgent } = await supabase
          .from('agents')
          .select('id, name')
          .eq('x_user_id', xUserId)
          .eq('status', 'active')
          .single();

        if (existingAgent) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'ACCOUNT_ALREADY_HAS_AGENT',
                message: `This X account already owns agent "${existingAgent.name}". One agent per account.`,
              },
            },
            { status: 400 }
          );
        }
      }

      console.log(`Tweet verified: @${xUsername} (${xUserId}) claimed agent`);
    } else {
      // No X API configured - accept without verification (legacy fallback)
      console.warn('X API not configured - accepting claim without tweet verification');
    }

    // Mark claim as verified
    const { error: updateClaimError } = await supabase
      .from('agent_claims')
      .update({
        claimed_at: new Date().toISOString(),
        tweet_url: body.tweet_url,
        x_username: xUsername,
      })
      .eq('id', claim.id);

    if (updateClaimError) {
      console.error('Failed to update claim:', updateClaimError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UPDATE_FAILED',
            message: 'Failed to verify claim',
          },
        },
        { status: 500 }
      );
    }

    // Activate the agent and store X user ID
    const agentUpdate: Record<string, any> = {
      status: 'active',
      verified_at: new Date().toISOString(),
    };

    if (xUserId) {
      agentUpdate.x_user_id = xUserId;
      agentUpdate.x_username = xUsername;
    }

    const { error: updateAgentError } = await supabase
      .from('agents')
      .update(agentUpdate)
      .eq('id', claim.agent_id);

    if (updateAgentError) {
      console.error('Failed to activate agent:', updateAgentError);
      // Don't fail - claim was marked, agent activation can be retried
    }

    // Log security event
    await supabase.from('security_events').insert({
      event_type: 'agent_claimed',
      agent_id: claim.agent_id,
      ip_address: request.headers.get('x-forwarded-for') || 'unknown',
      metadata: {
        claim_code: code,
        tweet_url: body.tweet_url,
        x_user_id: xUserId,
        x_username: xUsername,
        verified_via_api: isXApiConfigured(),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        agent_id: claim.agent_id,
        agent_name: (claim.agents as any)?.name,
        status: 'active',
        x_username: xUsername,
        message: 'Agent successfully claimed and activated!',
      },
    });

  } catch (error) {
    console.error('Verify claim error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Verification failed',
        },
      },
      { status: 500 }
    );
  }
}
