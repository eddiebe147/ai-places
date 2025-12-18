/**
 * WebSocket connection handler
 */

import type { WebSocket } from 'ws';
import type { IncomingMessage } from 'http';
import type { Redis } from 'ioredis';
import { config } from '../config/index.js';
import { CanvasService } from '../services/redis.js';
import { handlePlacePixel } from './pixel.js';
import { REDIS_KEYS } from '@x-place/shared';
import type {
  ClientMessage,
  AuthenticatedMessage,
  AuthErrorMessage,
  CanvasStateMessage,
  PongMessage,
  ServerMessage,
} from '@x-place/shared';

export interface UserSession {
  userId: string;
  xUsername: string;
  factionId: string | null;
  isVerified: boolean;
  isSpectatorOnly: boolean;
  cooldownSeconds: number;
}

export interface ConnectionContext {
  redis: Redis;
  publisher: Redis;
  clients: Map<string, Set<WebSocket>>;
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
 * Handle a new WebSocket connection
 */
export function handleConnection(
  ws: WebSocket,
  req: IncomingMessage,
  ctx: ConnectionContext
): void {
  let authenticatedUser: UserSession | null = null;
  let authTimeout: NodeJS.Timeout | null = null;

  // Require authentication within timeout
  authTimeout = setTimeout(() => {
    if (!authenticatedUser) {
      send(ws, {
        type: 'auth_error',
        payload: { message: 'Authentication timeout' },
      } as AuthErrorMessage);
      ws.close(4001, 'Authentication timeout');
    }
  }, config.auth.timeoutMs);

  ws.on('message', async (data) => {
    try {
      const message: ClientMessage = JSON.parse(data.toString());

      // Handle authentication
      if (message.type === 'authenticate') {
        const session = await ctx.redis.get(
          REDIS_KEYS.SESSION(message.payload.token)
        );

        if (!session) {
          send(ws, {
            type: 'auth_error',
            payload: { message: 'Invalid or expired session' },
          } as AuthErrorMessage);
          ws.close(4002, 'Invalid session');
          return;
        }

        authenticatedUser = JSON.parse(session) as UserSession;

        if (authTimeout) {
          clearTimeout(authTimeout);
          authTimeout = null;
        }

        // Add to clients map
        if (!ctx.clients.has(authenticatedUser.userId)) {
          ctx.clients.set(authenticatedUser.userId, new Set());
        }
        ctx.clients.get(authenticatedUser.userId)!.add(ws);

        // Send authentication success
        send(ws, {
          type: 'authenticated',
          payload: {
            userId: authenticatedUser.userId,
            username: authenticatedUser.xUsername,
            factionId: authenticatedUser.factionId,
            cooldownSeconds: authenticatedUser.cooldownSeconds,
            isSpectatorOnly: authenticatedUser.isSpectatorOnly,
          },
        } as AuthenticatedMessage);

        // Send initial canvas state
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

        console.log(`User ${authenticatedUser.xUsername} connected`);
        return;
      }

      // All other messages require authentication
      if (!authenticatedUser) {
        send(ws, {
          type: 'auth_error',
          payload: { message: 'Not authenticated' },
        } as AuthErrorMessage);
        return;
      }

      // Route messages
      switch (message.type) {
        case 'place_pixel':
          await handlePlacePixel(ws, message, authenticatedUser, ctx);
          break;

        case 'ping':
          send(ws, {
            type: 'pong',
            payload: { serverTime: Date.now() },
          } as PongMessage);
          break;

        case 'get_canvas':
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

        default:
          console.warn('Unknown message type:', (message as any).type);
      }
    } catch (err) {
      console.error('Error handling message:', err);
    }
  });

  ws.on('close', () => {
    if (authTimeout) {
      clearTimeout(authTimeout);
    }

    if (authenticatedUser) {
      const userSockets = ctx.clients.get(authenticatedUser.userId);
      if (userSockets) {
        userSockets.delete(ws);
        if (userSockets.size === 0) {
          ctx.clients.delete(authenticatedUser.userId);
        }
      }
      console.log(`User ${authenticatedUser.xUsername} disconnected`);
    }
  });

  ws.on('error', (err) => {
    console.error('WebSocket error:', err);
  });
}
