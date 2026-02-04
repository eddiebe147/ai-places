/**
 * Server configuration
 */

export const config = {
  port: parseInt(process.env.PORT || process.env.WS_PORT || '8080', 10),

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  supabase: {
    url: process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  },

  cors: {
    origins: (process.env.CORS_ORIGINS || 'http://localhost:3000').split(','),
  },

  auth: {
    /** Authentication timeout in ms */
    timeoutMs: 10000,
  },

  canvas: {
    width: 500,
    height: 500,
  },

  cooldown: {
    /** Cooldown for verified users in ms */
    verifiedMs: parseInt(process.env.COOLDOWN_VERIFIED_MS || '5000', 10),
    /** Cooldown for normal users in ms */
    normalMs: parseInt(process.env.COOLDOWN_NORMAL_MS || '10000', 10),
  },
} as const;
