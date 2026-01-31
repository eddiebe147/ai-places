/**
 * X (Twitter) API v2 Client for AIplaces.art
 *
 * Used to verify tweet-based agent claims.
 * Requires X_BEARER_TOKEN environment variable.
 */

const X_API_BASE = 'https://api.x.com/2';

interface Tweet {
  id: string;
  text: string;
  author_id: string;
  created_at: string;
}

interface TweetResponse {
  data?: Tweet;
  includes?: {
    users?: Array<{
      id: string;
      username: string;
      name: string;
    }>;
  };
  errors?: Array<{
    detail: string;
    title: string;
    type: string;
  }>;
}

interface VerificationResult {
  success: boolean;
  error?: string;
  tweet?: {
    id: string;
    text: string;
    authorUsername: string;
    authorId: string;
    createdAt: Date;
  };
}

/**
 * Extract tweet ID from various X/Twitter URL formats
 */
export function extractTweetId(url: string): string | null {
  // Formats:
  // https://twitter.com/user/status/1234567890
  // https://x.com/user/status/1234567890
  // https://twitter.com/user/status/1234567890?s=20
  const patterns = [
    /(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/,
    /(?:twitter\.com|x\.com)\/\w+\/statuses\/(\d+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Fetch a tweet by ID from X API v2
 */
async function fetchTweet(tweetId: string): Promise<TweetResponse> {
  const bearerToken = process.env.X_BEARER_TOKEN;

  if (!bearerToken) {
    throw new Error('X_BEARER_TOKEN environment variable not set');
  }

  const params = new URLSearchParams({
    'tweet.fields': 'created_at,author_id,text',
    'expansions': 'author_id',
    'user.fields': 'username,name',
  });

  const response = await fetch(`${X_API_BASE}/tweets/${tweetId}?${params}`, {
    headers: {
      'Authorization': `Bearer ${bearerToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`X API error: ${response.status} - ${JSON.stringify(error)}`);
  }

  return response.json();
}

/**
 * Verify a tweet for agent claim
 *
 * Checks:
 * 1. Tweet exists
 * 2. Tweet contains the claim code
 * 3. Tweet is recent (within maxAgeMinutes)
 */
export async function verifyClaimTweet(
  tweetUrl: string,
  claimCode: string,
  maxAgeMinutes: number = 60
): Promise<VerificationResult> {
  // Extract tweet ID
  const tweetId = extractTweetId(tweetUrl);
  if (!tweetId) {
    return {
      success: false,
      error: 'Invalid tweet URL format',
    };
  }

  try {
    // Fetch tweet from X API
    const response = await fetchTweet(tweetId);

    // Check for errors
    if (response.errors && response.errors.length > 0) {
      return {
        success: false,
        error: response.errors[0].detail || 'Tweet not found',
      };
    }

    if (!response.data) {
      return {
        success: false,
        error: 'Tweet not found',
      };
    }

    const tweet = response.data;

    // Check if tweet contains claim code
    if (!tweet.text.includes(claimCode)) {
      return {
        success: false,
        error: `Tweet does not contain claim code: ${claimCode}`,
      };
    }

    // Check tweet age
    const tweetDate = new Date(tweet.created_at);
    const now = new Date();
    const ageMinutes = (now.getTime() - tweetDate.getTime()) / (1000 * 60);

    if (ageMinutes > maxAgeMinutes) {
      return {
        success: false,
        error: `Tweet is too old (${Math.round(ageMinutes)} minutes). Must be within ${maxAgeMinutes} minutes.`,
      };
    }

    // Get author username
    const author = response.includes?.users?.find(u => u.id === tweet.author_id);
    const authorUsername = author?.username || 'unknown';

    return {
      success: true,
      tweet: {
        id: tweet.id,
        text: tweet.text,
        authorUsername,
        authorId: tweet.author_id,
        createdAt: tweetDate,
      },
    };

  } catch (error) {
    console.error('X API verification error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Verification failed',
    };
  }
}

/**
 * Check if X API is configured
 */
export function isXApiConfigured(): boolean {
  return !!process.env.X_BEARER_TOKEN;
}

/**
 * Check if dev mode is enabled (skips real API calls)
 */
export function isDevMode(): boolean {
  return process.env.X_API_DEV_MODE === 'true';
}

/**
 * Mock verification for development (doesn't hit X API)
 * Extracts username from tweet URL for realistic mock data
 */
export function mockVerifyClaimTweet(
  tweetUrl: string,
  claimCode: string
): VerificationResult {
  const tweetId = extractTweetId(tweetUrl);
  if (!tweetId) {
    return { success: false, error: 'Invalid tweet URL format' };
  }

  // Extract username from URL for mock data
  const usernameMatch = tweetUrl.match(/(?:twitter\.com|x\.com)\/(\w+)\/status/);
  const mockUsername = usernameMatch?.[1] || 'dev_user';

  console.warn(`[DEV MODE] Mock verification for @${mockUsername} - claim code: ${claimCode}`);

  return {
    success: true,
    tweet: {
      id: tweetId,
      text: `Claiming my AI agent on AIplaces.art! ${claimCode}`,
      authorUsername: mockUsername,
      authorId: `mock_${Date.now()}`,
      createdAt: new Date(),
    },
  };
}
