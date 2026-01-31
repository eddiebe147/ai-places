/**
 * Redis service for AIplaces.art WebSocket server
 *
 * Observer mode - only needs to read canvas state.
 * Pixel placement and cooldowns are handled by the REST API.
 */

import Redis, { type Redis as RedisType } from 'ioredis';
import { config } from '../config/index.js';

// Redis keys (matches REST API)
const REDIS_KEYS = {
  CANVAS_STATE: 'aip:canvas:state',
  CANVAS_VERSION: 'aip:canvas:version',
} as const;

// Canvas dimensions
const CANVAS_WIDTH = 500;
const CANVAS_HEIGHT = 500;
const BITS_PER_PIXEL = 4;

export interface RedisClients {
  client: RedisType;
  publisher: RedisType;
  subscriber: RedisType;
}

/**
 * Create Redis client connections
 */
export async function createRedisClients(): Promise<RedisClients> {
  const url = config.redis.url;
  const isTls = url.startsWith('rediss://');

  console.log(`Connecting to Redis: ${url.replace(/:[^:@]*@/, ':***@')}`);

  const options = {
    maxRetriesPerRequest: 3,
    retryDelayOnFailover: 100,
    enableReadyCheck: true,
    connectTimeout: 10000,
    // Enable TLS for Upstash Redis (rediss:// URLs)
    ...(isTls && { tls: {} }),
  };

  const client = new Redis(url, options);
  const publisher = new Redis(url, options);
  const subscriber = new Redis(url, options);

  // Wait for connections
  await Promise.all([
    new Promise<void>((resolve) => client.once('ready', resolve)),
    new Promise<void>((resolve) => publisher.once('ready', resolve)),
    new Promise<void>((resolve) => subscriber.once('ready', resolve)),
  ]);

  return { client, publisher, subscriber };
}

/**
 * Canvas state operations (read-only for observer server)
 */
export class CanvasService {
  constructor(private redis: RedisType) {}

  /**
   * Get full canvas state as base64
   */
  async getFullCanvas(): Promise<string> {
    let buffer = await this.redis.getBuffer(REDIS_KEYS.CANVAS_STATE);

    if (!buffer) {
      // Return empty canvas (all white = color 0)
      const size = (CANVAS_WIDTH * CANVAS_HEIGHT * BITS_PER_PIXEL) / 8;
      buffer = Buffer.alloc(size, 0x00);
    }

    return buffer.toString('base64');
  }

  /**
   * Get canvas version (for delta updates)
   */
  async getVersion(): Promise<number> {
    const version = await this.redis.get(REDIS_KEYS.CANVAS_VERSION);
    return version ? parseInt(version, 10) : 0;
  }
}
