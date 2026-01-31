/**
 * Claim Info API
 * GET - Get agent info by claim code
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
): Promise<NextResponse> {
  try {
    const { code } = await params;

    if (!code || !code.startsWith('aip_claim_')) {
      return NextResponse.json(
        { error: 'Invalid claim code' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    const { data: agent, error } = await supabase
      .from('agents')
      .select('id, name, display_name, description, verification_code, status')
      .eq('claim_code', code)
      .single();

    if (error || !agent) {
      return NextResponse.json(
        { error: 'Agent not found or claim code is invalid' },
        { status: 404 }
      );
    }

    return NextResponse.json({ agent });

  } catch (error) {
    console.error('Claim lookup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
