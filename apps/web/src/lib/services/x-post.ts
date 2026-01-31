/**
 * X (Twitter) Posting Service
 * Handles automated posting of weekly canvas archives to X
 */

import { TwitterApi } from 'twitter-api-v2';
import { createClient } from '@supabase/supabase-js';

// Types for canvas archive
interface CanvasArchive {
  id: string;
  week_number: number;
  year: number;
  image_url: string | null;
  thumbnail_url: string | null;
  total_pixels_placed: number;
  unique_contributors: number;
  metadata: {
    top_contributors?: Array<{ userId: string; score: number }>;
    top_factions?: Array<{ factionId: string; score: number }>;
  };
}

interface SocialPostRecord {
  id: string;
  archive_id: string;
  platform: string;
  post_id: string | null;
  post_url: string | null;
  content: string;
  status: 'success' | 'failed' | 'pending';
  error_message: string | null;
  retry_count: number;
}

interface PostResult {
  success: boolean;
  postId?: string;
  postUrl?: string;
  error?: string;
}

// Singleton X client
let xClient: TwitterApi | null = null;

/**
 * Get or create the X API client
 */
export function getXClient(): TwitterApi {
  if (!xClient) {
    const apiKey = process.env.X_API_KEY;
    const apiSecret = process.env.X_API_SECRET;
    const accessToken = process.env.X_ACCESS_TOKEN;
    const accessSecret = process.env.X_ACCESS_SECRET;

    if (!apiKey || !apiSecret || !accessToken || !accessSecret) {
      throw new Error('X API credentials not configured');
    }

    xClient = new TwitterApi({
      appKey: apiKey,
      appSecret: apiSecret,
      accessToken: accessToken,
      accessSecret: accessSecret,
    });
  }

  return xClient;
}

/**
 * Check if X auto-posting is enabled
 */
export function isXPostingEnabled(): boolean {
  const enabled = process.env.X_AUTO_POST_ENABLED;
  return enabled === 'true' || enabled === '1';
}

/**
 * Get Supabase admin client for service operations
 */
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

/**
 * Generate engaging tweet copy for a weekly archive
 */
export function generatePostCopy(archive: CanvasArchive): string {
  const { week_number, year, total_pixels_placed, unique_contributors, metadata } = archive;

  // Format numbers with commas
  const pixelsFormatted = total_pixels_placed.toLocaleString();
  const contributorsFormatted = unique_contributors.toLocaleString();

  // Build base tweet
  const lines: string[] = [];

  // Headline with week info
  lines.push(`Week ${week_number} of ${year} is complete!`);
  lines.push('');

  // Stats
  lines.push(`${pixelsFormatted} pixels placed by ${contributorsFormatted} contributors`);

  // Top faction if available
  if (metadata.top_factions && metadata.top_factions.length > 0) {
    const topFaction = metadata.top_factions[0];
    lines.push(`Top faction: ${topFaction.factionId}`);
  }

  lines.push('');
  lines.push('A new canvas awaits...');
  lines.push('');

  // Hashtags and link
  lines.push('#AIplaces #pixelart #r/place');
  lines.push('');
  lines.push('https://aiplaces.art');

  const tweet = lines.join('\n');

  // Ensure we're under 280 characters (X limit)
  if (tweet.length > 280) {
    // Simplified version if too long
    return [
      `Week ${week_number}/${year} complete!`,
      `${pixelsFormatted} pixels | ${contributorsFormatted} contributors`,
      '',
      '#AIplaces #pixelart',
      'https://aiplaces.art',
    ].join('\n');
  }

  return tweet;
}

/**
 * Fetch image from URL and return as Buffer
 */
async function fetchImageAsBuffer(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Post content to X with optional media
 */
export async function postToX(
  content: string,
  imageUrl?: string | null
): Promise<PostResult> {
  try {
    const client = getXClient();
    const rwClient = client.readWrite;

    let mediaId: string | undefined;

    // Upload media if image URL provided
    if (imageUrl) {
      try {
        console.log('[X-POST] Fetching image from:', imageUrl);
        const imageBuffer = await fetchImageAsBuffer(imageUrl);
        console.log('[X-POST] Image fetched, size:', imageBuffer.length);

        // Upload media to X
        mediaId = await client.v1.uploadMedia(imageBuffer, {
          mimeType: 'image/png',
        });
        console.log('[X-POST] Media uploaded, ID:', mediaId);
      } catch (mediaError) {
        console.error('[X-POST] Failed to upload media:', mediaError);
        // Continue without media rather than failing entirely
      }
    }

    // Create tweet
    let tweet;
    if (mediaId) {
      tweet = await rwClient.v2.tweet({
        text: content,
        media: { media_ids: [mediaId] as [string] },
      });
    } else {
      tweet = await rwClient.v2.tweet(content);
    }

    const postId = tweet.data.id;
    // Construct post URL (X username would be needed for exact URL, using generic format)
    const postUrl = `https://x.com/i/web/status/${postId}`;

    console.log('[X-POST] Tweet posted successfully:', postId);

    return {
      success: true,
      postId,
      postUrl,
    };
  } catch (error) {
    console.error('[X-POST] Failed to post to X:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error posting to X',
    };
  }
}

/**
 * Check if a successful post already exists for this archive
 */
async function hasExistingSuccessfulPost(archiveId: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('social_posts')
    .select('id')
    .eq('archive_id', archiveId)
    .eq('platform', 'x')
    .eq('status', 'success')
    .limit(1);

  if (error) {
    console.error('[X-POST] Error checking existing post:', error);
    return false;
  }

  return data && data.length > 0;
}

/**
 * Record a social post attempt in the database
 */
async function recordSocialPost(
  archiveId: string,
  content: string,
  result: PostResult
): Promise<void> {
  const supabase = getSupabaseAdmin();

  const record: Partial<SocialPostRecord> = {
    archive_id: archiveId,
    platform: 'x',
    content,
    status: result.success ? 'success' : 'failed',
    post_id: result.postId || null,
    post_url: result.postUrl || null,
    error_message: result.error || null,
  };

  const { error } = await supabase.from('social_posts').insert(record);

  if (error) {
    console.error('[X-POST] Failed to record social post:', error);
  }
}

/**
 * Main entry point: Post a weekly archive to X
 * Returns result of the posting attempt
 */
export async function postWeeklyArchiveToX(
  archive: CanvasArchive
): Promise<PostResult> {
  console.log(`[X-POST] Starting post for week ${archive.week_number}/${archive.year}`);

  // Check if posting is enabled
  if (!isXPostingEnabled()) {
    console.log('[X-POST] Auto-posting is disabled');
    return {
      success: false,
      error: 'X auto-posting is disabled',
    };
  }

  // Check for existing successful post
  const hasExisting = await hasExistingSuccessfulPost(archive.id);
  if (hasExisting) {
    console.log('[X-POST] Successful post already exists for this archive');
    return {
      success: false,
      error: 'Post already exists for this archive',
    };
  }

  // Generate tweet content
  const content = generatePostCopy(archive);
  console.log('[X-POST] Generated content:', content);

  // Post to X
  const result = await postToX(content, archive.image_url);

  // Record the attempt
  await recordSocialPost(archive.id, content, result);

  if (result.success) {
    console.log(`[X-POST] Successfully posted to X: ${result.postUrl}`);
  } else {
    console.error(`[X-POST] Failed to post to X: ${result.error}`);
  }

  return result;
}
