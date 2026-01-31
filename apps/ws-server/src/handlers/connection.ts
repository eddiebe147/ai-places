/**
 * WebSocket connection handler - Observer Mode
 *
 * This server is for human observers watching the canvas in real-time.
 * Agents use the REST API to place pixels - this server only broadcasts updates.
 */

import type { WebSocket } from 'ws';
import type { IncomingMessage } from 'http';
import type { Redis } from 'ioredis';
import { CanvasService } from '../services/redis.js';
import type {
  ClientMessage,
  CanvasStateMessage,
  PongMessage,
  ServerMessage,
  ConnectionCountMessage,
} from '@aiplaces/shared';

export interface ConnectionContext {
  redis: Redis;
  publisher: Redis;
  observers: Set<WebSocket>;
}

/**
 * Send a message to a WebSocket client
 */
export function send(ws: WebSocket, message: ServerMessage): void {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

/**
 * Broadcast observer count to all clients
 */
function broadcastObserverCount(observers: Set<WebSocket>): void {
  const count = observers.size;
  const message: ConnectionCountMessage = {
    type: 'connection_count',
    payload: { count },
  };
  const messageStr = JSON.stringify(message);

  observers.forEach((ws) => {
    if (ws.readyState === ws.OPEN) {
      ws.send(messageStr);
    }
  });
}

/**
 * Handle a new WebSocket connection (observer mode)
 *
 * Observers can:
 * - Receive real-time pixel updates
 * - Request full canvas state
 * - Ping/pong for connection health
 *
 * Observers cannot:
 * - Place pixels (use REST API)
 * - Authenticate (no login needed)
 */
export async function handleConnection(
  ws: WebSocket,
  req: IncomingMessage,
  ctx: ConnectionContext
): Promise<void> {
  // Add to observers set
  ctx.observers.add(ws);
  console.log(`Observer connected. Total: ${ctx.observers.size}`);

  // Broadcast updated observer count
  broadcastObserverCount(ctx.observers);

  // Handle incoming messages
  ws.on('message', async (data) => {
    try {
      const message: ClientMessage = JSON.parse(data.toString());

      switch (message.type) {
        case 'ping':
          send(ws, {
            type: 'pong',
            payload: { serverTime: Date.now() },
          } as PongMessage);
          break;

        case 'get_canvas': {
          const canvasService = new CanvasService(ctx.redis);
          const canvasData = await canvasService.getFullCanvas();
          send(ws, {
            type: 'canvas_state',
            payload: {
              format: 'full',
              data: canvasData,
              version: 0,
              timestamp: Date.now(),
            },
          } as CanvasStateMessage);
          break;
        }

        // Legacy message types - inform client they're not available
        case 'authenticate':
        case 'place_pixel':
        case 'join_faction':
          send(ws, {
            type: 'error',
            payload: {
              code: 'OBSERVER_MODE',
              message: 'This is an observer-only connection. Agents use the REST API to place pixels.',
            },
          } as any);
          break;

        default:
          console.warn('Unknown message type:', (message as any).type);
      }
    } catch (err) {
      console.error('Error handling message:', err);
    }
  });

  ws.on('close', () => {
    ctx.observers.delete(ws);
    console.log(`Observer disconnected. Total: ${ctx.observers.size}`);

    // Broadcast updated observer count
    broadcastObserverCount(ctx.observers);
  });

  ws.on('error', (err) => {
    console.error('WebSocket error:', err);
  });

  // Send initial canvas state
  try {
    const canvasService = new CanvasService(ctx.redis);
    const canvasData = await canvasService.getFullCanvas();
    send(ws, {
      type: 'canvas_state',
      payload: {
        format: 'full',
        data: canvasData,
        version: 0,
        timestamp: Date.now(),
      },
    } as CanvasStateMessage);
    console.log('Sent initial canvas state to observer');
  } catch (err) {
    console.error('Failed to send initial canvas state:', err);
  }
}
