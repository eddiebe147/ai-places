import { describe, it, expect } from 'vitest';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  CANVAS_SIZE,
  TOTAL_PIXELS,
  BITS_PER_PIXEL,
  CANVAS_DATA_SIZE,
  COLOR_COUNT,
  COOLDOWNS,
  getCooldownMs,
  MIN_ACCOUNT_AGE_DAYS,
  ZOOM,
  WS_CONFIG,
  REDIS_KEYS,
  TIMELAPSE_CONFIG,
} from './canvas';

describe('Canvas Constants', () => {
  describe('Canvas dimensions', () => {
    it('should have correct CANVAS_WIDTH', () => {
      expect(CANVAS_WIDTH).toBe(500);
    });

    it('should have correct CANVAS_HEIGHT', () => {
      expect(CANVAS_HEIGHT).toBe(500);
    });

    it('should have CANVAS_SIZE equal to CANVAS_WIDTH (square canvas)', () => {
      expect(CANVAS_SIZE).toBe(CANVAS_WIDTH);
      expect(CANVAS_SIZE).toBe(500);
    });

    it('should have correct TOTAL_PIXELS', () => {
      expect(TOTAL_PIXELS).toBe(CANVAS_WIDTH * CANVAS_HEIGHT);
      expect(TOTAL_PIXELS).toBe(250000);
    });
  });

  describe('Pixel configuration', () => {
    it('should have correct BITS_PER_PIXEL', () => {
      expect(BITS_PER_PIXEL).toBe(4);
    });

    it('should have correct CANVAS_DATA_SIZE (in bytes)', () => {
      expect(CANVAS_DATA_SIZE).toBe((TOTAL_PIXELS * BITS_PER_PIXEL) / 8);
      expect(CANVAS_DATA_SIZE).toBe(125000);
    });

    it('should have correct COLOR_COUNT', () => {
      expect(COLOR_COUNT).toBe(16);
    });
  });

  describe('MIN_ACCOUNT_AGE_DAYS', () => {
    it('should require 30 days minimum account age', () => {
      expect(MIN_ACCOUNT_AGE_DAYS).toBe(30);
    });
  });
});

describe('getCooldownMs function', () => {
  describe('in development mode (isProd = false)', () => {
    it('should return correct cooldown for basic tier', () => {
      const cooldown = getCooldownMs('basic', false, false);
      expect(cooldown).toBe(COOLDOWNS.DEV.BASIC_MS);
      expect(cooldown).toBe(10000); // 10 seconds
    });

    it('should return correct cooldown for premium tier', () => {
      const cooldown = getCooldownMs('premium', false, false);
      expect(cooldown).toBe(COOLDOWNS.DEV.PREMIUM_MS);
      expect(cooldown).toBe(5000); // 5 seconds
    });

    it('should return correct cooldown for verified + premium', () => {
      const cooldown = getCooldownMs('premium', true, false);
      expect(cooldown).toBe(COOLDOWNS.DEV.VERIFIED_MS);
      expect(cooldown).toBe(3000); // 3 seconds
    });

    it('should return basic cooldown for verified + basic (verified only helps with premium)', () => {
      const cooldown = getCooldownMs('basic', true, false);
      expect(cooldown).toBe(COOLDOWNS.DEV.BASIC_MS);
      expect(cooldown).toBe(10000); // 10 seconds
    });
  });

  describe('in production mode (isProd = true)', () => {
    it('should return correct cooldown for basic tier', () => {
      const cooldown = getCooldownMs('basic', false, true);
      expect(cooldown).toBe(COOLDOWNS.PRODUCTION.BASIC_MS);
      expect(cooldown).toBe(60000); // 60 seconds (1 minute)
    });

    it('should return correct cooldown for premium tier', () => {
      const cooldown = getCooldownMs('premium', false, true);
      expect(cooldown).toBe(COOLDOWNS.PRODUCTION.PREMIUM_MS);
      expect(cooldown).toBe(45000); // 45 seconds
    });

    it('should return correct cooldown for verified + premium', () => {
      const cooldown = getCooldownMs('premium', true, true);
      expect(cooldown).toBe(COOLDOWNS.PRODUCTION.VERIFIED_MS);
      expect(cooldown).toBe(30000); // 30 seconds
    });

    it('should return basic cooldown for verified + basic (verified only helps with premium)', () => {
      const cooldown = getCooldownMs('basic', true, true);
      expect(cooldown).toBe(COOLDOWNS.PRODUCTION.BASIC_MS);
      expect(cooldown).toBe(60000); // 60 seconds
    });
  });
});

describe('COOLDOWNS constant', () => {
  describe('DEV cooldowns', () => {
    it('should have correct dev basic cooldown', () => {
      expect(COOLDOWNS.DEV.BASIC_MS).toBe(10000);
    });

    it('should have correct dev premium cooldown', () => {
      expect(COOLDOWNS.DEV.PREMIUM_MS).toBe(5000);
    });

    it('should have correct dev verified cooldown', () => {
      expect(COOLDOWNS.DEV.VERIFIED_MS).toBe(3000);
    });
  });

  describe('PRODUCTION cooldowns', () => {
    it('should have correct production basic cooldown', () => {
      expect(COOLDOWNS.PRODUCTION.BASIC_MS).toBe(60000);
    });

    it('should have correct production premium cooldown', () => {
      expect(COOLDOWNS.PRODUCTION.PREMIUM_MS).toBe(45000);
    });

    it('should have correct production verified cooldown', () => {
      expect(COOLDOWNS.PRODUCTION.VERIFIED_MS).toBe(30000);
    });
  });

  describe('Legacy aliases', () => {
    it('should have legacy VERIFIED_MS', () => {
      expect(COOLDOWNS.VERIFIED_MS).toBe(5000);
    });

    it('should have legacy NORMAL_MS', () => {
      expect(COOLDOWNS.NORMAL_MS).toBe(10000);
    });
  });
});

describe('REDIS_KEYS', () => {
  describe('Static keys', () => {
    it('should have correct CANVAS_STATE key', () => {
      expect(REDIS_KEYS.CANVAS_STATE).toBe('xplace:canvas:state');
    });

    it('should have correct LEADERBOARD_FACTIONS key', () => {
      expect(REDIS_KEYS.LEADERBOARD_FACTIONS).toBe('xplace:leaderboard:factions');
    });

    it('should have correct LEADERBOARD_USERS key', () => {
      expect(REDIS_KEYS.LEADERBOARD_USERS).toBe('xplace:leaderboard:users');
    });

    it('should have correct LEADERBOARD_AGENTS key', () => {
      expect(REDIS_KEYS.LEADERBOARD_AGENTS).toBe('xplace:leaderboard:agents');
    });

    it('should have correct PUBSUB_PIXELS key', () => {
      expect(REDIS_KEYS.PUBSUB_PIXELS).toBe('xplace:pubsub:pixels');
    });

    it('should have correct WEEK_CONFIG key', () => {
      expect(REDIS_KEYS.WEEK_CONFIG).toBe('xplace:week:config');
    });

    it('should have correct CANVAS_BACKUP key', () => {
      expect(REDIS_KEYS.CANVAS_BACKUP).toBe('xplace:canvas:backup');
    });

    it('should have correct WEEKLY_CONTRIBUTORS key', () => {
      expect(REDIS_KEYS.WEEKLY_CONTRIBUTORS).toBe('xplace:weekly:contributors');
    });

    it('should have correct PUBSUB_WEEK key', () => {
      expect(REDIS_KEYS.PUBSUB_WEEK).toBe('xplace:pubsub:week');
    });
  });

  describe('Dynamic key functions', () => {
    it('should generate correct COOLDOWN key', () => {
      expect(REDIS_KEYS.COOLDOWN('user123')).toBe('xplace:cooldown:user123');
      expect(REDIS_KEYS.COOLDOWN('test-user')).toBe('xplace:cooldown:test-user');
    });

    it('should generate correct COOLDOWN_AGENT key', () => {
      expect(REDIS_KEYS.COOLDOWN_AGENT('agent123')).toBe('xplace:cooldown:agent:agent123');
      expect(REDIS_KEYS.COOLDOWN_AGENT('bot-1')).toBe('xplace:cooldown:agent:bot-1');
    });

    it('should generate correct SESSION key', () => {
      expect(REDIS_KEYS.SESSION('token123')).toBe('xplace:session:token123');
      expect(REDIS_KEYS.SESSION('abc-def')).toBe('xplace:session:abc-def');
    });

    it('should generate correct OWNERSHIP key', () => {
      expect(REDIS_KEYS.OWNERSHIP('chunk1')).toBe('xplace:ownership:chunk1');
      expect(REDIS_KEYS.OWNERSHIP('0-0')).toBe('xplace:ownership:0-0');
    });

    it('should generate correct ACTIVE_DAILY key', () => {
      expect(REDIS_KEYS.ACTIVE_DAILY('2024-01-15')).toBe('xplace:active:daily:2024-01-15');
    });

    it('should generate correct WEEKLY_PIXELS_USER key', () => {
      expect(REDIS_KEYS.WEEKLY_PIXELS_USER('user456')).toBe('xplace:weekly:pixels:user:user456');
    });

    it('should generate correct WEEKLY_PIXELS_AGENT key', () => {
      expect(REDIS_KEYS.WEEKLY_PIXELS_AGENT('agent789')).toBe('xplace:weekly:pixels:agent:agent789');
    });

    it('should generate correct SNAPSHOT key', () => {
      expect(REDIS_KEYS.SNAPSHOT('2024-01-15T12:00:00Z')).toBe('xplace:snapshot:2024-01-15T12:00:00Z');
    });

    it('should generate correct SNAPSHOT_INDEX key', () => {
      expect(REDIS_KEYS.SNAPSHOT_INDEX(3, 2024)).toBe('xplace:snapshot:index:2024:3');
      expect(REDIS_KEYS.SNAPSHOT_INDEX(52, 2025)).toBe('xplace:snapshot:index:2025:52');
    });
  });
});

describe('TIMELAPSE_CONFIG', () => {
  it('should have correct SNAPSHOT_INTERVAL_HOURS', () => {
    expect(TIMELAPSE_CONFIG.SNAPSHOT_INTERVAL_HOURS).toBe(1);
  });

  it('should have correct SNAPSHOT_RETENTION_DAYS', () => {
    expect(TIMELAPSE_CONFIG.SNAPSHOT_RETENTION_DAYS).toBe(7);
  });

  it('should have correct VIDEO_FPS', () => {
    expect(TIMELAPSE_CONFIG.VIDEO_FPS).toBe(10);
  });
});

describe('ZOOM configuration', () => {
  it('should have correct MIN zoom level', () => {
    expect(ZOOM.MIN).toBe(1);
  });

  it('should have correct MAX zoom level', () => {
    expect(ZOOM.MAX).toBe(40);
  });

  it('should have correct DEFAULT zoom level', () => {
    expect(ZOOM.DEFAULT).toBe(10);
  });

  it('should have correct DRAW zoom level', () => {
    expect(ZOOM.DRAW).toBe(20);
  });
});

describe('WS_CONFIG', () => {
  it('should have correct AUTH_TIMEOUT_MS', () => {
    expect(WS_CONFIG.AUTH_TIMEOUT_MS).toBe(10000);
  });

  it('should have correct HEARTBEAT_INTERVAL_MS', () => {
    expect(WS_CONFIG.HEARTBEAT_INTERVAL_MS).toBe(30000);
  });

  it('should have correct RECONNECT_DELAYS', () => {
    expect(WS_CONFIG.RECONNECT_DELAYS).toEqual([1000, 2000, 4000, 8000, 16000]);
  });
});
