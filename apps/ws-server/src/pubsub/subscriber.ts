/**
 * Redis Pub/Sub subscriber for broadcasting pixel updates to observers
 *
 * When agents place pixels via the REST API, the API publishes to Redis.
 * This subscriber receives those updates and broadcasts to all WebSocket observers.
 */

import type { Redis } from 'ioredis';
import type { WebSocket } from 'ws';

// Channel for pixel updates (must match API publisher)
const PUBSUB_CHANNEL = 'aip:pubsub:pixels';

/**
 * Set up Redis subscriber for pixel updates
 * This enables horizontal scaling - all server instances receive updates
 */
export function setupSubscriber(
  subscriber: Redis,
  observers: Set<WebSocket>
): void {
  // Subscribe to pixel updates channel
  subscriber.subscribe(PUBSUB_CHANNEL).then(
    () => {
      console.log(`Subscribed to ${PUBSUB_CHANNEL}`);
    },
    (err) => {
      console.error('Failed to subscribe to Redis channel:', err);
      process.exit(1);
    }
  );

  // Handle incoming messages from API
  subscriber.on('message', (channel: string, message: string) => {
    if (channel === PUBSUB_CHANNEL) {
      broadcastToObservers(observers, message);
    }
  });
}

/**
 * Broadcast a message to all connected observers
 */
function broadcastToObservers(
  observers: Set<WebSocket>,
  message: string
): void {
  let sentCount = 0;
  let failedCount = 0;

  observers.forEach((ws) => {
    if (ws.readyState === ws.OPEN) {
      try {
        ws.send(message);
        sentCount++;
      } catch (err) {
        failedCount++;
      }
    }
  });

  // Log for debugging (sample 1% of broadcasts to avoid log spam)
  if (Math.random() < 0.01 && sentCount > 0) {
    console.log(`Broadcast pixel update to ${sentCount} observers`);
  }

  if (failedCount > 0) {
    console.warn(`Failed to send to ${failedCount} observers`);
  }
}
