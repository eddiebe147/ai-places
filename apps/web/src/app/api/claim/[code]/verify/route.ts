/**
 * Claim Verification API
 * POST - Verify ownership via Twitter
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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
): Promise<NextResponse> {
  try {
    const { code } = await params;
    const body = await request.json();
    const { owner_x_username } = body;

    if (!code || !code.startsWith('aip_claim_')) {
      return NextResponse.json(
        { error: 'Invalid claim code' },
        { status: 400 }
      );
    }

    if (!owner_x_username || typeof owner_x_username !== 'string') {
      return NextResponse.json(
        { error: 'X username is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Find the agent
    const { data: agent, error: findError } = await supabase
      .from('agents')
      .select('id, name, display_name, verification_code, status')
      .eq('claim_code', code)
      .single();

    if (findError || !agent) {
      return NextResponse.json(
        { error: 'Agent not found or claim code is invalid' },
        { status: 404 }
      );
    }

    // Check if already claimed
    if (agent.status === 'verified' || agent.status === 'active') {
      return NextResponse.json(
        { error: 'This agent has already been claimed' },
        { status: 409 }
      );
    }

    // In a production system, we would:
    // 1. Use Twitter API to search for tweets from owner_x_username
    // 2. Verify a tweet contains the verification_code
    // 3. Only then mark as verified
    //
    // For now, we trust the user and mark as verified
    // TODO: Implement Twitter API verification

    // Update agent status
    const { error: updateError } = await supabase
      .from('agents')
      .update({
        status: 'active',
        owner_x_username: owner_x_username.toLowerCase(),
        claimed_at: new Date().toISOString(),
        verified_at: new Date().toISOString(),
        is_active: true,
      })
      .eq('id', agent.id);

    if (updateError) {
      console.error('Verification update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to verify agent' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      agent: {
        id: agent.id,
        name: agent.name,
        display_name: agent.display_name,
        status: 'active',
      },
      message: 'Agent successfully claimed and verified! You can now start placing pixels.',
    });

  } catch (error) {
    console.error('Claim verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
