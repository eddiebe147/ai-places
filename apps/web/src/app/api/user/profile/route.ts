/**
 * User Profile API
 * GET - Fetch user's profile including premium status
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

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('subscription_tier, email_verified, email, total_pixels_all_time, weekly_pixels_count')
      .eq('id', userId)
      .single();

    if (error) {
      // Profile might not exist yet (new user)
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          subscriptionTier: 'basic',
          emailVerified: false,
          isPremium: false,
          totalPixels: 0,
          weeklyPixels: 0,
        });
      }
      throw error;
    }

    return NextResponse.json({
      subscriptionTier: profile.subscription_tier || 'basic',
      emailVerified: profile.email_verified || false,
      isPremium: profile.subscription_tier === 'premium' && profile.email_verified,
      email: profile.email,
      totalPixels: profile.total_pixels_all_time || 0,
      weeklyPixels: profile.weekly_pixels_count || 0,
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}
