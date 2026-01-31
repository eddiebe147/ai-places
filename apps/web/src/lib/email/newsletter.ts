/**
 * Newsletter Service
 * Handles sending weekly recap newsletters to premium subscribers
 */

import { createClient } from '@supabase/supabase-js';
import { getResend, FROM_EMAIL } from './resend';
import {
  generateNewsletterHTML,
  generateNewsletterText,
  type NewsletterData,
} from './templates/weekly-newsletter';

// Re-export the NewsletterData type for convenience
export type { NewsletterData } from './templates/weekly-newsletter';

interface Subscriber {
  id: string;
  email: string;
  username: string | null;
}

interface SendResult {
  success: boolean;
  sent: number;
  failed: number;
  errors: string[];
}

/**
 * Get Supabase admin client for server-side operations
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
 * Query all premium subscribers with verified emails
 * Only includes users who have:
 * - subscription_tier = 'premium'
 * - email_verified = true
 * - A non-null email address
 */
export async function getPremiumSubscribers(): Promise<Subscriber[]> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('user_profiles')
    .select('id, email, username')
    .eq('subscription_tier', 'premium')
    .eq('email_verified', true)
    .not('email', 'is', null);

  if (error) {
    console.error('[Newsletter] Failed to fetch subscribers:', error);
    throw new Error(`Failed to fetch subscribers: ${error.message}`);
  }

  // Filter out any null emails (shouldn't happen due to query, but TypeScript safety)
  return (data || []).filter(
    (user): user is Subscriber => user.email !== null
  );
}

/**
 * Send emails in batches using Resend's batch API
 * Resend supports up to 100 emails per batch request
 */
async function sendBatch(
  emails: Array<{
    from: string;
    to: string;
    subject: string;
    html: string;
    text: string;
  }>
): Promise<{ sent: number; failed: number; errors: string[] }> {
  const resend = getResend();
  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  try {
    const { data, error } = await resend.batch.send(emails);

    if (error) {
      console.error('[Newsletter] Batch send error:', error);
      failed = emails.length;
      errors.push(error.message);
    } else if (data) {
      // Count successful sends
      // Resend batch returns an array of results
      for (const result of data.data) {
        if (result.id) {
          sent++;
        } else {
          failed++;
        }
      }
    }
  } catch (err) {
    console.error('[Newsletter] Batch send exception:', err);
    failed = emails.length;
    errors.push(err instanceof Error ? err.message : 'Unknown error');
  }

  return { sent, failed, errors };
}

/**
 * Main orchestrator for sending weekly newsletters
 *
 * @param data - Newsletter content data
 * @returns Result with counts of sent/failed emails
 */
export async function sendWeeklyNewsletter(
  data: NewsletterData
): Promise<SendResult> {
  console.log('[Newsletter] Starting weekly newsletter send');

  // Get all premium subscribers
  let subscribers: Subscriber[];
  try {
    subscribers = await getPremiumSubscribers();
  } catch (err) {
    console.error('[Newsletter] Failed to get subscribers:', err);
    return {
      success: false,
      sent: 0,
      failed: 0,
      errors: [err instanceof Error ? err.message : 'Failed to get subscribers'],
    };
  }

  if (subscribers.length === 0) {
    console.log('[Newsletter] No subscribers to send to');
    return {
      success: true,
      sent: 0,
      failed: 0,
      errors: [],
    };
  }

  console.log(`[Newsletter] Sending to ${subscribers.length} subscribers`);

  // Generate email content
  const html = generateNewsletterHTML(data);
  const text = generateNewsletterText(data);
  const subject = `AIplaces Week ${data.weekNumber} Recap - ${data.stats.totalPixels.toLocaleString()} pixels placed!`;

  // Prepare all emails
  const emails = subscribers.map((subscriber) => ({
    from: FROM_EMAIL,
    to: subscriber.email,
    subject,
    html,
    text,
  }));

  // Send in batches of 100 (Resend limit)
  const BATCH_SIZE = 100;
  let totalSent = 0;
  let totalFailed = 0;
  const allErrors: string[] = [];

  for (let i = 0; i < emails.length; i += BATCH_SIZE) {
    const batch = emails.slice(i, i + BATCH_SIZE);
    const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(emails.length / BATCH_SIZE);

    console.log(`[Newsletter] Sending batch ${batchNumber}/${totalBatches} (${batch.length} emails)`);

    const result = await sendBatch(batch);
    totalSent += result.sent;
    totalFailed += result.failed;
    allErrors.push(...result.errors);

    // Small delay between batches to avoid rate limiting
    if (i + BATCH_SIZE < emails.length) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  console.log(`[Newsletter] Complete: ${totalSent} sent, ${totalFailed} failed`);

  return {
    success: totalFailed === 0,
    sent: totalSent,
    failed: totalFailed,
    errors: allErrors,
  };
}
