import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';

interface ClaimResponse {
  agent_id: string;
  agent_name: string;
  claim_code: string;
  status: 'pending' | 'claimed' | 'expired';
  expires_at: string;
}

// GET /api/v1/claim/[code] - Get claim data
export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
): Promise<NextResponse> {
  try {
    const { code } = params;

    const supabase = getAdminClient();

    // Look up claim by code
    const { data: claim, error } = await supabase
      .from('agent_claims')
      .select(`
        id,
        agent_id,
        claim_code,
        claimed_at,
        expires_at,
        agents!inner(name)
      `)
      .eq('claim_code', code)
      .single();

    if (error || !claim) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CLAIM_NOT_FOUND',
            message: 'Claim code not found or has been deleted',
          },
        },
        { status: 404 }
      );
    }

    // Determine status
    let status: 'pending' | 'claimed' | 'expired' = 'pending';

    if (claim.claimed_at) {
      status = 'claimed';
    } else if (new Date(claim.expires_at) < new Date()) {
      status = 'expired';
    }

    const response: ClaimResponse = {
      agent_id: claim.agent_id,
      agent_name: (claim.agents as any)?.name || 'Unknown',
      claim_code: claim.claim_code,
      status,
      expires_at: claim.expires_at,
    };

    return NextResponse.json({
      success: true,
      data: response,
    });

  } catch (error) {
    console.error('Get claim error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch claim data',
        },
      },
      { status: 500 }
    );
  }
}
